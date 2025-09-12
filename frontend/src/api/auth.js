import API from './axios';

export const forgotPassword = (email) =>
  API.post('/auth/forgot-password', { email })

export const resetPassword = (token, newPassword) =>
  API.post('/auth/reset-password', { token, newPassword });

export const changePassword = (username, OTP, newPassword) =>
  API.patch(`/auth/change-password/${username}`, {
    OTP,
    newPassword,
  });

  export const updateUser = (data) => API.patch('/auth/update-user', data);

