import axios from "./axiosInstance";

export const fetchMessages = (id, token) =>
  axios.get(`/api/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

export const getMessageById = (id, token) =>
  axios.get(`/api/messages/message/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

export const pinMessage = (id, token) =>
  axios.patch(
    `/api/messages/${id}/pin`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );

export const unpinMessage = (id, token) =>
  axios.patch(
    `/api/messages/${id}/unpin`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );

export const updateMessageAPI = (id, token, text) =>
  axios.put(
    `/api/messages/${id}`,
    { text: text },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );
