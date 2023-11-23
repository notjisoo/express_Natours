const AppError = require('../utils/appError');

// 处理传入的无效ID Handling Invalid Database IDs
const handleCastErrorDB = (err) => {
  const message = `Invaild ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handling Duplicate Database Fields
const handleDuplicateFieldsDB = (err) => {
  // 正则
  // (["'])(\\?.)*?\1
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

// Handling Mongoose Validation Error
const handleValidatorErrorDB = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data ${error.join('. ')}`;
  return new AppError(message, 400);
};

// Handling token 的有效期 TokenExpiredError
const handleTokenExpiredError = () =>
  new AppError('pls log in argin, token abrove Expired', 401);

// Handling token JsonWebTokenError 无效的token
const handleJsonWebTokenError = () =>
  new AppError('this token invalid, pls log in argin', 401);

// 开发环境下就正常发送错误
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!!!',
    msg: err.message,
  });
};

// 上线之后就要对错误进行判断，看看是不是客户操作错误，或者是其他错误
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      // 如果是操作错误正常发送给客户
      // Operational,trusted error: send message to client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // Programming or other unknown error: don't leak error details 内部错误
    }
    // 1) Log error
    console.error('Error 🤧', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!!!',
      msg: err.message,
    });
  }
  console.error('Error 🤧', err);
  // 2) Send generic message 通用错误
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!!!',
    msg: 'Pls try again later ! ! !',
  });
};

// globalError
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // dev or pro
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // 拷贝一份，因为等下要重新赋值
    let error = { ...err };

    error.message = err.message;

    // Handling Invalid
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    //  Handling Duplicate
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // Handling Mongoose
    if (error.name === 'ValidationError') error = handleValidatorErrorDB(error);

    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();

    sendErrorProd(error, req, res);
  }
};
