import axios from "./axiosInstance";

export const fetchUserChats = (token) =>
  axios.get(`/api/chats`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

export const fetchMediaInChat = (id, token) =>
  axios.get(`/api/chats/media/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

export const createChat = (userIds, name, is_group, token) =>
  axios.post(
    `/api/chats`,
    { userIds, name, is_group },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );

export const fetchPinnedMessageInChat = (id, token) =>
  axios.get(`/api/chats/pinned/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
