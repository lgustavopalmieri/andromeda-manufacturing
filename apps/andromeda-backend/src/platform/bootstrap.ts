export interface ServiceDatabaseInterface {
  initialize(): Promise<void>;
  migrate(): Promise<unknown>;
  close(): Promise<void>;
}

export interface ServiceHttpInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface BootstrapOptionsInterface {
  readonly database: ServiceDatabaseInterface;
  readonly http: ServiceHttpInterface;
  readonly runMigrationsOnBoot: boolean;
}

export interface RunningServiceInterface {
  stop(): Promise<void>;
}

export const bootstrap = async (options: BootstrapOptionsInterface): Promise<RunningServiceInterface> => {
  let databaseAcquired = true;
  let httpAcquired = false;
  let stopPromise: Promise<void> | undefined;

  const closeHttp = async (): Promise<void> => {
    if (!httpAcquired) return;
    await options.http.stop();
    httpAcquired = false;
  };
  const closeDatabase = async (): Promise<void> => {
    if (!databaseAcquired) return;
    await options.database.close();
    databaseAcquired = false;
  };

  try {
    await options.database.initialize();
    if (options.runMigrationsOnBoot) await options.database.migrate();
    httpAcquired = true;
    await options.http.start();
  } catch (error) {
    const failures: unknown[] = [error];
    for (const close of [closeHttp, closeDatabase]) {
      try {
        await close();
      } catch (cleanupError) {
        failures.push(cleanupError);
      }
    }
    if (failures.length > 1) throw new AggregateError(failures, "Service startup and cleanup failed.");
    throw new Error("Service startup failed.", {
      cause: error,
    });
  }

  return {
    stop(): Promise<void> {
      stopPromise ??= (async () => {
        await closeHttp();
        await closeDatabase();
      })().catch((error: unknown) => {
        stopPromise = undefined;
        throw new Error("Service shutdown failed.", {
          cause: error,
        });
      });
      return stopPromise;
    },
  };
};
