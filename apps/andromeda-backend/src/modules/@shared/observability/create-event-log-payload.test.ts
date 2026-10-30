import { describe, expect, it } from "vitest";
import { createEventLogPayload } from "./create-event-log-payload";

interface MakeSutInterface {
  sut: typeof createEventLogPayload;
}

const makeSut = (): MakeSutInterface => ({ sut: createEventLogPayload });

describe("createEventLogPayload", () => {
  describe("when an event label is invalid", () => {
    it.each(["", "Bearer synthetic-token", "synthetic\nline", "synthetic\n", "x".repeat(129)])(
      "should use a fixed fallback without logging the invalid label %j",
      (name) => {
        const { sut } = makeSut();

        const payload = sut(name);

        expect(payload.event).toBe("observability.event");
        expect(JSON.stringify(payload)).not.toContain("synthetic");
      },
    );
  });
});
