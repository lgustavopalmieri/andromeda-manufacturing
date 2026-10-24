import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { DataSource } from "typeorm";
import { makeRequestOnboardingInput } from "@shared/tests/factories/tenant/request-onboarding.factory";
import { AuditEventOrmEntity } from "platform/database/postgres/typeorm/entities/audit-event.orm-entity";
import {
  AccessPolicyRevisionOrmEntity,
  PermissionDefinitionOrmEntity,
  RoleDefinitionOrmEntity,
  RoleRevisionOrmEntity,
} from "platform/database/postgres/typeorm/entities/access-catalog.orm-entities";
import { createDataSource, initializeDatabase } from "platform/database/postgres/data-source";
import { OutboxMessageOrmEntity } from "platform/database/postgres/typeorm/entities/outbox-message.orm-entity";
import {
  OwnerAppointmentOrmEntity,
  TenantOnboardingRequestOrmEntity,
  TenantOrmEntity,
} from "platform/database/postgres/typeorm/entities/tenant.orm-entities";
import { RequestOnboardingWire } from "../../wire";

let container: StartedPostgreSqlContainer;
let dataSource: DataSource;

interface MakeSutInterface {
  usecase: ReturnType<typeof RequestOnboardingWire.provideUsecase>;
}

const makeSut = (): MakeSutInterface => ({
  usecase: RequestOnboardingWire.provideUsecase(dataSource),
});

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  dataSource = await initializeDatabase(
    createDataSource({
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
      ssl: false,
      runMigrationsOnBoot: true,
    }),
  );
});

afterAll(async () => {
  await dataSource?.destroy();
  await container?.stop();
});

describe("RequestOnboardingWire (PostgreSQL)", () => {
  describe("when a new correlation is requested more than once", () => {
    it("should persist exactly one pending tenant bootstrap with audit and invitation outbox facts", async () => {
      const { usecase } = makeSut();
      const input = makeRequestOnboardingInput();

      const first = await usecase.execute(input);
      const repeated = await usecase.execute(input);
      const tenant = await dataSource.getRepository(TenantOrmEntity).findOneByOrFail({ id: first.tenantId });
      const onboardingRequests = await dataSource
        .getRepository(TenantOnboardingRequestOrmEntity)
        .findBy({ correlationId: input.correlationId });
      const policies = await dataSource
        .getRepository(AccessPolicyRevisionOrmEntity)
        .findBy({ tenantId: first.tenantId });
      const roles = await dataSource.getRepository(RoleDefinitionOrmEntity).findBy({ tenantId: first.tenantId });
      const revisions = await dataSource.getRepository(RoleRevisionOrmEntity).findBy({ tenantId: first.tenantId });
      const invitations = await dataSource
        .getRepository(OwnerAppointmentOrmEntity)
        .findBy({ tenantId: first.tenantId });
      const audits = await dataSource.getRepository(AuditEventOrmEntity).findBy({ tenantId: first.tenantId });
      const messages = await dataSource.getRepository(OutboxMessageOrmEntity).findBy({ tenantId: first.tenantId });
      const permissions = await dataSource.getRepository(PermissionDefinitionOrmEntity).find();

      expect(repeated).toEqual(first);
      expect(tenant).toMatchObject({ status: "pending_activation", activeAccessPolicyRevisionId: policies[0]?.id });
      expect(onboardingRequests).toHaveLength(1);
      expect(policies).toHaveLength(1);
      expect(roles).toHaveLength(2);
      expect(revisions).toHaveLength(2);
      expect(invitations).toEqual([expect.objectContaining({ status: "invited", invitedEmail: input.ownerEmail })]);
      expect(audits).toEqual([
        expect.objectContaining({ operationCode: "tenant:request-onboarding", decision: "permitted" }),
      ]);
      expect(messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ eventName: "tenant.onboarding-requested" }),
          expect.objectContaining({ eventName: "tenant.owner-invitation-provision-requested" }),
        ]),
      );
      expect(permissions).toHaveLength(3);
    });

    it("should serialize concurrent retries into one tenant, invitation, audit event, and pair of outbox messages", async () => {
      const input = makeRequestOnboardingInput({
        correlationId: "b0cf0d99-7306-4cda-8418-963e831033d4",
      });

      const results = await Promise.all(
        Array.from({ length: 8 }, async () => await makeSut().usecase.execute(input)),
      );
      const firstResult = results[0];
      if (firstResult === undefined) throw new Error("Expected at least one onboarding result.");
      const tenantId = firstResult.tenantId;
      const [requests, tenants, invitations, audits, messages] = await Promise.all([
        dataSource.getRepository(TenantOnboardingRequestOrmEntity).findBy({ correlationId: input.correlationId }),
        dataSource.getRepository(TenantOrmEntity).findBy({ id: tenantId }),
        dataSource.getRepository(OwnerAppointmentOrmEntity).findBy({ tenantId }),
        dataSource.getRepository(AuditEventOrmEntity).findBy({ tenantId }),
        dataSource.getRepository(OutboxMessageOrmEntity).findBy({ tenantId }),
      ]);

      expect(results).toEqual(Array.from({ length: 8 }, () => results[0]));
      expect(requests).toHaveLength(1);
      expect(tenants).toHaveLength(1);
      expect(invitations).toHaveLength(1);
      expect(audits).toHaveLength(1);
      expect(messages).toHaveLength(2);
    });
  });

  describe("when independent organizations request onboarding", () => {
    it("should keep neutral settings, bootstrap catalog facts, and messages local to each new tenant", async () => {
      const aurora = await makeSut().usecase.execute(
        makeRequestOnboardingInput({
          correlationId: "c0cf0d99-7306-4cda-8418-963e831033d4",
          organizationName: "Indústria Aurora",
          settings: {
            ...makeRequestOnboardingInput().settings,
            branding: { displayName: "Aurora" },
            administrativeContactEmails: ["admin@aurora.example"],
          },
        }),
      );
      const boreal = await makeSut().usecase.execute(
        makeRequestOnboardingInput({
          correlationId: "d0cf0d99-7306-4cda-8418-963e831033d4",
          organizationName: "Indústria Boreal",
          settings: {
            ...makeRequestOnboardingInput().settings,
            branding: { displayName: "Boreal" },
            administrativeContactEmails: ["admin@boreal.example"],
          },
        }),
      );
      const [auroraTenant, borealTenant, auroraRoles, borealRoles, auroraMessages, borealMessages] = await Promise.all([
        dataSource.getRepository(TenantOrmEntity).findOneByOrFail({ id: aurora.tenantId }),
        dataSource.getRepository(TenantOrmEntity).findOneByOrFail({ id: boreal.tenantId }),
        dataSource.getRepository(RoleDefinitionOrmEntity).findBy({ tenantId: aurora.tenantId }),
        dataSource.getRepository(RoleDefinitionOrmEntity).findBy({ tenantId: boreal.tenantId }),
        dataSource.getRepository(OutboxMessageOrmEntity).findBy({ tenantId: aurora.tenantId }),
        dataSource.getRepository(OutboxMessageOrmEntity).findBy({ tenantId: boreal.tenantId }),
      ]);

      expect(auroraTenant).toMatchObject({
        organizationName: "Indústria Aurora",
        status: "pending_activation",
        settings: expect.objectContaining({ branding: { displayName: "Aurora" } }),
      });
      expect(borealTenant).toMatchObject({
        organizationName: "Indústria Boreal",
        status: "pending_activation",
        settings: expect.objectContaining({ branding: { displayName: "Boreal" } }),
      });
      expect(auroraRoles).toHaveLength(2);
      expect(borealRoles).toHaveLength(2);
      expect(auroraMessages).toHaveLength(2);
      expect(borealMessages).toHaveLength(2);
      expect(auroraMessages).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ tenantId: boreal.tenantId }),
      ]));
      expect(borealMessages).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ tenantId: aurora.tenantId }),
      ]));
    });
  });
});
