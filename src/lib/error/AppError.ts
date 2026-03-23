export type AppErrorType =
  | 'AUTH'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'SERVER'
  | 'NETWORK'
  | 'UNKNOWN';

export class AppError extends Error {
  type: AppErrorType;
  status?: number;

  constructor(
    type: AppErrorType,
    message: string,
    status?: number
  ) {
    super(message);
    this.type = type;
    this.status = status;
  }
}
