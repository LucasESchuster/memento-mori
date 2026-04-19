import { vi } from "vitest";

export type SentEmail = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
};

type State = {
  sent: SentEmail[];
  failNext: number;
  constructorCalls: Array<unknown[]>;
};

const state: State = {
  sent: [],
  failNext: 0,
  constructorCalls: [],
};

export function getSentEmails(): SentEmail[] {
  return state.sent;
}

export function resetSentEmails(): void {
  state.sent.length = 0;
  state.failNext = 0;
  state.constructorCalls.length = 0;
}

export function failNextSend(times = 1): void {
  state.failNext = times;
}

export function getConstructorCalls(): Array<unknown[]> {
  return state.constructorCalls;
}

export function installResendMock(): void {
  vi.mock("resend", () => {
    class Resend {
      emails: {
        send: (args: SentEmail) => Promise<{ id: string }>;
      };
      constructor(...args: unknown[]) {
        state.constructorCalls.push(args);
        this.emails = {
          send: async (args: SentEmail) => {
            if (state.failNext > 0) {
              state.failNext -= 1;
              throw new Error("resend mock: forced failure");
            }
            state.sent.push(args);
            return { id: `mock_${state.sent.length}` };
          },
        };
      }
    }
    return { Resend };
  });
}

// Install immediately on import so vi.mock is hoisted correctly.
installResendMock();
