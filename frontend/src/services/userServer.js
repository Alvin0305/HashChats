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

export const updateUser = (id, description, name, token) =>
  axios.put(
    `/api/user/${id}`,
    { description, name },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );

export const updateAvatar = (id, formData, token) => {
  return axios.post(`/api/user/upload/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": undefined },
    withCredentials: true,
  });
};
