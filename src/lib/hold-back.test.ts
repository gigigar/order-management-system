import { describe, expect, it } from "vitest";
import { heldStageToSave, orderStage } from "./hold-back";

describe("orderStage", () => {
  it("follows the Batch when the Order isn't held back", () => {
    expect(orderStage(null, "finishing")).toBe("finishing");
  });

  it("uses the Order's own Stage when it's held back", () => {
    expect(orderStage("casting", "finishing")).toBe("casting");
  });
});

describe("heldStageToSave", () => {
  it("leaves a student who isn't held back following the Batch", () => {
    expect(
      heldStageToSave({ saved: null, chosen: null, batchStage: "casting" }),
    ).toBeNull();
  });

  it("keeps a new hold even at the Batch's own Stage", () => {
    expect(
      heldStageToSave({
        saved: null,
        chosen: "casting",
        batchStage: "casting",
      }),
    ).toBe("casting");
  });

  it("keeps that hold when saved again with no Stage change", () => {
    expect(
      heldStageToSave({
        saved: "casting",
        chosen: "casting",
        batchStage: "casting",
      }),
    ).toBe("casting");
  });

  it("keeps the hold while the student is moving but hasn't caught up", () => {
    expect(
      heldStageToSave({
        saved: "casting",
        chosen: "finishing",
        batchStage: "finalizing",
      }),
    ).toBe("finishing");
  });

  it("rejoins the Batch when the student's Stage reaches it", () => {
    expect(
      heldStageToSave({
        saved: "casting",
        chosen: "finishing",
        batchStage: "finishing",
      }),
    ).toBeNull();
  });

  it("lets Remove undo a hold", () => {
    expect(
      heldStageToSave({
        saved: "casting",
        chosen: null,
        batchStage: "finishing",
      }),
    ).toBeNull();
  });
});
