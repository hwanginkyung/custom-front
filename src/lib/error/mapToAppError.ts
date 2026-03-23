import { AppError } from "./AppError";
import type { ApiResponse } from "../api/types";

export function mapToAppError(
  response: unknown,
  status?: number,
): AppError {
  const apiResponse = response as ApiResponse<unknown> | null;
  const errorPayload = asRecord(response);
  const serverMessage = firstString(errorPayload?.message, errorPayload?.msg);
  const serverCode = firstString(errorPayload?.code);

  if (apiResponse?.success === false) {
    return new AppError(
      "SERVER",
      apiResponse.message ?? "요청에 실패했습니다",
      status,
    );
  }

  if (serverMessage) {
    if (status === 401 || serverCode === "UNAUTHORIZED" || serverCode?.startsWith("TOKEN_")) {
      return new AppError("AUTH", serverMessage, status);
    }
    if (status === 429 || serverCode === "TOO_MANY_REQUESTS") {
      return new AppError("AUTH", serverMessage, status);
    }
    if (status === 403 || serverCode === "FORBIDDEN") {
      return new AppError("FORBIDDEN", serverMessage, status);
    }
    if (status === 400 || serverCode === "INVALID_INPUT") {
      return new AppError("VALIDATION", serverMessage, status);
    }
    if (status && status >= 500) {
      return new AppError("SERVER", serverMessage, status);
    }
    return new AppError("UNKNOWN", serverMessage, status);
  }

  if (status === 401) {
    return new AppError("AUTH", "아이디 또는 비밀번호를 다시 확인해주세요.", status);
  }

  if (status === 429) {
    return new AppError("AUTH", "로그인 시도가 많습니다. 잠시 후 다시 시도해주세요.", status);
  }

  if (status === 403) {
    return new AppError("FORBIDDEN", "권한이 없습니다", status);
  }

  if (status && status >= 500) {
    return new AppError("SERVER", "서버 오류가 발생했습니다", status);
  }

  return new AppError("NETWORK", "네트워크 오류가 발생했습니다");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}
