import { TypeormTransactionRunner } from "platform/database/postgres/typeorm/typeorm-transaction-runner";
import type {
  RequestOnboardingTransactionContextInterface,
  RequestOnboardingTransactionInterface,
} from "../../application/interfaces.js";
import { RequestOnboardingTypeormRepositories } from "./request-onboarding.typeorm-repositories.js";

export class RequestOnboardingTransactionManager implements RequestOnboardingTransactionInterface {
  public constructor(private readonly transactionRunner: TypeormTransactionRunner) {}

  public async run<T>(
    work: (context: RequestOnboardingTransactionContextInterface) => Promise<T>,
  ): Promise<T> {
    return await this.transactionRunner.run(async (manager) =>
      await work(new RequestOnboardingTypeormRepositories(manager)),
    );
  }
}
