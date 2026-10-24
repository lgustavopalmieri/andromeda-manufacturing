import type { Request, Response } from "express";
import { z } from "zod";
import type { ObservabilityInterface } from "@shared/observability/observability";
import type { RequestOnboardingUsecaseInterface } from "../../application/interfaces.js";
import type { RequestOnboardingInputProps } from "../../domain/types.js";
import { RequestOnboardingHttpResponse } from "./http-response-mapper.js";

const correlationIdSchema = z.uuid();
const bodySchema = z.object({
  organizationName: z.string(),
  externalOrganizationIdentifier: z.string().optional(),
  settings: z.object({
    countryCode: z.string(),
    locale: z.string(),
    timeZone: z.string(),
    preferredUnitSystem: z.string(),
    branding: z.object({ displayName: z.string().optional() }).strict(),
    administrativeContactEmails: z.array(z.string()),
  }).strict(),
  ownerEmail: z.string(),
  ownerDisplayName: z.string(),
  ownerLocale: z.string(),
  policyAcceptanceVersion: z.string(),
}).strict();

export class RequestOnboardingHandler {
  public constructor(
    private readonly usecase: RequestOnboardingUsecaseInterface,
    private readonly observability: ObservabilityInterface,
  ) {}

  public async handle(request: Request, response: Response): Promise<void> {
    const httpResponse = new RequestOnboardingHttpResponse(response);
    const correlationId = correlationIdSchema.safeParse(request.header("x-correlation-id"));
    const body = bodySchema.safeParse(request.body);

    if (!correlationId.success || !body.success) {
      httpResponse.invalidRequest();
      return;
    }

    try {
      const { externalOrganizationIdentifier, settings, ...bodyInput } = body.data;
      const result = await this.usecase.execute({
        correlationId: correlationId.data,
        ...bodyInput,
        ...(externalOrganizationIdentifier === undefined ? {} : { externalOrganizationIdentifier }),
        settings: {
          ...settings,
          branding:
            settings.branding.displayName === undefined
              ? {}
              : { displayName: settings.branding.displayName },
        },
      } satisfies RequestOnboardingInputProps);
      httpResponse.accepted(result);
    } catch (error) {
      this.observability.capture(error, {
        feature: "tenant.request-onboarding",
        correlationId: correlationId.data,
      });
      httpResponse.mapError(error);
    }
  }
}
