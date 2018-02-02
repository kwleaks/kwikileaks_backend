var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();

function authenticate(db, user, password, cb) {
	let collection = db.get('users');
	collection.findOne({username: user}).then((doc) => {
			if (err) {
				return cb(err);
			} else if (!doc) {
				var err = new Error('User not found');
				err.status = 401;
				err.message = "User not found";
				return cb(err);
			}
	bcrypt.compare(password, doc.password, (err, res) => {
			if (res === true) {
				return cb(null, doc);
			} else if (res === false) {
				var err = new Error('Password incorrect');
				err.message = 'Password Incorrect';
				return cb(err);
			}
		})
	})
}

router.post('/create', (req, res) => {
	let db = req.db;
	authenticate(db, req.body.username, req.body.password, (err, data) => {
		if (err) {
			console.log(err);
			res.send(err.message);
		} else if (data) {
			console.log('yay you are finally logged in!')
			req.session.userID = data._id;
			res.send('yay you are finally logged in!!!!!')
		}
	})

	})



module.exports = router;