const Ticket = require('../models/Ticket');
const Column = require('../models/Column');
const ApiError = require('../errors/ApiError');
const { pick, nextPosition, asyncHandler } = require('../services/entityManager');

/**
 * Crear un ticket en una columna
 */
const createTicket = asyncHandler(async (req, res) => {
  const allowedFields = ['title', 'description', 'position'];
  const ticketData = pick(req.body, allowedFields);

  // Validar que venga title
  if (!ticketData.title) {
    throw new ApiError(400, 'El título del ticket es obligatorio');
  }

  // Si no viene position, asignar al final de la columna
  if (ticketData.position === undefined) {
    ticketData.position = await nextPosition(Ticket, { column: req.column._id });
  }

  // Asignar column y board de los middlewares (nunca del body)
  ticketData.column = req.column._id;
  ticketData.board = req.board._id;

  const ticket = await Ticket.create(ticketData);
  res.status(201).json(ticket);
});

/**
 * Listar tickets de una columna
 */
const getTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ column: req.column._id })
    .sort({ position: 1, createdAt: 1 });

  res.json(tickets);
});

/**
 * Obtener un ticket específico
 */
const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({
    _id: req.params.ticketId,
    board: req.board._id
  });

  if (!ticket) {
    throw new ApiError(404, 'Ticket no encontrado');
  }

  res.json(ticket);
});

/**
 * Actualizar o mover un ticket (idempotente)
 */
const updateTicket = asyncHandler(async (req, res) => {
  const allowedFields = ['title', 'description', 'position', 'columnId'];
  const updateData = pick(req.body, allowedFields);

  // Validar que venga al menos un campo
  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'Debe proporcionar al menos un campo para actualizar');
  }

  // a) Buscar el ticket por _id y board
  const ticket = await Ticket.findOne({
    _id: req.params.ticketId,
    board: req.board._id
  });

  if (!ticket) {
    throw new ApiError(404, 'Ticket no encontrado');
  }

  // c) Si viene columnId, validar
  if (updateData.columnId) {
    // Validar formato
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(updateData.columnId)) {
      throw new ApiError(400, 'El columnId tiene un formato inválido');
    }

    // Validar que exista
    const targetColumn = await Column.findById(updateData.columnId);
    if (!targetColumn) {
      throw new ApiError(404, 'Columna destino no encontrada');
    }

    // Validar que pertenezca al MISMO tablero
    if (!targetColumn.board.equals(req.board._id)) {
      throw new ApiError(400, 'La columna destino pertenece a otro tablero');
    }

    // d) El ticket debe estar en la columna de la URL o ya en la columna destino
    const isInSourceColumn = ticket.column.equals(req.column._id);
    const isInTargetColumn = ticket.column.equals(updateData.columnId);

    if (!isInSourceColumn && !isInTargetColumn) {
      throw new ApiError(404, 'Ticket no encontrado en esta columna');
    }

    // e) Si es un movimiento real y no viene position, asignar el final de la columna destino
    if (isInSourceColumn && !isInTargetColumn && updateData.position === undefined) {
      updateData.position = await nextPosition(Ticket, { column: updateData.columnId });
    }

    // Actualizar column para el set
    updateData.column = updateData.columnId;
    delete updateData.columnId;
  } else {
    // Si no viene columnId, el ticket debe estar en la columna de la URL
    if (!ticket.column.equals(req.column._id)) {
      throw new ApiError(404, 'Ticket no encontrado en esta columna');
    }
  }

  // f) Actualizar con findOneAndUpdate usando $set (valores absolutos)
  const updatedTicket = await Ticket.findOneAndUpdate(
    { _id: ticket._id, board: req.board._id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  res.json(updatedTicket);
});

/**
 * Eliminar un ticket
 */
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({
    _id: req.params.ticketId,
    board: req.board._id
  });

  if (!ticket) {
    throw new ApiError(404, 'Ticket no encontrado');
  }

  await ticket.deleteOne();
  res.status(204).send();
});

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket
};
