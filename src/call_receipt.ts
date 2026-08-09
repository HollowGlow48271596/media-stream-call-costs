export type CallReceipt = {
  segmentId: string;
  costUsd: number;
  vendor: string;
};

export function readCallReceipt(
  segmentId: string,
  headers: Headers,
): CallReceipt {
  const cost = headers.get("x-infrai-cost-usd");
  const vendor = headers.get("x-infrai-vendor");

  if (cost === null || vendor === null) {
    throw new Error("The model response did not include a complete call receipt");
  }

  const costUsd = Number(cost);
  if (!Number.isFinite(costUsd)) {
    throw new Error("The call receipt contains an invalid cost");
  }

  return { segmentId, costUsd, vendor };
}

export function totalCost(receipts: readonly CallReceipt[]): number {
  const total = receipts.reduce((sum, receipt) => sum + receipt.costUsd, 0);
  return Math.round((total + Number.EPSILON) * 1e12) / 1e12;
}
