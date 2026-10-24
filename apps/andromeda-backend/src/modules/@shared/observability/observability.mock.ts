import { vi } from "vitest";
import type { ObservabilityInterface } from "./observability";

export const makeObservabilityMock = (): ObservabilityInterface => ({
  capture: vi.fn(),
});
