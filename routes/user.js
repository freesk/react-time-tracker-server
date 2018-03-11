const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

router.post('/register', function (req, res) {

	const username = req.body.username;
	const email    = req.body.email;
	const password = req.body.password;

	var user = new User({
		username: username,
		email: email,
		password: bcrypt.hashSync(password),
		rate: 0
	});

	user.save((err, doc) => {
    if (err) return res.status(500).json({
      error: err.message
    });
		res.status(201).json({
			error: null
		});
	});

});

router.get('/update', (req, res) => {
	const decoded = jwt.verify(req.query.token, 'secret');
	const userId = decoded.user._id;

  // filter by user id
  User.findOne({ "_id" : userId }, { "password": 0 })
	 .exec(function(err, doc) {
	   if(err) return res.status(500).json({
	     error: err.message
	   });
	   res.status(200).json({
	     error: null,
			 doc: doc
	   });
	 });
})

router.post('/update', (req, res) => {
	const decoded = jwt.verify(req.query.token, 'secret');
	const userId = decoded.user._id;

	const email    = req.body.email;
	const password = req.body.password;
	const rate     = req.body.rate;

  // filter by user id
  User.findOne({ "_id" : userId })
	 .exec(function(err, doc) {
	   if(err) return res.status(500).json({
	     error: err.message
	   });

		 doc.password = password ? bcrypt.hashSync(password) : doc.password;
		 doc.email = email || doc.email;
		 doc.rate = rate || doc.rate;

		 doc.save((err) => {
			 if (err) return res.status(500).json({
		     error: err.message
		   });
			 res.status(200).json({
		     error: null
		   });
			 
		 });

	 });

})


router.post('/login', (req, res) => {

	const username = req.query.username;
	const password = req.query.password;

	User.findOne({ username: username }, (err, doc) => {
		if(err) return res.status(500).json({
      error: err.message
    });

		if(!doc) return res.status(401).json({
			error: "user not found"
		});

		// decrypt and compare
		if(!bcrypt.compareSync(password, doc.password)) return res.status(401).json({
      error: "invalid password"
    });

		// create a token
		const token = jwt.sign({ user: doc }, 'secret', { expiresIn: 7200 });

		// good to go
    res.status(200).json({
      error: null,
      token: token
    });

	});

});

module.exports = router;
