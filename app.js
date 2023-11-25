/*eslint-disable*/
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();

// 设置pug为模版引擎
app.set('view engine', 'pug');

// views，模板文件所在的目录。例如：app.set('views', './views')。默认为views应用程序根目录中的目录。
app.set('views', path.join(__dirname, 'views'));

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// 1) MIDDLEWARES 使用中间件
// 访问根目录127.0.0.1相当于访问public, Servings static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
//         baseUri: ["'self'"],
//         fontSrc: ["'self'", 'https:', 'http:', 'data:'],
//         scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
//         styleSrc: ["'self'", 'https:', 'http:', 'unsafe-inline'],
//       },
//     },
//   }),
// );
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

if (process.env.NODE_ENV === 'development') {
  // 显示日志
  app.use(morgan('dev'));
}

// return is Midfunc, Limit requests from same API
const limiter = rateLimit({
  // 在1小时内允许的同时请求时100个
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, pls try agarin in one hour!',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body, 返回参数是json
app.use(express.json({ limit: '10kb' }));
// 解析以表单形式发送的请求传的参数
app.use(express.urlencoded());
// 解析cookie
app.use(cookieParser());

// Data sanitization against NoSQL query injection
// 会检查你传入的任何形式的参数，{$gt:""}, 它会去除美元符号$
app.use(mongoSanitize());

// Data sanitization against XSS
// 如果你传入的是HTTP结构的，如果你这样输入
// "name":"<div id='jaosn'>name</div>",
// "name": "&lt;div id='jaosn'>name&lt;/div>",
app.use(xss());

// Prevent parameter pollution
// 参数污染，不可以写两个sort，但是下面是白名单，表示路径中可以出现两个duration...hb
app.use(
  hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'price'],
  }),
);

// 前置 ，在请求添加字段, Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// const test = (req, res, next) => {
//   console.log("test运行喽");
//   next();
// };
// const test2 = (req, res, next) => {
//   console.log(req);
//   console.log("test222222运行喽");
//   next();
// };
// app.get("/api/v1/test", test, test2, (req, res) => {
//   res.status(200).json({
//     test: "this is test middleware",
//   });
// });

// 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// 后置 注意这里的app.all是不可以再普通路由上面的，这算是一个兜底，如果放在最上面那么不管你的什么请求都会是这个一个，因为有 *
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // 定义个错误对象
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // 将这个错误对象传给下一个中间件，即如下定义的
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 定义一个处理错误的中间件如下,这个每当你next(err)的时候都会调用
app.use(globalErrorHandler);
module.exports = app;
