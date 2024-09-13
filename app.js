var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var router = express.Router();
const socketIo = require("socket.io");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mqtt = require('./helpers/mqtt');
const misc = require('./helpers/misc');
const redis = require('./helpers/redis')

var registrationRouter = require('./routes/registration');
var addDeviceRouter = require('./routes/deviceops');
var miscRouter = require('./routes/misc');
var loginRouter = require('./routes/login');
var addBatchRouter = require('./routes/addBatch');
var viewBatchesRouter = require('./routes/viewBatches');
var batchOpsRouter = require('./routes/batchOperations');
var thresholdsRouter = require('./routes/thresholds');
var updateUserRouter = require('./routes/updateUser');
var dashboardRouter =  require('./routes/dashboard');
var historyRouter =  require('./routes/history');
var addFctokenRouter = require('./routes/addTokens');
var testPushRouter = require('./routes/testPush')
var activeBatchRouter = require('./routes/batchDetails'); 
var closedBatchRouter = require('./routes/closedBatchDetails'); 
var adminDashBoardRouter = require('./routes/adminDashboard');
var deviceReadingRouter = require('./routes/deviceReadings');
var otaRouter = require('./routes/otaUpdates');
var adminRouter = require('./routes/admin')
var app = express();
const cors = require('cors');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const produrl  = '/api/v1/';
//const produrl  = '/test/v1/';

app.use('/', indexRouter);
app.use(produrl+'users', usersRouter);
app.use(produrl+'userRegistration', registrationRouter);
app.use(produrl+'device', [misc.authenticateToken], addDeviceRouter);
app.use(produrl+'misc', [misc.authenticateToken], miscRouter);
app.use(produrl+'login', loginRouter);
app.use(produrl+'addBatch', [misc.authenticateToken], addBatchRouter);
app.use(produrl+'viewBatches', [misc.authenticateToken], viewBatchesRouter);
app.use(produrl+'batchops', [misc.authenticateToken], batchOpsRouter);
app.use(produrl+'thresholds', [misc.authenticateToken], thresholdsRouter);
app.use(produrl+'updateUser', [misc.authenticateToken], updateUserRouter);
app.use(produrl+'dashboard', [misc.authenticateToken], dashboardRouter);
app.use(produrl+'history', [misc.authenticateToken], historyRouter);
app.use(produrl+'addFcmtoken', [misc.authenticateToken], addFctokenRouter);
app.use(produrl+'testPush', [misc.authenticateToken], testPushRouter);
app.use(produrl+'activeBatch', [misc.authenticateToken], activeBatchRouter);
app.use(produrl+'closedBatchdetails', [misc.authenticateToken], closedBatchRouter);

app.use(produrl+'adminDashboard', [misc.authenticateToken], adminDashBoardRouter);

app.use(produrl+'sensor', deviceReadingRouter);

app.use('/api/v1/admin', adminRouter);
app.use(produrl+'otaupdate', otaRouter);


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  next(createError(404));
});
let interval;

// io.on("connection", (socket) => {
//   console.log("New client connected");
//   if (interval) {
//     clearInterval(interval);
//   }
//   interval = setInterval(() => getApiAndEmit(socket), 1000);
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//     clearInterval(interval);
//   });
// });

// const getApiAndEmit = socket => {
//   const response = new Date();
//   // Emitting a new message. Will be consumed by the client
//   socket.emit(produrl+'dashboard/latestReadings/', response);
// };
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({
    status: false,
    message: err.message
  });
});

module.exports = app;
