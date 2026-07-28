import { Inject, Injectable } from "@nestjs/common";
import { DomainException } from "../../../common/exceptions/domain.exception";
import {
  PART_REPOSITORY,
  STOCK_RESERVATION_REPOSITORY,
} from "../../part.tokens";
import { StockReservationConflictException } from "../../domain/exceptions/stock-reservation-conflict.exception";
import { StockReservationNotFoundException } from "../../domain/exceptions/stock-reservation-not-found.exception";
import type { PartRepository } from "../../domain/repositories/part.repository.interface";
import type { StockReservationRepository } from "../../domain/repositories/stock-reservation.repository.interface";
import { StockReservation } from "../../domain/entities/stock-reservation.entity";
import { StockReservationStatus } from "../../domain/enums/stock-reservation-status.enum";
import {
  ReserveStockCommand,
  StockReservationCommandIdentity,
  StockReservationResultDto,
} from "../dto/stock-reservation.dto";

@Injectable()
export class StockReservationService {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly partRepository: PartRepository,
    @Inject(STOCK_RESERVATION_REPOSITORY)
    private readonly stockReservationRepository: StockReservationRepository,
  ) {}

  async reserveStock(
    command: ReserveStockCommand,
  ): Promise<StockReservationResultDto> {
    const existingReservation = await this.findExistingReservation(command);
    if (existingReservation) {
      if (!existingReservation.matchesReservationRequest(command.quantity)) {
        throw new StockReservationConflictException(
          command.sagaId,
          command.orderId,
          command.partId,
          existingReservation.quantity,
          command.quantity,
        );
      }

      return this.toResultDto(existingReservation);
    }

    const part = await this.partRepository.findById(command.partId);
    if (!part) {
      const failedReservation = await this.stockReservationRepository.save(
        StockReservation.createFailed({
          ...command,
          failureCode: "PART_NOT_FOUND",
          failureReason: "Part was not found for stock reservation.",
        }),
      );

      return this.toResultDto(failedReservation);
    }

    try {
      part.reserveStock(command.quantity);
      await this.partRepository.save(part);

      const reservation = await this.stockReservationRepository.save(
        StockReservation.createReserved(command),
      );

      return this.toResultDto(reservation);
    } catch (error) {
      if (error instanceof DomainException) {
        const failedReservation = await this.stockReservationRepository.save(
          StockReservation.createFailed({
            ...command,
            failureCode: error.code,
            failureReason: error.message,
          }),
        );

        return this.toResultDto(failedReservation);
      }

      throw error;
    }
  }

  async releaseStockReservation(
    command: StockReservationCommandIdentity,
  ): Promise<StockReservationResultDto> {
    const reservation =
      await this.stockReservationRepository.findBySagaIdOrderIdPartId(
        command.sagaId,
        command.orderId,
        command.partId,
      );

    if (!reservation) {
      throw new StockReservationNotFoundException(
        command.sagaId,
        command.orderId,
        command.partId,
      );
    }

    if (reservation.status !== StockReservationStatus.RESERVED) {
      return this.toResultDto(reservation);
    }

    return this.applyReservationSettlement(reservation, "release");
  }

  async commitStockReservation(
    command: StockReservationCommandIdentity,
  ): Promise<StockReservationResultDto> {
    const reservation =
      await this.stockReservationRepository.findBySagaIdOrderIdPartId(
        command.sagaId,
        command.orderId,
        command.partId,
      );

    if (!reservation) {
      throw new StockReservationNotFoundException(
        command.sagaId,
        command.orderId,
        command.partId,
      );
    }

    if (reservation.status !== StockReservationStatus.RESERVED) {
      return this.toResultDto(reservation);
    }

    return this.applyReservationSettlement(reservation, "commit");
  }

  private async applyReservationSettlement(
    reservation: StockReservation,
    operation: "release" | "commit",
  ): Promise<StockReservationResultDto> {
    const part = await this.partRepository.findById(reservation.partId);
    if (!part) {
      reservation.fail(
        "PART_NOT_FOUND",
        "Part was not found while settling the stock reservation.",
      );
      return this.toResultDto(
        await this.stockReservationRepository.save(reservation),
      );
    }

    try {
      if (operation === "release") {
        part.releaseStock(reservation.quantity);
        reservation.release();
      } else {
        part.commitReservedStock(reservation.quantity);
        reservation.commit();
      }

      await this.partRepository.save(part);
      return this.toResultDto(
        await this.stockReservationRepository.save(reservation),
      );
    } catch (error) {
      if (error instanceof DomainException) {
        reservation.fail(error.code, error.message);
        return this.toResultDto(
          await this.stockReservationRepository.save(reservation),
        );
      }

      throw error;
    }
  }

  private async findExistingReservation(
    command: StockReservationCommandIdentity,
  ): Promise<StockReservation | null> {
    return this.stockReservationRepository.findBySagaIdOrderIdPartId(
      command.sagaId,
      command.orderId,
      command.partId,
    );
  }

  private toResultDto(
    reservation: StockReservation,
  ): StockReservationResultDto {
    return {
      id: reservation.id,
      sagaId: reservation.sagaId,
      orderId: reservation.orderId,
      partId: reservation.partId,
      quantity: reservation.quantity,
      status: reservation.status,
      failureCode: reservation.failureCode,
      failureReason: reservation.failureReason,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
