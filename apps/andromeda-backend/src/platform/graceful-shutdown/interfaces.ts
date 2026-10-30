export interface ShutdownSignalSourceInterface {
  on(signal: "SIGINT" | "SIGTERM", listener: () => void): unknown;
  off(signal: "SIGINT" | "SIGTERM", listener: () => void): unknown;
}

export interface GracefulShutdownOptionsInterface {
  readonly shutdown: () => Promise<void>;
  readonly onError: (error: unknown) => void;
  readonly signalSource?: ShutdownSignalSourceInterface;
}
