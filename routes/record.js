const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Json2csvParser = require('json2csv').Parser;

const Asem = require('../misc/asem');

const moment = require('moment');

const User = require('../models/User');
const Record = require('../models/Record');

// middleware that is specific to this router
router.use('/', (req, res, next) => {
	// each request must contain a token
	const token = req.query.token;
  jwt.verify(token, 'secret', function(err, decoded) {
    if(err) return res.status(401).json({
      error: "not authorized"
    });
    next();
  });
});

// get all records
router.get('/get', (req, res, next) => {
	const decoded = jwt.verify(req.query.token, 'secret');
	const userId = decoded.user._id;

  // filter by user id
  Record.find({ "user" : userId }, { "user": 0 })
	 .exec(function(err, doc) {
	   if(err) return res.status(500).json({
	     error: err.message
	   });
	   // good to go
	   res.status(200).json({
	     error: null,
			 doc: doc
	   });
	 });
});

router.post('/updateOne', (req, res, next) => {
	const decoded = jwt.verify(req.query.token, 'secret');
	const userId = decoded.user._id;
	const data   = req.body.data;

	// filter by user id and recrd id
	Record.findOne({ "user" : userId, "_id" : data._id })
		.exec(function(err, doc) {
			if(err) return res.status(500).json({
 	     error: err.message
 	   });

			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					if(key === "_id") continue;
					// update with a new value if it is available
					doc[key] = data[key] || doc[key];
				}
			}

			// save the update
			doc.save((err) => {
				if(err) return res.status(500).json({
	 	     error: err.message
	 	   	});
				res.status(500).json({
					error: null
			 	});
			});

		});

});

// update time
router.post('/update', (req, res, next) => {

	const decoded = jwt.verify(req.query.token, 'secret');
	const userId = decoded.user._id;
	const data   = req.body.data;
	const errors = [];

	const asem = new Asem(() => {
		if(errors.length) return res.status(500).json({
			error: errors.reduce((accumulator, currentValue) =>
				accumulator + ", " + currentValue
			)
		});
		res.status(200).json({
			error: null
		});
	}, data.length);

	function onError(err) {
		errors.push(err.message);
		asem.p();
	}

	data.forEach((obj) => {
		// filter by user id and recrd id
		Record.findOne({ "user" : userId, "_id" : obj._id }).exec((err, doc) => {
			if(err) return onError(err.message);
			// update the number of seconds
			doc.seconds = obj.seconds;
			// save the update
			doc.save((err) => {
				if(err) return onError(err.message);
				asem.p();
			});

		});

	});

})

// delete a record
router.post('/delete', (req, res, next) => {
	const decoded = jwt.verify(req.query.token, 'secret');
	const userId = decoded.user._id;
	const recordId = req.body.recordId;

	// filter by user id
	Record.find({ "user" : userId, "_id" : recordId }, { "user": 0 })
		.remove()
		.exec(function(err) {
			if(err) return res.status(500).json({
				error: err.message
			});
			// good to go
			res.status(200).json({
				error: null
			});
		});

});

// create a record
router.post('/post', (req, res, next) => {
	const decoded = jwt.verify(req.query.token, 'secret');
	const userId = decoded.user._id;

	const project   = req.body.project;
	const activity  = req.body.activity;
	const details   = req.body.details;
	const client    = req.body.client;
	const seconds   = 0;
	const timestamp	= req.body.timestamp;

	const record = new Record({
		project: project,
		activity: activity,
		details: details,
		seconds: seconds,
		client: client,
		timestamp: timestamp,
		user: userId
	});

	record.save((err, doc) => {
    if (err) return res.status(500).json({
      error: err.message
    });
		res.status(201).json({
			error: null,
			doc: doc
		});
	});

});

router.post('/export', (req, res, next) => {
	const decoded = jwt.verify(req.query.token, 'secret');
	const userId = decoded.user._id;

	const from = req.body.from;
	const to = req.body.to;
	const filterOf = req.body.filterOf;

	const fromMoment = moment.unix(from);
	const toMoment = moment.unix(to);

	function getUnixTimestamp(string) {
		return moment(string, "MM-DD-YYYY").unix();
	}

	// filter by user id
  User.findOne({ "_id" : userId }, { "password": 0 }).exec((err, doc) => {
		if(err) return res.status(500).json({
	  	error: err.message
	  });

		const rate = doc.rate;

		// filter by user id
	 	Record.find({ "user" : userId }, { "user": 0 }).exec((err, doc) => {
			if(err) return res.status(500).json({
				error: err.message
			});

			const records = doc;

			records.sort((a, b) => {
				if (a.timestamp > b.timestamp)
					return -1;
				if (a.timestamp < b.timestamp)
					return 1;
				return 0;
			});

			const filtered = records.filter(record => {
				const date = moment.unix(record.timestamp);
				// check if the record belongs to a given range of dates
				if (!(date.isBetween(fromMoment, toMoment) || fromMoment.isSame(date, 'day'))) return false;
				// define props names
				const props = ['client', 'activity', 'details', 'project'];
				// okay bt default
				let isOkay = true;
				// check if any of props hold an excluded value and
				// if so skip this record
				for (let i = 0; i < props.length; i++)
					if(filterOf.indexOf(record[props[i]]) > -1)
						isOkay = false;

				return isOkay;
			});

			// just in case
			if(!filtered.length) return res.status(500).json({
				 error: "no records to export"
			});

			const formatted = filtered.map(record => {
				const time = precisionRound(record.seconds / 3600, 3);
				const date = moment.unix(record.timestamp).format('MM/DD/YYYY');
				return {
					client: record.client || "n/a",
					project: record.project,
					activity: record.activity,
					details: record.details,
					time: time,
					date: date,
					billed: precisionRound(time * rate, 2)
				};
			});

			const fields = [];
			const template = formatted[0];

			for (var key in template)
				if (template.hasOwnProperty(key))
					fields.push(key);


			const json2csvParser = new Json2csvParser({ fields });
			const csv = json2csvParser.parse(formatted);

			res.status(200).json({
				error: null,
				doc: csv
			});

	 	 });

	 });

});

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

module.exports = router;
