var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();

/* GET users listing. */
// router.get('/userlist', function(req, res) {
// 	var db = req.db;
// 	var collection = db.get('testusers');
// 	collection.find({}, {}, function(e,docs){
// 		res.json(docs);
// 	})
// })

// router.post('/addUser', function(req, res) {
// 	var db = req.db;
// 	var collection = db.get('testusers');
// 	var newUser = req.body;
// 	collection.insert(newUser, function(err, result) {
// 		res.send(
// 			(err === null) ? {msg: "success"} : {msg: err}
// 			)
// 	})
// })

// router.delete('/deleteUser/:id', function(req, res) {
// 	var db = req.db;
// 	var collection = db.get('testusers');
// 	collection.remove({ _id: req.params.id}, function(err) {
// 		res.send((err === null) ? {msg: "success"} : {msg: err})
// 	})
// })

//Create User

router.post('/addUser', (req, res) => {
	let db = req.db;
	let collection = db.get('users');
	bcrypt.hash(req.body.password, 10, (err, hash) => {
		if (err) {
			
		}
		let password = hash;
		let userData = {
		email: req.body.email,
		username: req.body.username,
		password: password,
		passwordconf : password
	}
	collection.insert(userData, function(err, result) {
		res.send(
			(err === null) ? {msg: "success"} : {msg: err}
			)
	})	
	})
	// let userData = {
	// 	email: req.body.email,
	// 	username: req.body.username,
	// 	password: req.body.password,
	// 	passwordconf = req.body.passwordconf
	// }
	// collection.insert(userData, function(err, result) {
	// 	res.send(
	// 		(err === null) ? {msg: "success"} : {msg: err}
	// 		)
	// })
})
module.exports = router;
