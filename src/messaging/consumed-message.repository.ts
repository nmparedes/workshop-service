import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, LessThanOrEqual, QueryFailedError, Repository } from "typeorm";
import { ConsumedMessageOrmEntity } from "./consumed-message.orm-entity";

export interface ConsumedMessageClaim {
  token: string;
}

@Injectable()
export class TypeOrmConsumedMessageRepository {
  constructor(
    @InjectRepository(ConsumedMessageOrmEntity)
    private readonly repository: Repository<ConsumedMessageOrmEntity>,
    private readonly configService: ConfigService,
  ) {}

  async claim(
    consumerName: string,
    eventId: string,
  ): Promise<ConsumedMessageClaim | null> {
    const now = new Date();
    const claimToken = randomUUID();
    const leaseExpiresAt = new Date(now.getTime() + this.leaseDurationMs());
    try {
      await this.repository.insert({
        consumerName,
        eventId,
        status: "PROCESSING",
        claimToken,
        processingStartedAt: now,
        leaseExpiresAt,
        processedAt: null,
      });
      return { token: claimToken };
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
    }

    const existing = await this.repository.findOneBy({ consumerName, eventId });
    if (!existing) {
      throw new Error("Consumed message was not found after a duplicate key.");
    }
    if (existing.status === "PROCESSED") return null;
    if (
      existing.status === "PROCESSING" &&
      existing.leaseExpiresAt &&
      existing.leaseExpiresAt > now
    ) {
      throw new Error("Consumed message is already processing.");
    }

    let claimed = await this.repository.update(
      { consumerName, eventId, status: "FAILED" },
      {
        status: "PROCESSING",
        claimToken,
        processingStartedAt: now,
        leaseExpiresAt,
        processedAt: null,
      },
    );
    if (claimed.affected !== 1 && existing.status === "PROCESSING") {
      claimed = await this.repository.update(
        [
          {
            consumerName,
            eventId,
            status: "PROCESSING",
            leaseExpiresAt: LessThanOrEqual(now),
          },
          {
            consumerName,
            eventId,
            status: "PROCESSING",
            leaseExpiresAt: IsNull(),
          },
        ],
        {
          claimToken,
          processingStartedAt: now,
          leaseExpiresAt,
          processedAt: null,
        },
      );
    }
    if (claimed.affected !== 1) {
      throw new Error("Consumed message is already processing.");
    }
    return { token: claimToken };
  }

  async markProcessed(
    consumerName: string,
    eventId: string,
    claimToken: string,
  ): Promise<void> {
    const result = await this.repository.update(
      { consumerName, eventId, status: "PROCESSING", claimToken },
      {
        status: "PROCESSED",
        processedAt: new Date(),
        claimToken: null,
        processingStartedAt: null,
        leaseExpiresAt: null,
      },
    );
    if (result.affected !== 1) {
      throw new Error("Consumed message claim was lost before completion.");
    }
  }

  async markFailed(
    consumerName: string,
    eventId: string,
    claimToken: string,
  ): Promise<void> {
    const result = await this.repository.update(
      { consumerName, eventId, status: "PROCESSING", claimToken },
      {
        status: "FAILED",
        claimToken: null,
        processingStartedAt: null,
        leaseExpiresAt: null,
      },
    );
    if (result.affected !== 1) {
      throw new Error("Consumed message claim was lost before failure.");
    }
  }

  private leaseDurationMs(): number {
    return this.configService.get<number>("CONSUMED_MESSAGE_LEASE_MS", 300000);
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as { code?: string; errno?: number };
  return driverError.code === "ER_DUP_ENTRY" || driverError.errno === 1062;
}
