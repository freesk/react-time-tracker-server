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

const mongodbUri = 'mongodb://admin:1379513795@ds157528.mlab.com:57528/react-time-tracker';
// const mongodbUri = 'mongodb://localhost:27017/react-time-tracker';

mongoose.connect(mongodbUri);

const conn = mongoose.connection;

conn.on('error', console.error.bind(console, 'connection error:'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/user', userRoutes);
app.use('/record', recordRoutes);

app.listen(PORT, () => {
	console.log(`The app listening on port ${ PORT }`);
});
