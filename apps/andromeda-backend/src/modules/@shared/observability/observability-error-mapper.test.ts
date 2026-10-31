import { describe, expect, it } from "vitest";
import {
  RepositoryError,
  RepositoryUnavailableError,
} from "@shared/errors/repository.error";
import { mapErrorToLogCategory } from "./observability-error-mapper";

interface MakeSutInterface {
  sut: typeof mapErrorToLogCategory;
}

const makeSut = (): MakeSutInterface => ({
  sut: mapErrorToLogCategory,
});

describe("mapErrorToLogCategory", () => {
  describe("when mapping a layer-classified error", () => {
    it.each([
      [
        new RepositoryUnavailableError("synthetic-storage-message"),
        "repository_unavailable",
      ],
      [new RepositoryError("synthetic-repository-message"), "repository_error"],
      [new Error("synthetic-native-message"), "unexpected_error"],
      ["synthetic-thrown-secret", "unknown_error"],
      [null, "unknown_error"],
      [undefined, "unknown_error"],
    ])("should return the safe category for %j", (error, category) => {
      const { sut } = makeSut();

      const result = sut(error);

      expect(result).toBe(category);
      expect(result).not.toContain("synthetic-");
    });
  });

  describe("when a thrown object prevents prototype inspection", () => {
    it("should return the fixed unknown category without reading technical details", () => {
      const { sut } = makeSut();
      const error = new Proxy(
        {},
        {
          getPrototypeOf() {
            throw new Error("synthetic-prototype-secret");
          },
        },
      );

      const result = sut(error);

      expect(result).toBe("unknown_error");
    });
  });
});
