const Column = require('../models/Column');
const ApiError = require('../errors/ApiError');
const { pick, nextPosition, asyncHandler } = require('../services/entityManager');

/**
 * Crear una columna en un tablero
 */
const createColumn = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'position'];
  const columnData = pick(req.body, allowedFields);

  // Si no viene position, asignar al final
  if (columnData.position === undefined) {
    columnData.position = await nextPosition(Column, { board: req.board._id });
  }

  // Asignar el board del middleware loadBoard
  columnData.board = req.board._id;

  const column = await Column.create(columnData);
  res.status(201).json(column);
});

/**
 * Listar columnas de un tablero
 */
const getColumns = asyncHandler(async (req, res) => {
  const columns = await Column.find({ board: req.board._id })
    .sort({ position: 1, createdAt: 1 });

  res.json(columns);
});

/**
 * Obtener una columna específica
 */
const getColumn = asyncHandler(async (req, res) => {
  // La columna ya fue cargada por loadColumn
  res.json(req.column);
});

/**
 * Actualizar una columna
 */
const updateColumn = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'position'];
  const updateData = pick(req.body, allowedFields);

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'Debe proporcionar al menos un campo para actualizar');
  }

  const column = await Column.findByIdAndUpdate(
    req.column._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json(column);
});

/**
 * Eliminar una columna (cascada automática por hooks)
 */
const deleteColumn = asyncHandler(async (req, res) => {
  // Usar deleteOne() para disparar hooks de cascada
  await req.column.deleteOne();

  res.status(204).send();
});

module.exports = {
  createColumn,
  getColumns,
  getColumn,
  updateColumn,
  deleteColumn
};
