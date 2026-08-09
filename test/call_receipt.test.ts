import assert from "node:assert/strict";
import test from "node:test";

import { readCallReceipt, totalCost } from "../src/call_receipt.ts";

test("reads each model call receipt and totals the stream", () => {
  const first = readCallReceipt(
    "segment-001",
    new Headers({
      "x-infrai-cost-usd": "0.0012",
      "x-infrai-vendor": "example-vendor-a",
    }),
  );
  const second = readCallReceipt(
    "segment-002",
    new Headers({
      "x-infrai-cost-usd": "0.0023",
      "x-infrai-vendor": "example-vendor-b",
    }),
  );

  assert.deepEqual(first, {
    segmentId: "segment-001",
    costUsd: 0.0012,
    vendor: "example-vendor-a",
  });
  assert.equal(totalCost([first, second]), 0.0035);
});

test("rejects an incomplete call receipt", () => {
  assert.throws(
    () => readCallReceipt("segment-003", new Headers()),
    /complete call receipt/,
  );
});
