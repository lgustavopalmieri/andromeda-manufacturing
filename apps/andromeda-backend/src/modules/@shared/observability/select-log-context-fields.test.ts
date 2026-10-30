import { describe, expect, it, vi } from "vitest";
import type { ObservabilityContextInterface } from "./observability";
import { selectLogContextFields } from "./select-log-context-fields";

interface MakeSutInterface {
  sut: typeof selectLogContextFields;
}

const makeSut = (): MakeSutInterface => ({
  sut: selectLogContextFields,
});

describe("selectLogContextFields", () => {
  describe("when context contains unrelated or sensitive content", () => {
    it.each([null, 17, true, {}, [], new Error("synthetic-nested-error")])(
      "should omit a non-string approved metadata value %j",
      (value) => {
        const { sut } = makeSut();

        const selected = sut({
          actorId: value,
          tenantId: "ta",
        });

        expect(selected).toEqual({
          tenantId: "ta",
        });
      },
    );

    it.each(["", "Bearer synthetic-token", "synthetic\nline", "synthetic\n", "x".repeat(257)])(
      "should omit malformed or oversized metadata strings %j",
      (value) => {
        const { sut } = makeSut();

        const selected = sut({
          actorId: value,
        });

        expect(selected).toEqual({});
        expect(JSON.stringify(selected)).not.toContain("synthetic");
      },
    );

    it("should preserve the maximum supported identifier length", () => {
      const { sut } = makeSut();
      const actorId = "x".repeat(256);

      const selected = sut({
        actorId,
      });

      expect(selected).toEqual({
        actorId,
      });
    });

    it.each([{
      id: "m1a",
    }, {
      kind: "machine",
    }, {
      id: {},
      kind: "machine",
    }, null, []])(
      "should omit an incomplete or malformed resource %j",
      (resource) => {
        const { sut } = makeSut();

        const selected = sut({
          resource,
        });

        expect(selected).toEqual({});
      },
    );

    it("should avoid invoking getters or caller serialization hooks", () => {
      const { sut } = makeSut();
      const getter = vi.fn(() => { throw new Error("synthetic-getter-secret"); });
      const toJSON = vi.fn(() => { throw new Error("synthetic-json-secret"); });
      const context = {
        tenantId: "ta",
        resource: {
          kind: "machine",
          toJSON,
        },
        toJSON,
      };
      Object.defineProperty(context, "actorId", {
        get: getter,
      });
      Object.defineProperty(context.resource, "id", {
        get: getter,
      });

      const selected = sut(context);

      expect(selected).toEqual({
        tenantId: "ta",
      });
      expect(getter).not.toHaveBeenCalled();
      expect(toJSON).not.toHaveBeenCalled();
    });

    it("should leave frozen input objects unchanged", () => {
      const { sut } = makeSut();
      const resource = Object.freeze({
        kind: "machine",
        id: "m1a",
        name: "private",
      });
      const context = Object.freeze({
        tenantId: "ta",
        resource,
        token: "private",
      });

      const selected = sut(context);

      expect(context).toEqual({
        tenantId: "ta",
        resource,
        token: "private",
      });
      expect(resource).toEqual({
        kind: "machine",
        id: "m1a",
        name: "private",
      });
      expect(selected).toEqual({
        tenantId: "ta",
        resource: {
          kind: "machine",
          id: "m1a",
        },
      });
    });

    it("should ignore inherited metadata", () => {
      const { sut } = makeSut();
      const context = Object.assign(Object.create({
        actorId: "foreign-actor",
      }), {
        tenantId: "ta",
      });

      const selected = sut(context);

      expect(selected).toEqual({
        tenantId: "ta",
      });
    });

    it("should safely ignore malformed runtime context", () => {
      const { sut } = makeSut();

      const selected = sut(null as unknown as ObservabilityContextInterface);

      expect(selected).toEqual({});
    });

    it("should safely discard context when property inspection throws", () => {
      const { sut } = makeSut();
      const context = new Proxy({}, {
        getOwnPropertyDescriptor() { throw new Error("synthetic-property-secret"); },
      });

      const selected = sut(context);

      expect(selected).toEqual({});
      expect(JSON.stringify(selected)).not.toContain("synthetic-");
    });
  });

});
