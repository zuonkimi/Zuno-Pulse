const mongoose = require('mongoose');

function connect() {
  return mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');
    })
    .catch(error => {
      console.error('MongoDB error:', error);
      process.exit(1);
    });
}

module.exports = { connect };
