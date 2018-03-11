var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// User schema
var schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    bcrypt: true,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    trim: true
  }
});

var User = mongoose.model('User', schema);

module.exports = User;
