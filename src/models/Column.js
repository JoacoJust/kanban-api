const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la columna es obligatorio'],
    trim: true,
    minlength: [1, 'El nombre debe tener al menos 1 carácter'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: [true, 'La columna debe pertenecer a un tablero'],
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

// Virtual para poblar tickets
columnSchema.virtual('tickets', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'column'
});

// Hook de cascada: eliminar todos los tickets de la columna
columnSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Ticket = mongoose.model('Ticket');
  await Ticket.deleteMany({ column: this._id });
});

module.exports = mongoose.model('Column', columnSchema);
