const Column = require('../models/Column');
const ApiError = require('../errors/ApiError');
const { asyncHandler } = require('../services/entityManager');

/**
 * Middleware Parent Check nivel 2 + Aislamiento de Rutas: carga la columna
 * Valida que la columna exista y pertenezca al tablero actual
 * Si la columna no existe -> 404
 * Si la columna existe pero pertenece a otro tablero -> 404 (no revelar que existe)
 * Guarda la columna en req.column
 */
const loadColumn = asyncHandler(async (req, res, next) => {
  const column = await Column.findById(req.params.columnId);
  if (!column) {
    throw new ApiError(404, 'Columna no encontrada');
  }

  // Aislamiento de rutas: verificar que la columna pertenezca al tablero
  if (!column.board.equals(req.board._id)) {
    throw new ApiError(404, 'Columna no encontrada');
  }

  req.column = column;
  next();
});

module.exports = loadColumn;
