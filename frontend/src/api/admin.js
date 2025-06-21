import API from './axios';

export const createAdmin = (adminData) =>
  API.post('/admin/add', adminData);

export const getAllUsers = () =>
  API.get('/admin/users');

export const promoteUser = (userId) =>
  API.patch(`/admin/promote/${userId}`);

export const demoteUser = (userId) =>
  API.patch(`/admin/demote/${userId}`);
