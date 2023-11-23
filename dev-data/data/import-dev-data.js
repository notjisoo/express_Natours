const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const Tour = require('../../models/tourModel');
const Reviews = require('../../models/reviewModel');
const Users = require('../../models/userModel');
const Tours = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_LOCAL;

mongoose.connect(DB).then((val) => {
  console.log('DB connection successful!');
});

// Read Json File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

// Import Data Into DB
const importData = async () => {
  try {
    await Reviews.create(reviews);
    await Tours.create(tours);
    await Users.create(users, { validateBeforeSave: false });
    console.log('Data successfully loaded!');
  } catch (error) {
    console.log(error);
  }
  process.exit(); // 退出程序
};

// Delete All Data From DB
const deleteData = async () => {
  try {
    await Reviews.deleteMany();
    await Users.deleteMany();
    await Tours.deleteMany();
    console.log('Data successfully delete!');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
// 可以打印这个参数，是个数组，当你输入第三个参数的时候会加入到argv中
// console.log(process.argv);
// node dev-data/data/import-dev-data.js --import
// [
//   '/opt/homebrew/Cellar/node/21.1.0/bin/node',
//   '/Users/ljh/Desktop/complete-node-bootcamp/express/dev-data/data/import-dev-data.js',
//   '--import',
// ];
