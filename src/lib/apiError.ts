export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }

  static badRequest(message: string, code = "BAD_REQUEST") {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = "Please sign in to continue.", code = "UNAUTHORIZED") {
    return new ApiError(401, message, code);
  }

  static forbidden(message = "You do not have access to this resource.", code = "FORBIDDEN") {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Not found.", code = "NOT_FOUND") {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = "CONFLICT") {
    return new ApiError(409, message, code);
  }
}
