import { randomUUID } from "node:crypto";
import { DomainException } from "../../../common/exceptions/domain.exception";
import { QuantityInvalidException } from "../exceptions/quantity-invalid.exception";
import { StockReservationStatus } from "../enums/stock-reservation-status.enum";

interface StockReservationProps {
  id?: string;
  sagaId: string;
  orderId: string;
  partId: string;
  quantity: number;
  status: StockReservationStatus;
  failureCode?: string | null;
  failureReason?: string | null;
  releasedByEventId?: string | null;
  releasedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StockReservation {
  private readonly reservationId: string;
  private readonly reservationSagaId: string;
  private readonly reservationOrderId: string;
  private readonly reservationPartId: string;
  private readonly reservationQuantity: number;
  private reservationStatus: StockReservationStatus;
  private reservationFailureCode: string | null;
  private reservationFailureReason: string | null;
  private reservationReleasedByEventId: string | null;
  private reservationReleasedAt: Date | null;
  private readonly reservationCreatedAt: Date;
  private reservationUpdatedAt: Date;

  private constructor(props: StockReservationProps) {
    this.reservationId = props.id ?? randomUUID();
    this.reservationSagaId = this.validateIdentifier("sagaId", props.sagaId);
    this.reservationOrderId = this.validateIdentifier("orderId", props.orderId);
    this.reservationPartId = this.validateIdentifier("partId", props.partId);
    this.reservationQuantity = this.validateQuantity(props.quantity);
    this.reservationStatus = props.status;
    this.reservationFailureCode = props.failureCode ?? null;
    this.reservationFailureReason = props.failureReason ?? null;
    this.reservationReleasedByEventId = props.releasedByEventId ?? null;
    this.reservationReleasedAt = props.releasedAt
      ? new Date(props.releasedAt)
      : null;
    this.reservationCreatedAt = props.createdAt ?? new Date();
    this.reservationUpdatedAt = props.updatedAt ?? new Date();
  }

  static createReserved(
    props: Omit<
      StockReservationProps,
      | "id"
      | "status"
      | "failureCode"
      | "failureReason"
      | "createdAt"
      | "updatedAt"
    > &
      Partial<Pick<StockReservationProps, "id" | "createdAt" | "updatedAt">>,
  ): StockReservation {
    return new StockReservation({
      ...props,
      status: StockReservationStatus.RESERVED,
    });
  }

  static createFailed(
    props: Omit<
      StockReservationProps,
      "id" | "status" | "createdAt" | "updatedAt"
    > &
      Partial<Pick<StockReservationProps, "id" | "createdAt" | "updatedAt">>,
  ): StockReservation {
    return new StockReservation({
      ...props,
      status: StockReservationStatus.FAILED,
    });
  }

  static restore(props: StockReservationProps): StockReservation {
    return new StockReservation(props);
  }

  matchesReservationRequest(quantity: number): boolean {
    return this.reservationQuantity === quantity;
  }

  release(releasedByEventId?: string, releasedAt = new Date()): void {
    if (releasedByEventId !== undefined && !releasedByEventId.trim()) {
      throw new DomainException(
        "STOCK_RELEASE_EVENT_ID_REQUIRED",
        "releasedByEventId cannot be empty.",
      );
    }
    this.reservationStatus = StockReservationStatus.RELEASED;
    this.reservationFailureCode = null;
    this.reservationFailureReason = null;
    this.reservationReleasedByEventId = releasedByEventId?.trim() ?? null;
    this.reservationReleasedAt = new Date(releasedAt);
    this.reservationUpdatedAt = new Date(releasedAt);
  }

  commit(): void {
    this.reservationStatus = StockReservationStatus.COMMITTED;
    this.reservationFailureCode = null;
    this.reservationFailureReason = null;
    this.reservationUpdatedAt = new Date();
  }

  fail(code: string, reason: string): void {
    this.reservationStatus = StockReservationStatus.FAILED;
    this.reservationFailureCode = code;
    this.reservationFailureReason = reason;
    this.reservationUpdatedAt = new Date();
  }

  private validateIdentifier(field: string, value: string): string {
    if (!value?.trim()) {
      throw new DomainException(
        "STOCK_RESERVATION_IDENTIFIER_REQUIRED",
        `${field} is required.`,
        { field },
      );
    }

    return value.trim();
  }

  private validateQuantity(quantity: number): number {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new QuantityInvalidException(
        quantity,
        "Reservation quantity must be a positive integer.",
      );
    }

    return quantity;
  }

  get id(): string {
    return this.reservationId;
  }

  get sagaId(): string {
    return this.reservationSagaId;
  }

  get orderId(): string {
    return this.reservationOrderId;
  }

  get partId(): string {
    return this.reservationPartId;
  }

  get quantity(): number {
    return this.reservationQuantity;
  }

  get status(): StockReservationStatus {
    return this.reservationStatus;
  }

  get failureCode(): string | null {
    return this.reservationFailureCode;
  }

  get failureReason(): string | null {
    return this.reservationFailureReason;
  }

  get releasedByEventId(): string | null {
    return this.reservationReleasedByEventId;
  }

  get releasedAt(): Date | null {
    return this.reservationReleasedAt
      ? new Date(this.reservationReleasedAt)
      : null;
  }

  get createdAt(): Date {
    return this.reservationCreatedAt;
  }

  get updatedAt(): Date {
    return this.reservationUpdatedAt;
  }
}
