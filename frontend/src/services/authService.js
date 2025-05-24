import axios from "./axiosInstance";

export const loginUser = (userData) => axios.post("/api/auth/login", userData);
export const registerUser = (userData) =>
  axios.post("/api/auth/register", userData);
export const getUserProfile = (token) =>
  axios.get("/api/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
