import { vi } from "vitest";
import type { Mocked } from "vitest";
import type { ObservabilityInterface } from "./observability";

export const makeObservabilityMock = (): Mocked<ObservabilityInterface> => ({
  event: vi.fn<ObservabilityInterface["event"]>(),
  capture: vi.fn<ObservabilityInterface["capture"]>(),
});
