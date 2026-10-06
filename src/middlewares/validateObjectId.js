const ApiError = require('../errors/ApiError');
const { asyncHandler } = require('../services/entityManager');

/**
 * Middleware que valida que los parámetros tengan formato de ObjectId válido
 * @param  {...string} params - Nombres de parámetros a validar
 * @returns {Function} Middleware de Express
 */
function validateObjectId(...params) {
  return asyncHandler(async (req, res, next) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    for (const param of params) {
      const value = req.params[param];
      if (!value || !objectIdRegex.test(value)) {
        throw new ApiError(400, `El parámetro ${param} tiene un formato inválido`);
      }
    }

    next();
  });
}

module.exports = validateObjectId;
