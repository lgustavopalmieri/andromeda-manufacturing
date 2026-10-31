import type { GracefulShutdownOptionsInterface } from "./interfaces";

export const registerGracefulShutdown = (
  options: GracefulShutdownOptionsInterface,
): (() => void) => {
  const signalSource = options.signalSource ?? process;
  let stopping = false;

  const removeSignalHandlers = (): void => {
    signalSource.off("SIGINT", onSignal);
    signalSource.off("SIGTERM", onSignal);
  };
  const onSignal = (): void => {
    if (stopping) return;
    stopping = true;
    void Promise.resolve()
      .then(() => options.shutdown())
      .catch(options.onError)
      .finally(removeSignalHandlers);
  };
  signalSource.on("SIGINT", onSignal);
  signalSource.on("SIGTERM", onSignal);

  return removeSignalHandlers;
};
