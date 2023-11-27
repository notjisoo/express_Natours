// 4) START SERVICE
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 捕获任何报错的异常,必须将这个时间添加到堆栈中才行，也就是说这个事件要在发生异常之前调用
process.on('uncaughtException', (err) => {
  // console.log('Uncaught exception 😍 Shutting down...');
  // console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful! 👒 🫣'));

// 这句话的意思是将这些.env的文件配置到process.env中，方便我们直接读取
const post = process.env.PORT || 3000;
const server = app.listen(post, () => {
  // console.log(`listen to ${post} ...`);
});

// 当你程序有未处理的Promise Reject的时候就会调用这个事件，并且执行当前回调函数
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UnhandleRejection 👰🏻‍♀️ Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
