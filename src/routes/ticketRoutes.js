const express = require('express');
const router = express.Router({ mergeParams: true });
const validateObjectId = require('../middlewares/validateObjectId');
const loadBoard = require('../middlewares/loadBoard');
const loadColumn = require('../middlewares/loadColumn');
const { createTicket, getTickets, getTicket, updateTicket, deleteTicket } = require('../controllers/ticketController');

// Cargar el tablero y la columna para todas las rutas
router.use('/', loadBoard, loadColumn);

// POST /api/boards/:boardId/columns/:columnId/tickets - Crear ticket
router.post('/', createTicket);

// GET /api/boards/:boardId/columns/:columnId/tickets - Listar tickets
router.get('/', getTickets);

// Middleware para validar ticketId en rutas con :ticketId
router.use('/:ticketId', validateObjectId('ticketId'));

// GET /api/boards/:boardId/columns/:columnId/tickets/:ticketId - Obtener ticket
router.get('/:ticketId', getTicket);

// PATCH /api/boards/:boardId/columns/:columnId/tickets/:ticketId - Actualizar ticket
router.patch('/:ticketId', updateTicket);

// DELETE /api/boards/:boardId/columns/:columnId/tickets/:ticketId - Eliminar ticket
router.delete('/:ticketId', deleteTicket);

module.exports = router;
