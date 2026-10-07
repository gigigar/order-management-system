import { describe, expect, it } from "vitest";
import { creditsFrom } from "./agent-credits";

describe("creditsFrom", () => {
  it("gives no credits when the Main office handles it", () => {
    expect(
      creditsFrom({
        agentId: null,
        secondAgentId: null,
        secondAgentShare: null,
      }),
    ).toEqual([]);
  });

  it("gives one Agent 100%", () => {
    expect(
      creditsFrom({ agentId: 4, secondAgentId: null, secondAgentShare: null }),
    ).toEqual([{ agentId: 4, sharePercent: 100 }]);
  });

  it("splits between two Agents so shares add up to 100", () => {
    const credits = creditsFrom({
      agentId: 4,
      secondAgentId: 9,
      secondAgentShare: 30,
    });
    expect(credits).toEqual([
      { agentId: 4, sharePercent: 70 },
      { agentId: 9, sharePercent: 30 },
    ]);
    expect(credits.reduce((sum, c) => sum + c.sharePercent, 0)).toBe(100);
  });
});
