import type { ErrorResponse } from "../types/api";

// Error types
export const ErrorType = {
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

// Enhanced error class
export class ApiError extends Error {
  public type: ErrorType;
  public status?: number;
  public timestamp: string;
  public path?: string;
  public code: string;

  constructor(errorResponse: ErrorResponse, status?: number) {
    super(errorResponse.message);
    this.name = "ApiError";
    this.type = this.determineErrorType(errorResponse.error, status);
    this.status = status;
    this.timestamp = errorResponse.timestamp;
    this.path = errorResponse.path;
    this.code = errorResponse.error;
  }

  private determineErrorType(error: string, status?: number): ErrorType {
    if (status) {
      switch (status) {
        case 400:
          return ErrorType.VALIDATION_ERROR;
        case 401:
          return ErrorType.AUTH_ERROR;
        case 403:
          return ErrorType.PERMISSION_ERROR;
        case 404:
          return ErrorType.NOT_FOUND_ERROR;
        case 500:
        case 502:
        case 503:
        case 504:
          return ErrorType.SERVER_ERROR;
        default:
          return ErrorType.UNKNOWN_ERROR;
      }
    }

    switch (error) {
      case "NETWORK_ERROR":
        return ErrorType.NETWORK_ERROR;
      case "VALIDATION_ERROR":
        return ErrorType.VALIDATION_ERROR;
      case "AUTH_ERROR":
        return ErrorType.AUTH_ERROR;
      case "ACCOUNT_INACTIVE":
        return ErrorType.AUTH_ERROR;
      case "PERMISSION_ERROR":
        return ErrorType.PERMISSION_ERROR;
      case "NOT_FOUND_ERROR":
        return ErrorType.NOT_FOUND_ERROR;
      case "SERVER_ERROR":
        return ErrorType.SERVER_ERROR;
      default:
        return ErrorType.UNKNOWN_ERROR;
    }
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.response?.data) {
      return new ApiError(error.response.data, error.response.status);
    }

    // Create generic error response
    const genericError: ErrorResponse = {
      success: false,
      message: error.message || "An unexpected error occurred",
      error: "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    };

    return new ApiError(genericError);
  }

  static getErrorMessage(error: ApiError): string {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return "Unable to connect to the server. Please check your internet connection.";
      case ErrorType.SERVER_ERROR:
        return "Server error occurred. Please try again later.";
      case ErrorType.VALIDATION_ERROR:
        return error.message || "Please check your input and try again.";
      case ErrorType.AUTH_ERROR:
        if (error.code === "ACCOUNT_INACTIVE") {
          return error.message || "Account is inactive";
        }
        return error.message || "Authentication failed. Please log in again.";
      case ErrorType.PERMISSION_ERROR:
        return "You do not have permission to perform this action.";
      case ErrorType.NOT_FOUND_ERROR:
        return "The requested resource was not found.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }

  static shouldRetry(error: ApiError): boolean {
    return (
      error.type === ErrorType.NETWORK_ERROR ||
      error.type === ErrorType.SERVER_ERROR
    );
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt), 16000);
  }
}

// Global error handler
export const globalErrorHandler = (error: any) => {
  const apiError = ErrorHandler.handle(error);
  const message = ErrorHandler.getErrorMessage(apiError);

  // Log error in development
  if (import.meta.env.DEV) {
    console.error("🚨 Global Error Handler:", {
      error: apiError,
      message,
      stack: error.stack,
    });
  }

  // You can add additional error handling here:
  // - Show toast notifications
  // - Send to error reporting service
  // - Redirect to error page
  // - etc.

  return { error: apiError, message };
};
