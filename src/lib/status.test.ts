import { describe, expect, it } from "vitest";
import { PRODUCTION_STAGES } from "./enums";
import { STATUSES, stageToStatus } from "./status";

describe("stageToStatus", () => {
  it.each([
    ["order_received", "received"],
    ["mold", "in_production"],
    ["casting", "in_production"],
    ["finishing", "in_production"],
    ["finalizing", "in_production"],
    ["ready", "ready"],
    ["delivered", "delivered"],
  ] as const)("maps %s to %s", (stage, status) => {
    expect(stageToStatus(stage)).toBe(status);
  });

  it("never moves backward as the Stage moves forward", () => {
    const positions = PRODUCTION_STAGES.map((stage) =>
      STATUSES.indexOf(stageToStatus(stage)),
    );
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("reaches every Status", () => {
    expect(new Set(PRODUCTION_STAGES.map(stageToStatus))).toEqual(
      new Set(STATUSES),
    );
  });
});
