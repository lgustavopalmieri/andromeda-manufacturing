import type { Response } from "express";
import { RepositoryError } from "@shared/errors/repository.error";
import { RequestOnboardingError } from "../../domain/errors.js";

export class RequestOnboardingHttpResponse {
  public constructor(private readonly response: Response) {}

  public accepted(data: unknown): void {
    this.response.status(202).json({ error: false, data });
  }

  public mapError(error: unknown): void {
    if (error instanceof RequestOnboardingError) {
      this.response.status(422).json({ error: true, message: error.message });
      return;
    }
    if (error instanceof RepositoryError) {
      this.response.status(500).json({ error: true, message: "Internal server error" });
      return;
    }
    this.response.status(500).json({ error: true, message: "Internal server error" });
  }

  public invalidRequest(): void {
    this.response.status(400).json({ error: true, message: "Invalid onboarding request." });
  }
}
