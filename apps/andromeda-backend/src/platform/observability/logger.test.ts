import { Writable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { RepositoryUnavailableError } from "@shared/errors/repository.error";
import { PinoObservability } from "./logger";

interface LogRecordInterface {
  level: number;
  time: string;
  event: string;
  context: Record<string, unknown>;
  errorCategory?: string;
}

interface MakeSutOptions {
  records?: LogRecordInterface[];
}

interface MakeSutInterface {
  sut: PinoObservability;
  records: LogRecordInterface[];
  chunks: string[];
}

const makeSut = (options: MakeSutOptions = {}): MakeSutInterface => {
  const records = options.records ?? [];
  const chunks: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      const line = chunk.toString();
      chunks.push(line);
      records.push(JSON.parse(line));
      callback();
    },
  });

  return {
    sut: new PinoObservability(destination),
    records,
    chunks,
  };
};

describe("PinoObservability", () => {
  describe("when recording a structured event", () => {
    it.each([
      ["allowed", "policy_allow"],
      ["denied", "policy_deny"],
      ["indeterminate", "provider_unavailable"],
    ])("should preserve approved %s metadata in real Pino JSON at info level", (result, reasonCategory) => {
      const { sut, records } = makeSut();
      const context = {
        invocationId: "invocation-1",
        actorId: "u-operator",
        tenantId: "ta",
        action: "quantities:good:report",
        resource: {
          kind: "machine",
          id: "m1a",
        },
        result,
        reasonCategory,
        occurredAt: "2026-10-30T16:00:00.000Z",
        policyVersion: "authorization-m0-v2",
        scenarioVersion: "ep00-m0-v2",
      };

      sut.event("authorization.check", context);

      expect(records).toHaveLength(1);
      expect(records[0]).toEqual({
        level: 30,
        time: expect.any(String),
        event: "authorization.check",
        context,
      });
      expect(Number.isNaN(Date.parse(records[0]!.time))).toBe(false);
    });

    it.each(["completed", "business_unavailable"])("should retain an allowed decision after correlated business outcome %s", (outcome) => {
      const { sut, records } = makeSut();

      sut.event("authorization.check", {
        invocationId: "invocation-2",
        result: "allowed",
        reasonCategory: "policy_allow",
      });
      sut.event("validation.completed", {
        invocationId: "invocation-2",
        outcome,
      });

      expect(records).toHaveLength(2);
      expect(records[0]).toMatchObject({
        event: "authorization.check",
        context: {
          invocationId: "invocation-2",
          result: "allowed",
          reasonCategory: "policy_allow",
        },
      });
      expect(records[1]).toMatchObject({
        event: "validation.completed",
        context: {
          invocationId: "invocation-2",
          outcome,
        },
      });
    });

    it("should record a named event without optional context", () => {
      const { sut, records } = makeSut();

      sut.event("service.ready");

      expect(records[0]).toMatchObject({
        event: "service.ready",
        context: {},
        level: 30,
      });
    });
  });

  describe("when capturing a failure", () => {
    it("should omit raw exception details and its entire cause chain", () => {
      const { sut, records, chunks } = makeSut();
      const cause = new Error("synthetic-sql-password", {
        cause: {
          query: "synthetic-sql-query",
          token: "synthetic-provider-token",
        },
      });
      const error = new RepositoryUnavailableError("synthetic-driver-message", {
        cause,
      });
      error.stack = "synthetic-sensitive-stack";
      const toJSON = vi.fn(() => ({
        secret: "synthetic-serializer-secret",
      }));
      Object.assign(error, {
        toJSON,
      });

      sut.capture(error);

      expect(records[0]).toEqual({
        level: 50,
        time: expect.any(String),
        event: "error.captured",
        errorCategory: "repository_unavailable",
        context: {},
      });
      expect(chunks.join("")).not.toContain("synthetic-");
      expect(toJSON).not.toHaveBeenCalled();
    });

  });

  describe("when context contains unrelated or sensitive content", () => {
    it("should discard unknown fields and project only resource identity", () => {
      const { sut, records, chunks } = makeSut();

      sut.event("validation.completed", {
        tenantId: "ta",
        password: "synthetic-password",
        authorization: "Bearer synthetic-token",
        headers: {
          cookie: "synthetic-cookie",
        },
        providerResponse: {
          storeId: "synthetic-provider-store",
        },
        sql: "synthetic-query",
        foreignTenantName: "synthetic-foreign-tenant",
        resource: {
          kind: "machine",
          id: "m1a",
          name: "synthetic-machine-name",
          tenantId: "synthetic-foreign-owner",
          branding: {
            logo: "synthetic-logo",
          },
        },
      });

      expect(records[0]?.context).toEqual({
        tenantId: "ta",
        resource: {
          kind: "machine",
          id: "m1a",
        },
      });
      expect(chunks.join("")).not.toContain("synthetic-");
    });

    it("should prevent context from overriding event, severity, timestamp or capture category", () => {
      const { sut, records } = makeSut();

      sut.capture(new Error("private"), {
        event: "spoofed.event",
        level: 10,
        time: "spoofed-time",
        errorCategory: "spoofed-category",
        result: "denied",
      });

      expect(records[0]).toMatchObject({
        event: "error.captured",
        level: 50,
        errorCategory: "unexpected_error",
        context: {
          result: "denied",
        },
      });
      expect(Number.isNaN(Date.parse(records[0]!.time))).toBe(false);
    });

  });
});
