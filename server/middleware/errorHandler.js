/**
 * Custom operational error class.
 * Use this to create intentional errors with a specific HTTP status code
 * so the global handler can respond appropriately.
 *
 * @example
 *   throw new AppError("File not found", 404);
 *   next(new AppError("Unauthorized", 401));
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Flag to distinguish operational vs. programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found handler — register AFTER all routes, BEFORE globalErrorHandler.
 * Catches requests that didn't match any route and forwards a 404 AppError.
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Normalize known Mongoose and JWT errors into structured AppErrors
 * so they produce meaningful 4xx responses instead of generic 500s.
 * @param {Error} err
 * @returns {Error}
 */
const normalizeError = (err) => {
  // Mongoose bad ObjectId (e.g. invalid _id format)
  if (err.name === "CastError") {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return new AppError(`Duplicate value for ${field}`, 409);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return new AppError(messages, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid token. Please log in again.", 401);
  }
  if (err.name === "TokenExpiredError") {
    return new AppError("Token expired. Please log in again.", 401);
  }

  return err;
};

/**
 * Global Error Handler Middleware.
 * Must be registered AFTER all routes and other middleware in index.js.
 * Express identifies it as an error handler by its 4-argument signature (err, req, res, next).
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Normalize known error types before handling
  const normalizedErr = normalizeError(err);

  const statusCode = normalizedErr.statusCode || normalizedErr.status || 500;
  const message = normalizedErr.message || "Internal Server Error";

  // Log full error in all environments; stack trace in development
  console.error(`[${new Date().toISOString()}] ${statusCode} - ${message} | ${req.method} ${req.originalUrl}`);
  if (process.env.NODE_ENV === "development") {
    console.error(normalizedErr.stack);
  }

  // Prevent double-response if headers already sent (e.g. streaming errors)
  if (res.headersSent) {
    return next(normalizedErr);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: normalizedErr.stack }),
  });
};

/**
 * Async error wrapper to automatically catch promise rejections in route handlers.
 * Eliminates the need for try/catch boilerplate by forwarding errors to next().
 *
 * @example
 *   router.get('/files', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
