/*eslint-disable*/
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const FactoryFunc = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-userID-timestamp
//     // file.mimetype--> 'image/jpeg'
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

// To check if the uploaded files are image or not
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

// To resize user photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// filterObj
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Pls use /sign up',
  });
};

exports.getMe = (req, res, next) => {
  // protect中间件传过来的id值，给getMe中间件，然后Getme中间件req.params就有ID了。这时候下一个中间件就可以访问到params
  // 为什么这里protect中间件到id不可以直接用到getUser中呢？
  // 因为一开始protect到ID是设置在req.user中的，并不是在路径中的，所以你要把它添加到params中
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user Posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Pls use /updateMyPassword',
        400,
      ),
    );
  }
  // 2. Filtered out unwanted fields names that arr not allowed to be update
  // 过滤掉数据，只选择name和email, 因为函数findByIdAndUpdate()第二个参数是选择你要更改的数据，所以你只选择了name和email自然就会只有这个两个才会变更
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3. Update user document
  const updateUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// user Handlers
exports.getAllUsers = FactoryFunc.getAll(User);
exports.getUser = FactoryFunc.getOne(User);
// Do not update password with this!
exports.updateUser = FactoryFunc.updateOne(User);
exports.deleteUser = FactoryFunc.deleteOne(User);
