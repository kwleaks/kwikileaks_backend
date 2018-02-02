var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var https = require('https');
//Database
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('mongodb://kwleaks:kwikipassword@ds221228.mlab.com:21228/heroku_0rvdj3c6');
var cors = require('cors');

//for login and session stuff
// var bcrypt = require('bcrypt');
var session = require('express-session');
var MongoStore = require('connect-mongo');
// var multer = require('multer');
var async = require('async');

// var upload = multer({ dest: 'uploads/'});


var index = require('./routes/index');
// var users = require('./routes/users');
// var cursession = require('./routes/session');
var fake = require('./routes/fakedata');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    limit: '5mb',
    parameterLimit: 100000,
    extended: false 
}));
app.use(bodyParser.json({
    limit: '5mb'
}));
app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//allow cors
app.use(cors());
//set db as req on all http protocols
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(function(req, res, next){
	req.db = db;
	next();
})
app.use(session({
	secret: 'this is a secret',
	resave: true,
	saveUninitialized: false
}))

app.use('/', index);
// app.use('/users', users);
// app.use('/session', cursession)
app.use('/fake', fake)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
