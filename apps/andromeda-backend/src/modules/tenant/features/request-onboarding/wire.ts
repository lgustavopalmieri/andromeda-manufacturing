import type { DataSource } from "typeorm";
import pino from "pino";
import { SystemClock } from "platform/clock/system-clock";
import { TypeormTransactionRunner } from "platform/database/postgres/typeorm/typeorm-transaction-runner";
import { CryptoUuidGenerator } from "platform/identifiers/crypto-uuid-generator";
import { PinoObservability } from "platform/observability/pino-observability";
import { RequestOnboardingUsecase } from "./application/usecase";
import { RequestOnboardingHandler } from "./inbound/http/http-handler";
import { RequestOnboardingTransactionManager } from "./outbound/typeorm/request-onboarding-transaction-manager";

export class RequestOnboardingWire {
  public static provideUsecase(dataSource: DataSource): RequestOnboardingUsecase {
    return new RequestOnboardingUsecase(
      new RequestOnboardingTransactionManager(new TypeormTransactionRunner(dataSource)),
      new CryptoUuidGenerator(),
      new SystemClock(),
    );
  }

  public static provideHttpHandler(dataSource: DataSource) {
    const handler = new RequestOnboardingHandler(
      this.provideUsecase(dataSource),
      new PinoObservability(pino()),
    );
    return handler.handle.bind(handler);
  }
}
