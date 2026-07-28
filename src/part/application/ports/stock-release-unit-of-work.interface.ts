export interface StockReleaseCommandItem {
  partId: string;
  quantity: number;
}

export interface StockReleaseCommand {
  commandEventId: string;
  sagaId: string;
  orderId: string;
  correlationId: string;
  reservations: StockReleaseCommandItem[];
}

export interface StockReleaseResultItem {
  partId: string;
  quantity: number;
  status: "RELEASED" | "FAILED";
  failureCode?: string;
}

export interface StockReleaseOperation {
  commandEventId: string;
  sagaId: string;
  orderId: string;
  correlationId: string;
  commandHash: string;
  resultEventName: "stock.released" | "stock.release.failed";
  resultEventId: string;
  resultOccurredAt: Date;
  resultPayload: {
    reservations: StockReleaseResultItem[];
  };
}

export interface StockReleaseUnitOfWork {
  execute(
    command: StockReleaseCommand,
    commandHash: string,
  ): Promise<StockReleaseOperation>;
}
