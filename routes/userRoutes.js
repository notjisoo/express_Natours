const express = require('express');

const router = express.Router();
const {
  SignUp,
  Login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
} = require('../controllers/authController');

const {
  getAllUsers,
  createUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');

// SignUp Route 这个是登陆页面的时候点击注册的路由，和下面的users API中的createUsers不同
router.post('/signup', SignUp);
router.post('/login', Login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// 上面不需要token Protect all routes after this middleware
router.use(protect);
// 下面需要token用户验证

router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

// 只有admin才可以有以下操作 || users API createUsers这个是超级管理员
router.use(restrictTo('admin'));
router.route('/').get(getAllUsers).post(createUsers);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
