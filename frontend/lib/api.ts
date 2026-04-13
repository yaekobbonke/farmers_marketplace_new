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
  // Use the environment variable if it exists, otherwise fallback to Render
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://farmers-marketplace-twy3.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;