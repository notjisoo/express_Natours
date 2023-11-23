class AppError extends Error {
  constructor(message, statusCode) {
    // 接受父亲传过来的message，给自己用
    // new Error() ,必须要传值
    super(message);

    // new的时候传过来的状态码
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Error.captureStackTrace(this, this.constructor); 通过this.constructor传入constructorOpt参数在自定义Error类中使用captureStackTrace时，推荐采用该方法。
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
