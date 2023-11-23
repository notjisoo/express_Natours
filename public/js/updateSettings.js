/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success' && type !== 'password')
      showAlert('success', `${type.toUpperCase()} updated Successfull!`);
    return 1;
  } catch (error) {
    showAlert('error', error.response.data.message);
    return -1;
  }
};
