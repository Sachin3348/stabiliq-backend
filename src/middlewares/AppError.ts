/** Typed app error for central error handling; statusCode drives HTTP status */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/** Mongoose duplicate key error code */
export const MONGOOSE_DUPLICATE_KEY_CODE = 11000;
