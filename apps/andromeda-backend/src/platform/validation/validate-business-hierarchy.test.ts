import { describe, expect, it } from "vitest";
import { makeFoundation } from "@shared/tests/factories/foundation";
import type { BusinessFixtureInterface } from "./business-fixture";
import { InvalidBusinessHierarchyError, validateBusinessHierarchy } from "./validate-business-hierarchy";

interface MakeSutInterface {
  sut(): ReturnType<typeof validateBusinessHierarchy>;
  fixture: BusinessFixtureInterface;
}

const makeSut = (fixture = makeFoundation()): MakeSutInterface => ({
  sut: () => validateBusinessHierarchy(fixture),
  fixture,
});

describe("validateBusinessHierarchy", () => {
  describe("when the controlled hierarchy is valid", () => {
    it("should order parents before children even if fixture input is reversed", () => {
      const fixture = makeFoundation();
      fixture.locations.reverse();
      const { sut } = makeSut(fixture);

      const ordered = sut();

      expect(ordered).toHaveLength(6);
      for (const location of ordered) {
        if (location.parentLocationId !== null) {
          expect(ordered.findIndex((parent) => parent.id === location.parentLocationId))
            .toBeLessThan(ordered.indexOf(location));
        }
      }
      expect(fixture.locations[0]?.id).toBe("l1b");
    });

    it("should create independent fixture values with explicit nullable references", () => {
      const { fixture, sut } = makeSut();
      fixture.actors[0]!.name = "CHANGED";
      expect(makeFoundation().actors[0]?.name).toBe("OPERATOR");
      expect(fixture.actors.every((actor) => Object.hasOwn(actor, "ownerActorId"))).toBe(true);
      expect(fixture.actors.filter((actor) => actor.kind === "human").every((actor) => actor.ownerActorId === null)).toBe(true);
      expect(sut().filter((location) => location.kind === "plant").map((location) => location.parentLocationId)).toEqual([null, null]);
    });
  });

  describe("when location relationships are invalid", () => {
    it.each([
      ["a cycle", "p1a", "parentLocationId", "l1a"],
      ["a self cycle", "l1a", "parentLocationId", "l1a"],
      ["an unknown parent", "l1a", "parentLocationId", "missing"],
      ["a foreign parent", "l1a", "parentLocationId", "a1b"],
      ["a root area", "a1a", "parentLocationId", null],
      ["a root line", "l1a", "parentLocationId", null],
      ["an area under a line", "a1a", "parentLocationId", "l1a"],
      ["a line under a plant", "l1a", "parentLocationId", "p1a"],
      ["a plant under a plant", "p1a", "parentLocationId", "p1b"],
      ["an unsupported root warehouse", "p1a", "kind", "warehouse"],
      ["an unsupported warehouse child", "l1a", "kind", "warehouse"],
      ["an unknown tenant", "p1a", "tenantId", "missing"],
    ] as const)("should refuse %s", (_, id, field, value) => {
      const { fixture, sut } = makeSut();
      const location = fixture.locations.find((entry) => entry.id === id)!;
      Object.assign(location, {
        [field]: value,
      });

      expect(sut).toThrowError(InvalidBusinessHierarchyError);
      expect(sut).toThrowError("Business fixture hierarchy is invalid.");
    });

    it("should refuse duplicate stable location identity", () => {
      const { fixture, sut } = makeSut();
      fixture.locations.push({
        ...fixture.locations[0]!,
      });
      expect(sut).toThrowError(InvalidBusinessHierarchyError);
      expect(sut).toThrowError("Business fixture hierarchy is invalid.");
    });
  });

  describe("when a machine has no tenant-owned line", () => {
    it.each(["missing", "l1b", "a1a", "p1a"])("should refuse location %s", (locationId) => {
      const { fixture, sut } = makeSut();
      fixture.machines[0]!.locationId = locationId;
      expect(sut).toThrowError(InvalidBusinessHierarchyError);
      expect(sut).toThrowError("Business fixture hierarchy is invalid.");
    });
  });
});
