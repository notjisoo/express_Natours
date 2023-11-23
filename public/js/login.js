/* eslint-disable */
// 24321@qq.com test1234
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    // 当你点击logout的时候，会调用这函数，然后url发送请求，这个路径是存在的所以必然可以请求成功，当你访问到这个路径的时候，它又会调用authController里面的logout,会重新设置一个cookie，持续十秒钟，但是这个cookie的值是不对的，然后执行完之后返回success，所以会执行location.reload(true)，重新从服务器请求 当前路径，即 “/”, 因此会执行 router.get('/', isLoggedIn, getOverview); 当进入到isLoggedIn发现你的cookie中的值不对，所以只能next，就是重新请求全部参数
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });
    // 这个location.reload(true) 表示不走本地浏览器缓存，从服务器中重新请求一次
    if (res.data.status === 'success') location.reload(true);
  } catch (error) {
    showAlert('error', 'Error logging out! Try again');
  }
};
