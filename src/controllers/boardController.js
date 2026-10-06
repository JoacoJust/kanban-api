const Board = require('../models/Board');
const Column = require('../models/Column');
const ApiError = require('../errors/ApiError');
const { pick, asyncHandler } = require('../services/entityManager');
const { DEFAULT_COLUMNS } = require('../models/Board');

/**
 * Crear un nuevo tablero con sus 3 columnas básicas
 */
const createBoard = asyncHandler(async (req, res) => {
  // Lista blanca de campos permitidos
  const allowedFields = ['name', 'description'];
  const boardData = pick(req.body, allowedFields);

  // Crear el tablero
  const board = await Board.create(boardData);

  // Crear las 3 columnas básicas
  const columnsData = DEFAULT_COLUMNS.map((name, index) => ({
    name,
    board: board._id,
    position: index
  }));

  try {
    const columns = await Column.insertMany(columnsData);

    // Responder con el tablero y columnas pobladas
    const boardWithColumns = await Board.findById(board._id).populate('columns');
    res.status(201).json(boardWithColumns);
  } catch (error) {
    // Si falla la creación de columnas, borrar el tablero
    await board.deleteOne();
    throw error;
  }
});

/**
 * Listar todos los tableros
 */
const getBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find().sort({ createdAt: -1 });
  res.json(boards);
});

/**
 * Obtener un tablero específico con columnas y tickets poblados
 */
const getBoard = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.boardId)
    .populate({
      path: 'columns',
      options: { sort: { position: 1, createdAt: 1 } },
      populate: {
        path: 'tickets',
        options: { sort: { position: 1, createdAt: 1 } }
      }
    });

  if (!board) {
    throw new ApiError(404, 'Tablero no encontrado');
  }

  res.json(board);
});

/**
 * Actualizar un tablero
 */
const updateBoard = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'description'];
  const updateData = pick(req.body, allowedFields);

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'Debe proporcionar al menos un campo para actualizar');
  }

  const board = await Board.findByIdAndUpdate(
    req.params.boardId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!board) {
    throw new ApiError(404, 'Tablero no encontrado');
  }

  res.json(board);
});

/**
 * Eliminar un tablero (cascada automática por hooks)
 */
const deleteBoard = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.boardId);
  if (!board) {
    throw new ApiError(404, 'Tablero no encontrado');
  }

  // Usar deleteOne() para disparar hooks de cascada
  await board.deleteOne();

  res.status(204).send();
});

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard
};
