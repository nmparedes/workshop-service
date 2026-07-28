import type { OrderFlowMessageEnvelope } from "./order-flow-message.interface";

export interface StockReservationRequestPayload {
  reservations: Array<{
    partId: string;
    quantity: number;
  }>;
}

export interface StockReservationStatePayload {
  reservations: Array<{
    partId: string;
    quantity: number;
    failureCode?: string;
  }>;
}

export interface StockReleasedPayload {
  reservations: Array<{
    partId: string;
    quantity: number;
    status: "RELEASED";
  }>;
}

export interface StockReleaseFailedPayload {
  reservations: Array<{
    partId: string;
    quantity: number;
    status: "RELEASED" | "FAILED";
    failureCode?: string;
  }>;
}

export type ExecutionRequestPayload = Record<string, never>;

export interface ExecutionStatePayload {
  failureCode?: string;
}

export type StockReserveRequestedMessage = OrderFlowMessageEnvelope<
  "stock.reserve.requested",
  StockReservationRequestPayload
>;
export type StockReleaseRequestedMessage = OrderFlowMessageEnvelope<
  "stock.release.requested",
  StockReservationRequestPayload
>;
export type ExecutionRequestedMessage = OrderFlowMessageEnvelope<
  "execution.requested",
  ExecutionRequestPayload
>;
export type StockReservedMessage = OrderFlowMessageEnvelope<
  "stock.reserved",
  StockReservationStatePayload
>;
export type StockReservationFailedMessage = OrderFlowMessageEnvelope<
  "stock.reservation.failed",
  StockReservationStatePayload
>;
export type StockReleasedMessage = OrderFlowMessageEnvelope<
  "stock.released",
  StockReleasedPayload
>;
export type StockReleaseFailedMessage = OrderFlowMessageEnvelope<
  "stock.release.failed",
  StockReleaseFailedPayload
>;
export type ExecutionStartedMessage = OrderFlowMessageEnvelope<
  "execution.started",
  ExecutionStatePayload
>;
export type ExecutionFinishedMessage = OrderFlowMessageEnvelope<
  "execution.finished",
  ExecutionStatePayload
>;
export type ExecutionFailedMessage = OrderFlowMessageEnvelope<
  "execution.failed",
  ExecutionStatePayload
>;
