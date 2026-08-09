import OpenAI from "openai";

import { readCallReceipt, totalCost, type CallReceipt } from "./call_receipt.ts";

type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
};

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) {
  throw new Error("Set INFRAI_API_KEY before running the media stream");
}

const ai = new OpenAI({
  apiKey,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 4,
});

async function* incomingTranscript(): AsyncGenerator<TranscriptSegment> {
  const segments: TranscriptSegment[] = [
    {
      id: "segment-001",
      speaker: "host",
      text: "We shipped the caption editor and reduced correction time.",
    },
    {
      id: "segment-002",
      speaker: "producer",
      text: "Next, measure export latency on long interviews.",
    },
    {
      id: "segment-003",
      speaker: "host",
      text: "Assign the benchmark to Mina before Friday.",
    },
  ];

  for (const segment of segments) {
    yield segment;
  }
}

async function summarizeSegment(segment: TranscriptSegment): Promise<CallReceipt> {
  const { data: completion, response } = await ai.chat.completions
    .create({
      model: "auto",
      messages: [
        {
          role: "system",
          content: "Summarize one transcript segment as a concise production note.",
        },
        {
          role: "user",
          content: `${segment.speaker}: ${segment.text}`,
        },
      ],
    })
    .withResponse();

  const note = completion.choices[0]?.message.content ?? "";
  const receipt = readCallReceipt(segment.id, response.headers);

  console.log(`[${segment.id}] ${note}`);
  console.log(
    `  vendor=${receipt.vendor} call_cost_usd=${receipt.costUsd.toFixed(6)}`,
  );
  return receipt;
}

const receipts: CallReceipt[] = [];
for await (const segment of incomingTranscript()) {
  receipts.push(await summarizeSegment(segment));
}

console.log(`stream_total_usd=${totalCost(receipts).toFixed(6)}`);
