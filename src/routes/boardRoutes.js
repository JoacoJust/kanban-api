const express = require('express');
const router = express.Router();
const validateObjectId = require('../middlewares/validateObjectId');
const loadBoard = require('../middlewares/loadBoard');
const { createBoard, getBoards, getBoard, updateBoard, deleteBoard } = require('../controllers/boardController');

// POST /api/boards - Crear tablero
router.post('/', createBoard);

// GET /api/boards - Listar tableros
router.get('/', getBoards);

// Middleware para validar boardId y cargar el tablero en rutas con :boardId
router.use('/:boardId', validateObjectId('boardId'), loadBoard);

// GET /api/boards/:boardId - Obtener tablero
router.get('/:boardId', getBoard);

// PATCH /api/boards/:boardId - Actualizar tablero
router.patch('/:boardId', updateBoard);

// DELETE /api/boards/:boardId - Eliminar tablero
router.delete('/:boardId', deleteBoard);

module.exports = router;
