const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// name email photo password passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    maxlength: [50, 'A tour name must have less or equal then 10 characters '],
    minlength: [3, 'A tour name must have more or equal then 3 characters '],
  },

  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email',
    },
  },

  photo: {
    type: String,
    default: 'default.jpg',
  },

  role: {
    type: String,
    enum: {
      values: ['admin', 'user', 'lead-guide', 'guide'],
      message: 'Difficulty is either either: easy, medium, difficult',
    },
    default: 'user',
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'pls confrim password!'],
    validate: {
      // This only works on SAVE and Create!!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'pls input same password!',
    },
  },

  passwordChangeAt: Date,

  // 忘记密码也需要一个token，这个是随机生成的
  passwordResetToken: String,

  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  // 可以这样理解，usemodel创建好之后所有的东西都是空的，当你把输入了密码之后就是被修改了所以正常执行，当你什么输入密码就是false了
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12,  default加密方式是HS256
  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm field 实际是不需要存在数据库中的
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password' || this.isNew)) return next();
  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// 判断用户登录是否是同一个密码 correctPassword
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  console.log(candidatePassword, userPassword);
  // 这里是compare，注意不要传错了参数，第一个参数会进行加密🔐，然后第二个参数是加密之后的
  // 如果相等返回true，否则返回false
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 判断token的失效，比如你是在1月1号登录的，它会给你一个token，假设token持续时间是7天,那么你在旅行页面上超过七天之后去更改密码，它就会给你一个时间，这个时间是超过token的有效期的。那么你就需要重新登陆重新获得一个token
// JWTTimestamp token 有效时间, 这里要反复细品
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    // changedTimestamp 改密码的最新时间
    const changedTimestamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp; // 1月.1号 < 2月.1号
  }
  return false;
};

// createPasswordResetToken

userSchema.methods.createPasswordResetToken = function () {
  // 随机生成一个32个字节十六进制的字符串
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash加密 sha256, 加密的数据 resetToken, digest摘要输出是以hex形式
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 十分钟之内有效
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
