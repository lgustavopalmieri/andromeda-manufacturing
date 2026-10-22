import type { DataSource, EntityManager } from "typeorm";
import { RepositoryError } from "@shared/errors/repository.error";
import type {
  OutboxMessageEnqueuerInterface,
  OutboxMessageInterface,
} from "@shared/events/outbox";
import { OutboxMessageOrmEntity } from "./entities/outbox-message.orm-entity";

type TypeormManager = DataSource | EntityManager;

export class TypeormOutboxMessageRepository implements OutboxMessageEnqueuerInterface {
  public constructor(private readonly manager: TypeormManager) {}

  public async enqueue(message: OutboxMessageInterface): Promise<void> {
    try {
      await this.manager.getRepository(OutboxMessageOrmEntity).insert(message);
    } catch (error) {
      throw new RepositoryError("Failed to enqueue outbox message.", { cause: error });
    }
  }
}
