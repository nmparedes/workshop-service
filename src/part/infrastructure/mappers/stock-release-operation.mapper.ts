import { DomainException } from "../../../common/exceptions/domain.exception";
import type { StockReleaseOperation } from "../../application/ports/stock-release-unit-of-work.interface";
import { StockReleaseOperationOrmEntity } from "../typeorm/stock-release-operation.orm-entity";

export class StockReleaseOperationMapper {
  static toApplication(
    entity: StockReleaseOperationOrmEntity,
  ): StockReleaseOperation {
    if (
      !entity.result_event_name ||
      !entity.result_event_id ||
      !entity.result_occurred_at ||
      !entity.result_payload
    ) {
      throw new DomainException(
        "STOCK_RELEASE_RESULT_INCOMPLETE",
        "The persisted stock release result is incomplete.",
      );
    }
    return {
      commandEventId: entity.command_event_id,
      sagaId: entity.saga_id,
      orderId: entity.order_id,
      correlationId: entity.correlation_id,
      commandHash: entity.command_hash,
      resultEventName: entity.result_event_name,
      resultEventId: entity.result_event_id,
      resultOccurredAt: new Date(entity.result_occurred_at),
      resultPayload: {
        reservations: entity.result_payload.reservations.map((item) => ({
          ...item,
        })),
      },
    };
  }
}
