const mongoose = require('mongoose');
require('dotenv').config();

exports.connect = () => {
  // Connecting to the database
  mongoose.connect(process.env.MONGODB_URL, {
    //useNewUrlParser: true,
    //useUnifiedTopology: true,
  });
  mongoose.connection.on('error', (error) => {
    console.log('Database connection error:', error);
  });
  mongoose.connection.once('open', () => {
    console.log('Database connected');
  });
};