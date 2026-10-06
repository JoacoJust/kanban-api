const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título del ticket es obligatorio'],
    trim: true,
    minlength: [1, 'El título debe tener al menos 1 carácter'],
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
  },
  column: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Column',
    required: [true, 'El ticket debe pertenecer a una columna'],
    index: true
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: [true, 'El ticket debe pertenecer a un tablero'],
    index: true
  },
  position: {
    type: Number,
    default: 0,
    min: [0, 'La posición no puede ser negativa']
  }
}, {
  timestamps: true,
  id: false,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Índice compuesto para ordenamiento eficiente dentro de una columna
ticketSchema.index({ column: 1, position: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
