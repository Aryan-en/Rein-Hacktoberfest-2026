import { AiProviderError, type AiProvider, type AiRawResponse, type AiRequest } from "../src/types/ai";

export const findingsJson = (over: Record<string, unknown> = {}): string =>
  JSON.stringify({
    schemaVersion: 1,
    category: "phishing",
    aiRisk: "high",
    summary: { en: "This message imitates a bank and asks for an OTP.", hi: "यह संदेश बैंक की नकल करता है और OTP माँगता है।" },
    manipulationTechniques: [{ id: "urgency", explanation: { en: "Deadline pressure.", hi: "समय का दबाव।" } }],
    evidence: [{ quote: "Update within 24 hrs", why: { en: "Artificial deadline.", hi: "बनावटी समय-सीमा।" } }],
    uncertainties: [{ en: "Sender identity cannot be confirmed.", hi: "भेजने वाले की पहचान की पुष्टि नहीं हो सकती।" }],
    injectionAttemptDetected: false,
    ...over,
  });

export type Step = string | AiProviderError | ((req: AiRequest) => string | Promise<string>);

/** Scripted provider: each call consumes the next step. */
export class FakeProvider implements AiProvider {
  readonly id = "fake";
  calls: AiRequest[] = [];
  constructor(private steps: Step[]) {}
  async generate(req: AiRequest): Promise<AiRawResponse> {
    this.calls.push(req);
    const step = this.steps.shift() ?? this.steps[this.steps.length - 1];
    if (step === undefined) throw new AiProviderError("server", "no step");
    if (step instanceof AiProviderError) throw step;
    const text = typeof step === "function" ? await step(req) : step;
    return { text, latencyMs: 1 };
  }
}

export const KYC_PHISH = "SBI KYC expired! Update within 24 hrs: http://sbi-kyc-verify.top/login or your account will be blocked. Share OTP to verify.";
