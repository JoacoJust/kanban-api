const express = require('express');
const router = express.Router({ mergeParams: true });
const validateObjectId = require('../middlewares/validateObjectId');
const loadBoard = require('../middlewares/loadBoard');
const loadColumn = require('../middlewares/loadColumn');
const { createColumn, getColumns, getColumn, updateColumn, deleteColumn } = require('../controllers/columnController');

// Cargar el tablero para todas las rutas
router.use('/', loadBoard);

// POST /api/boards/:boardId/columns - Crear columna
router.post('/', createColumn);

// GET /api/boards/:boardId/columns - Listar columnas
router.get('/', getColumns);

// Middleware para validar columnId en rutas con :columnId
router.use('/:columnId', validateObjectId('columnId'));

// Cargar la columna para rutas específicas
router.use('/:columnId', loadColumn);

// GET /api/boards/:boardId/columns/:columnId - Obtener columna
router.get('/:columnId', getColumn);

// PATCH /api/boards/:boardId/columns/:columnId - Actualizar columna
router.patch('/:columnId', updateColumn);

// DELETE /api/boards/:boardId/columns/:columnId - Eliminar columna
router.delete('/:columnId', deleteColumn);

module.exports = router;
