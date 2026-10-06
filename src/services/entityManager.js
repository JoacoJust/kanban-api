const ApiError = require('../errors/ApiError');

/**
 * Busca una entidad por ID y lanza ApiError 404 si no existe
 * @param {Model} Model - Modelo Mongoose
 * @param {string} id - ID a buscar
 * @param {string} errorMessage - Mensaje de error personalizado
 * @returns {Promise<Document>} Documento encontrado
 */
async function findOrFail(Model, id, errorMessage = 'Recurso no encontrado') {
  const doc = await Model.findById(id);
  if (!doc) {
    throw new ApiError(404, errorMessage);
  }
  return doc;
}

/**
 * Filtra un objeto manteniendo solo las claves permitidas (lista blanca)
 * @param {Object} obj - Objeto a filtrar
 * @param {Array<string>} allowedKeys - Claves permitidas
 * @returns {Object} Objeto filtrado
 */
function pick(obj, allowedKeys) {
  const result = {};
  for (const key of allowedKeys) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Calcula la siguiente posición para una entidad
 * @param {Model} Model - Modelo Mongoose
 * @param {Object} filter - Filtro para contar documentos
 * @returns {Promise<number>} Siguiente posición
 */
async function nextPosition(Model, filter = {}) {
  const count = await Model.countDocuments(filter);
  return count;
}

/**
 * Wrapper para handlers async que captura errores y los pasa al middleware de error
 * @param {Function} fn - Función async
 * @returns {Function} Middleware de Express
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  findOrFail,
  pick,
  nextPosition,
  asyncHandler
};
