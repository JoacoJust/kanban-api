const Board = require('../models/Board');
const ApiError = require('../errors/ApiError');
const { asyncHandler } = require('../services/entityManager');

/**
 * Middleware Parent Check nivel 1: carga el tablero
 * Valida que el tablero exista. Si no existe -> 404
 * Guarda el tablero en req.board
 */
const loadBoard = asyncHandler(async (req, res, next) => {
  const board = await Board.findById(req.params.boardId);
  if (!board) {
    throw new ApiError(404, 'Tablero no encontrado');
  }
  req.board = board;
  next();
});

module.exports = loadBoard;
