const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util'); // 处理promise的，避免回调地狱
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, StatusCode, res) => {
  const token = signToken(user._id);

  // cookie配置
  const cookieOptions = {
    // 有效期
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // 在http访问下有效
    httpOnly: true,
  };
  // 它表示创建的cookie 只能在HTTPS 连接中被浏览器传递到服务器端进行会话验证
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(StatusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// 注册
exports.SignUp = catchAsync(async (req, res, next) => {
  // User.save() same User.create()
  const newuser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role,
  });

  newuser.password = undefined;

  createSendToken(newuser, 201, res);
});

// 登录
exports.Login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1. Check if email and password exist
  if (!email || !password)
    return next(new AppError('Pls provide email and password!', 400));

  // 2. Check if user exists && password is correct 找到对应的邮箱，只需要返回password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. If everything ok, send token to client
  createSendToken(user, 200, res);
});

// 模拟注销，返回一个空的cookie但是里面的值是错误的，就对不上
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// 判断token是否有效
exports.protect = catchAsync(async (req, res, next) => {
  // 1.Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  // 如果没有token，提示用户请登录获取授权
  if (!token) return next(new AppError('pls login get access!'), 401);

  // 2.Verification token promisify传递一个函数，返回的一个promise函数，多用于处理回调地狱
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3.Check if user still exists, 假设访问的途中被当前对应的用户被删除了, 可是你是拿着它的token的依然是可以访问到数据, 这样子显然是不对的
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist'),
      401,
    );
  }

  // 4.Check if user changed password after the token was issued

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Pls log in again!', 401),
    );
  }

  // Grant access to protected route
  // 这一步很关键, 如果你通过了那么你接下来是要带着这个token去做什么操作？，所以你需要把这个用户存储到req.user中，好让下一个中间件能拿到数据，例如你要删除一个用户
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token / 验证错误，直接下个中间件
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// restrictTo / role = ['admin','lead-guide'], 判断用户角色是否是包含
exports.restrictTo =
  (...role) =>
  (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

// 忘记密码
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 401));
  }
  // 2.Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // validateBeforeSave 是否是在要通过验证之后再save
  await user.save({ validateBeforeSave: false });

  // 3.Send it to user's email
  const resetURL = `${req.protect}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:${resetURL}.\n If you didn't forget your password,pls ignore this email`;

  // 这里的是tryCatch的意思是，不只是发消息给客户，还要对内部数据进行处理
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

// 密码重置
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.Get user based on the token 这个就是拿他随机生成的来加密按照这种方式
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2.If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 修改完数据之后 手动调用保存
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 3.Update changePasswordAt property for the user -> pre('SAVE',function{})
  // 4.Log the user in, sned JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2.Check if PostId current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError(' Current password did not match', 401));
  }

  // 3.if so, update password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4.Log user in, send JWT
  createSendToken(user, 200, res);
});
