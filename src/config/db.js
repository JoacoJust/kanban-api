const mongoose = require('mongoose');

/**
 * Conectar a MongoDB
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
