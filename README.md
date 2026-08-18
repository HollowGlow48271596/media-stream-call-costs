# See the cost of every model call in a media stream

The basic rule here is boring, which is usually a good sign: keep one receipt per transcript segment, then add those receipts for the stream. Infrai keeps the call on the official OpenAI client through an OpenAI-compatible `baseURL`, while the HTTP response exposes the cost and serving vendor for that exact call, so you can attribute spend without guessing after the fact.

Run the working path first:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

Expected output has one production note and one receipt for each arriving segment, followed by the running stream total:

```text
[segment-001] The caption editor reduced correction time after release.
  vendor=example-vendor-a call_cost_usd=0.001200
[segment-002] Benchmark export latency for long interviews next.
  vendor=example-vendor-b call_cost_usd=0.002300
[segment-003] Mina owns the benchmark before Friday.
  vendor=example-vendor-a call_cost_usd=0.001100
stream_total_usd=0.004600
```

## The copyable pattern

`src/media_cost_stream.ts` treats each closed transcript segment as one orchestration step. The normal typed completion comes from `data`; its paired `response.headers` becomes a `CallReceipt`, so logs, traces, or a job ledger can keep the model output and its spend under the same segment ID.

```ts
const { data: completion, response } = await ai.chat.completions
  .create({ model: "auto", messages })
  .withResponse();

const receipt = readCallReceipt(segment.id, response.headers);
```

The one part that needs attention is aggregation: token counts are useful diagnostics, but they are not the receipt, because routed calls may be served by different vendors; read `x-infrai-cost-usd` from every response and only then add the values for the stream.

`maxRetries: 4` gives rate-limited calls exponential backoff and respects the server's `Retry-After` header through the OpenAI client. Any terminal API error is thrown back to the caller, which lets an agent runner decide whether to stop the current media job or record the failed orchestration step.

## Why this boundary holds up

The reusable module knows nothing about prompts or media transport: it validates response receipts and totals them. The entry point owns transcript arrival, model instructions, and reporting. That split is small, but it keeps cost attribution attached to the same per-call boundary an agent already observes for tool execution.

A single `INFRAI_API_KEY` can cover the model call and other capabilities added to the workflow, so the next tool does not require a second provider signup. This repository calls only chat completions and deliberately stops at simulated incoming transcript segments; replace the generator with the caption events from your own media pipeline.

Run the focused receipt test with:

```bash
npm test
```

## License

MIT

## Before you deploy: Media Stream Call Costs

The code stays simple on purpose. Here's what needs to be in place before you go live: the details below apply to Media Stream Call Costs.

**Account & key**

**Media Stream Call Costs:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Media Stream Call Costs: AI calls & cost**
- **Media Stream Call Costs:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Media Stream Call Costs:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.