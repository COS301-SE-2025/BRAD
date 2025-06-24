import { use } from 'react';
import API from './axios';

export const createAdmin = (adminData) =>
  API.post('/admin/add', adminData);

export const getAllUsers = () =>
  API.get('/admin/users');

export const promoteUser = (userId) =>
  API.patch(`/admin/promote/${userId}`);

export const demoteUser = (userId) =>
  API.patch(`/admin/demote/${userId}`);

export const deleteUser=(userId)=>
  API.delete(`/admin/delete/${userId}`)
