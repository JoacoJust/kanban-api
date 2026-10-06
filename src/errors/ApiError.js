/**
 * Clase personalizada de error para la API
 * Permite lanzar errores con código de estado HTTP y mensaje personalizado
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
