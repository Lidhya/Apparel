require('dotenv').config()
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth')
const hbs = require('express-handlebars')
const app = express();
const fileUpload = require('express-fileupload')

const db = require('./config/connection')
const session = require('express-session')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }));

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("images"));
app.use(session({ secret: "key", resave: false, saveUninitialized: true }))
app.use(fileUpload())

// hbs create
const method = hbs.create({});

// register new function
method.handlebars.registerHelper('ifCond', function (v1, v2, options) {
  if (v1 == v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// register new function
method.handlebars.registerHelper('ifNot', function (v1, v2, options) {
  if (v1 != v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// database connection
db.connect((err) => {
  if (err) console.log('Database connection error' + err)
  else console.log('Database connected')
})

// routes
app.use('/', usersRouter);
app.use('/admin', adminRouter);
app.use('/otp', authRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err.message)
  if (req.session.loggedIn) {
    if (req.session.user) {
      var user = req.session.user
      res.render('error', { user });
    } else {
      var admin = req.session.admin
      res.render('error', { admin });
    }
  } else {
    res.render('error');
  }
});

module.exports = app;
