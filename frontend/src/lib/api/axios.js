import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
  //   baseURL: "/api",
  //   baseURL: "",
});

// Interceptor to add token
API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
