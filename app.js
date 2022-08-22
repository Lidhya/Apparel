require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
const cors = require('cors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var authRouter = require('./routes/auth')
var hbs=require('express-handlebars')
var app = express();
var fileUpload=require('express-fileupload')
var flash        = require('req-flash');

var db=require('./config/connection')
var session=require('express-session')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine( 'hbs', hbs.engine({ extname: 'hbs', defaultLayout:'layout', layoutsDir:__dirname + '/views/layout/', partialsDir:__dirname + '/views/partials/' })); 

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("images"));
app.use(session({secret:"key",resave:false, saveUninitialized:true})) 
app.use(fileUpload())

var method = hbs.create({});

// register new function
method.handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 == v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

db.connect((err)=>{
  if(err) console.log('connection error'+err)
  else console.log('Database connected')
})

app.use('/', usersRouter);
app.use('/admin', adminRouter);
app.use('/otp',authRouter)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err.message)
  if(req.session.loggedIn){
    if(req.session.user){
      var user=req.session.user
      res.render('error',{user});
    }else{
      var admin=req.session.admin
      res.render('error',{admin});
    }
  }else{  
    res.render('error');
  }
  
});

module.exports = app;
