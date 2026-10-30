import { RepositoryError, RepositoryUnavailableError } from "@shared/errors/repository.error";

export const LOG_ERROR_CATEGORY = {
  REPOSITORY_UNAVAILABLE: "repository_unavailable",
  REPOSITORY_ERROR: "repository_error",
  UNEXPECTED_ERROR: "unexpected_error",
  UNKNOWN_ERROR: "unknown_error",
} as const;

export type LogErrorCategory = (typeof LOG_ERROR_CATEGORY)[keyof typeof LOG_ERROR_CATEGORY];

export const mapErrorToLogCategory = (error: unknown): LogErrorCategory => {
  try {
    if (error instanceof RepositoryUnavailableError) return LOG_ERROR_CATEGORY.REPOSITORY_UNAVAILABLE;
    if (error instanceof RepositoryError) return LOG_ERROR_CATEGORY.REPOSITORY_ERROR;
    if (error instanceof Error) return LOG_ERROR_CATEGORY.UNEXPECTED_ERROR;
  } catch {
    return LOG_ERROR_CATEGORY.UNKNOWN_ERROR;
  }

  return LOG_ERROR_CATEGORY.UNKNOWN_ERROR;
};
