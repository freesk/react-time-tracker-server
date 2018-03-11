const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8000;

mongoose.set('debug', true);

const userRoutes = require('./routes/user');
const recordRoutes = require('./routes/record');

const mongodbUri = 'mongodb://localhost:27017/react-time-tracker';

mongoose.connect(mongodbUri);

const conn = mongoose.connection;

conn.on('error', console.error.bind(console, 'connection error:'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
  next();
});

app.use('/user', userRoutes);
app.use('/record', recordRoutes);

app.listen(PORT, () => {
	console.log(`The app listening on port ${ PORT }`);
});
