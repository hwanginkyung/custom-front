import { AppError } from "./AppError";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return fallback;
}
