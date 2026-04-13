// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://127.0.0.1:5000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "https://farmers-marketplace-twy3.onrender.com/api",
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Ensure there is a space between 'Bearer' and the token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;