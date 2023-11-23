/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { isLoading } from './alerts';
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userUpdatePasswordForm = document.querySelector('.form-user-password');

// test dialog
const test = document.querySelector('.test');

test.addEventListener('click', (e) => {
  e.preventDefault();
});

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);
    updateSettings(form, 'data');
  });
}

if (userUpdatePasswordForm) {
  userUpdatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    isLoading('正在加载中...', 1);
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    const res = await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    if (res === 1) {
      isLoading('修改成功!!!', -1);
    } else {
      isLoading(' ', -1);
    }

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
