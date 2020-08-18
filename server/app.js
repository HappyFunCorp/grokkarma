require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var bodyParser = require("body-parser");
var logger = require('morgan');
var session = require('express-session');
var os = require('os');

var indexRouter = require('./routes/index');
var accountsRouter = require('./routes/accounts');
var rewardsRouter = require('./routes/rewards');
var communitiesRouter = require('./routes/communities');

var app = express();

var sessionConfig = {
    secret:process.env.SESSION_SECRET,
    resave: false,
    httpOnly: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" && os.hostname().indexOf('ykarma.com') >= 0 }
};
if (process.env.NODE_ENV === "production") {
  var RedisStore = require('connect-redis')(session);
  sessionConfig.store = new RedisStore({url:"redis://redis:6379"});
}
app.use(session(sessionConfig));

var i18next = require("i18next");
var middleware = require("i18next-express-middleware");
const resources = require('./translations');
i18next.use(middleware.LanguageDetector).init({
  resources,
  preload: ["en", "kr"],
  fallbackLng: 'en',
});
app.use(
  middleware.handle(i18next, {
    removeLngFromUrl: false
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

console.log('hostname', os.hostname());
console.log('port', process.env.PORT);
console.log('env', process.env.NODE_ENV);
console.log('api key exists:', false || (process.env.API_KEY && process.env.API_KEY.length > 0));
console.log('ykarma', process.env.YKARMA_ADDRESS);

app.use(function (req, res, next) {
    if (req.path.startsWith('/api')) {
        if (process.env.NODE_ENV === "production") {
          if (req.get('X-Grokkarma-Key') !== process.env.API_KEY) {
            console.log('unauthorized api call');
            res.status(401);
            return res.json({"error":"unauthorized"});
          }
          req.session.urls = [process.env.ADMIN_URL];
          return next();
        } else {
          return next();
        }
    }
});

// routes
app.use('/api', indexRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/communities', communitiesRouter.router);
app.use('/api/rewards', rewardsRouter.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // TODO: set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV == "development" && false ? err : {};

  // render the error page
  console.log("error", err);
  res.status(err.status || 500);
  res.json({ error: err });
});

module.exports = app;
