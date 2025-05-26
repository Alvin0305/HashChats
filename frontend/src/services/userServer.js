import axios from "./axiosInstance";

export const fetchUserByEmail = (email, token) =>
  axios.post(
    "/api/user/byemail",
    { email: email },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );

export const fetchUserById = (id, token) =>
  axios.get(`/api/user/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
