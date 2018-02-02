var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var https = require('https');
var url = require('url');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;



router.get('/getImage/:id/:photoref', function(req, res, next) {
	let db = req.db;
	let collection = db.get('photos');
	let id = ""+req.params.id;
	let photoref = parseInt(req.params.photoref);
	let query = {toiletID : ObjectId(id), reference_id: photoref};
	// find the correct entry and return the first file name associated with it
	collection.findOne(query, 'file_name').then((docs) => {
		if (docs) {
			let file_name = docs.file_name
			res.send(file_name);
		} else {
			res.send('');
		}
		
	})
})

router.get('/findOne/:id', function(req, res, next) {
	let db = req.db;
	let bathrooms = db.get('bathrooms');
	let reviews = db.get('reviews');
	let photos = db.get('photos')
	let id = ""+req.params.id;
	let q = {toiletID : ObjectId(id)};
	async.parallel({
		reviews: (cB) => {
			reviews.find(q, (err, docs) => {
				if (!err) {
					cB(null,docs)
				} else {
					cB(err)
				}
			})
		},
		photos: (cB) => {
			photos.find(q, (err, docs) => {
				if (!err) {
					cB(null,docs)
				} else {
					cB(err)
				}
			})
		},
		info: (cB) => {
			bathrooms.find({_id : ObjectId(id)}, (err, docs) => {
				if (!err) {
					cB(null,docs)
				} else {
					cB(err)
				}
			})
		}
	}, (err, results) => {
		console.log(results);
		if (!err) { 
			res.status(200).send(results) 
		} else {
			res.status(500).send({msg: "error at end of callback: " + error})
		}
	})
})

router.get('/findAll', function(req, res, next) {
	let db = req.db;
	let collection = db.get('bathrooms');
	collection.find({}, (err, docs) => {
		if (err) {
			console.log(err);
			res.status(500).send({msg: err})
		} else {
			// res.status(200).send(docs);
		if (!docs) {
			res.status(200).send({})
		} 
		async.each(docs, (doc, cB) => {
			if (doc.googleID) {
				https.get("https://maps.googleapis.com/maps/api/place/details/json?key=AIzaSyCm5Sz261KXfwM82StwusIE__NxsJ6cemc&placeid=" + doc.googleID, (res) => {
					res.setEncoding("utf8");
					let body = "";
					res.on("data", data => {
						body += data;
					});
					res.on("end", () => {
						body = JSON.parse(body);
						if (body.result) {
						if (body.result.opening_hours) {
							doc.open_now = body.result.opening_hours.open_now
						} else {
							doc.open_now = 'unknown'
							}	
						}
						cB();
					})
				}) 
			} else {
				doc.open_now = 'unknown';
				cB();
			}
		}, (err) => {
			if (err) {
				console.log('error')
				res.status(500).send({msg:err})
			} else {
				res.status(200).send(docs);
			}
		})
		}
})

})



router.post('/createNew', function(req, res, next) {
	let db = req.db;
	let collection = db.get('bathrooms');
	let reviews = db.get('reviews');
	let photos = db.get('photos');

	let newToilet = {
		name: req.body.name ? req.body.name : null,
		location: req.body.location ? req.body.location : null,
		latitude: req.body.latitude ? req.body.latitude : null,
		longitude: req.body.longitude ? req.body.longitude: null,
		geolocation: {
			type: "Point",
			coordinates: [req.body.longitude, req.body.latitude]
		},
		googleID: req.body.googleID ? req.body.googleID : null,
		hours: req.body.hours ? req.body.hours : null,
		type: req.body.type ? req.body.type : null
	};
	// check whether already exists in DB


	// waterfall inserts to bathrooms collection, then review collection, then writes file to photos
	async.waterfall([
		(cB) => {
			let query = {"geolocation": {"$nearSphere": {"$geometry": {"type": "Point","coordinates": [newToilet.longitude, newToilet.latitude]},"$maxDistance": 1609.34}}}
			collection.find(query, (err, results) => {
				if (err) {
					cB(err)
				} else {
					for (let i=0; i<results.length; i++) {
						if (results[i].name === newToilet.name || results[i].location === newToilet.location || results[i].googleID === newToilet.googleID) {
							// res.status(200).send({msg: 'this toilet already exists'})
							cB('already exists')
						}
					}
				}
				cB(null, true)
			})
		},
		(x, cB) => {
			console.log('at insert toilet stage');
			collection.insert(newToilet, (err, doc) => {
				if (err) {
					console.log('error inserting toilet');
					cB(err)
				} else {
					cB(null, doc._id)
				}
			})
		},
		(docID, cB) => {
			console.log('at insert review stage');
			console.log(docID)
			let review = {
				toiletID: docID,
				stars: req.body.rating ? req.body.rating: null,
				comments: req.body.comments ? req.body.comments : null,
				clean: req.body.clean,
				gender_neutral: req.body.gender_neutral,
		        private_room: req.body.private_room,
		        handicap: req.body.handicap,
		        diaper_station: req.body.diaper_station,
		        attendant: req.body.attendant,
		        pet_friendly: req.body.pet_friendly,
		        cust_only: req.body.cust_only,
			}
			if (req.body.rating || req.body.comments) {
				reviews.insert(review, (err, doc) => {
					if (err) {
						console.log(err);
						console.log('error inserting review');
						cB(err);
					} else {
						cB(null, docID)
					}
				})
			} else {
				cB(null, docID);
			}
		},
		(docID, cB) => {
			console.log('at file saving stage');
			if (req.body.file && req.body.file != {}) {
				let fileData = req.body.file;
				let buf = new Buffer(fileData, 'base64');
				let photoRef = {
					toiletID: docID,
					reference_id: 1,
					file_name: 1+'.'+req.body.fileType
				}
				if (req.body.file) {
					fs.mkdir('public/bathrooms/'+docID, (err) => {
						if (err) {
							console.log('error creating directory');
							cB(err)
						}
						else {
							fs.writeFile('public/bathrooms/'+ docID +'/' + 1 + "." + req.body.fileType, buf, (err) => {
								if (err) {
									console.log('error writing file');
									cB(err);
								} else {
									photos.insert(photoRef, (err,doc) => {
										if (err) {
											console.log('error inserting photo reference')
											cB(err);
										} else {
											cB(null, docID);
										}
									})
								}
							})
						}
					})
				}		
			} else {
				cB(null, docID);
			}
		}
		], function (error, result) {
			if (error) {
				if (error === 'already exists') {
					res.status(200).send({msg: "already exists"})
				} else {
					console.log('error at end of callback');
					res.status(500).send({msg: "error at end of callback: " + error})
				}
				
			}
			else {
					let x = {
						msg: 'all good',
						id: result
					}
					res.status(200).send(x)
				}}
		)
});



module.exports = router;