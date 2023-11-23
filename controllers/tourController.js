// const fs = require('fs');
/*eslint-disable*/
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// 工厂函数🏭
const FactoryFunc = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

// To check if the uploaded files are image or not
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// upload.array('images', 3)--> For multiple files(single filed)
// upload.single('image')--> For a single file

// Multiple files(multiple fields)
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image\
  req.body.imageCover = `tour-${req.params.id}-cover.jpeg`; // DB
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const fileName = `tour-${req.params.id}-${index + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    }),
  );
  next();
});

// 中间件，当你访问指定路径给你5条价格最便宜的旅游数据
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// 2) ROUTE HANDLERS
exports.getAllTours = FactoryFunc.getAll(Tour);

exports.getTour = FactoryFunc.getOne(Tour, { path: 'reviews' });

exports.updateTour = FactoryFunc.updateOne(Tour);

exports.createTour = FactoryFunc.createOne(Tour);

exports.deleteTour = FactoryFunc.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // 先筛选出 ratingAverage大于等于 4.5的
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    // 然后按照下面的条件进行分组，分组的_id是difficulty，就是easy，MEDIUM,difficult 转化为大写
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // 这里就是分完组之后再接着对平均价格进行排序 默认1就是升序, -1就是降序
    {
      $sort: { avgPrice: 1 },
    },
    // 可以接着对组进行操作，这里就是$ne是排除的意思，排除id是EASY的组
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021 * 1转为Number

  const plan = await Tour.aggregate([
    {
      // 这个意思是，startDates数组中有三条数据，每条都抽出来形成一个新的对象，其他的不变，那么一个数组有3条时间数据，那么就会生成3个对象，可是一共有9条数据，每一条数据的startDates都是有三条数据的，所以一共就会有27个对象
      $unwind: '$startDates',
    },
    // match 匹配字段是在2021年1-1到 2021年到12-31号，gte大于等于，lte小于等于
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    // 分组按照以下方式，提取startDates中的数据以月份来分组
    // $sum求和，看看有多少个数据是在同一个月份的。
    // $push，原地返回一个数组，把name添加到数组中
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: {
          $push: '$name',
        },
      },
    },
    // 顾名思义 添加字段名。值是上面分好组的$_id
    {
      $addFields: {
        month: '$_id',
      },
    },
    // 字段显示与隐藏，当你把字段设置为0，那就是隐藏
    {
      $project: {
        _id: 0,
      },
    },
    // 排序，按照numToursStarts的降序排序，最大的在第一
    {
      $sort: { numToursStarts: -1 },
    },
    // 限制返回多少条数据
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

/**
 * path /tours-within/233/center/34.079685,-118.183222/unit/mi
 * 获得当前地方最近的distance的旅游城市
 */
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  // 解析经纬度
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError('Pls provide latitutr and longitude in the format lat, lng'),
      400,
    );
  }

  // 查找，用经纬度方式$geoWithin, 再利用$centerSphere传入一个数组，第一个参数是数组(经纬度)，第二个参数是半径，意思就是，以这个lng和lat为起点，radius为半径画圆
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

/**
 * 获得当前最近到最远的城市之间的距离
 */
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  // 解析经纬度
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError('Pls provide latitutr and longitude in the format lat, lng'),
      400,
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        // 如果只有1个参数类型是Point类型的就不需要指定key
        key: 'startLocation',
        // 返回的数据放在distance字段
        distanceField: 'distance',
        // distance子弹是数字，可以使用distanceMultiplier让他乘以多少
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

// 等我先说
