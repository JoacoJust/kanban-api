const ApiError = require('../errors/ApiError');

/**
 * Middleware de manejo global de errores
 * Convierte todos los errores al formato { error: "mensaje" }
 */
function errorHandler(err, req, res, next) {
  // Error de ApiError (personalizado)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Error de JSON malformado (Express body parser)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON malformado en el cuerpo de la solicitud' });
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Error de casteo de ObjectId (ID con formato inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID con formato inválido' });
  }

  // Error de duplicado (código 11000 de MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ error: `El campo ${field} ya existe` });
  }

  // Error genérico no controlado
  console.error('Error no controlado:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

/**
 * Middleware para rutas inexistentes
 */
function notFound(req, res, next) {
  const error = new ApiError(404, 'Ruta no encontrada');
  next(error);
}

module.exports = { errorHandler, notFound };
