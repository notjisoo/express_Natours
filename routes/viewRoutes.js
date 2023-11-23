const express = require('express');
const { isLoggedIn, protect } = require('../controllers/authController');

const router = express.Router();
const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  updateUserData,
} = require('../controllers/viewController');

router.get('/', isLoggedIn, getOverview);
router.get('/tour/:slug', isLoggedIn, getTour);
// /login
router.get('/login', isLoggedIn, getLoginForm);
// /me
router.get('/me', protect, getAccount);

router.get('/submit-user-data', protect, updateUserData);

module.exports = router;
// 最近很喜欢这段话“我用真心待你 但不执着于你 活在缘分中 而非关系里”
