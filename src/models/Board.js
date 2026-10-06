const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del tablero es obligatorio'],
    trim: true,
    minlength: [1, 'El nombre debe tener al menos 1 carácter'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
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

// Virtual para poblar columnas
boardSchema.virtual('columns', {
  ref: 'Column',
  localField: '_id',
  foreignField: 'board'
});

// Hook de cascada: eliminar columnas UNO A UNO y luego tickets como red de seguridad
boardSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Column = mongoose.model('Column');
  const Ticket = mongoose.model('Ticket');

  // Eliminar columnas UNO A UNA para disparar sus hooks de cascada
  const columns = await Column.find({ board: this._id });
  for (const column of columns) {
    await column.deleteOne();
  }

  // Red de seguridad: eliminar cualquier ticket huérfano del tablero
  await Ticket.deleteMany({ board: this._id });
});

// Columnas básicas que se crean automáticamente
const DEFAULT_COLUMNS = ['Qué hacer', 'Haciendo', 'Hecho'];

module.exports = mongoose.model('Board', boardSchema);
module.exports.DEFAULT_COLUMNS = DEFAULT_COLUMNS;
