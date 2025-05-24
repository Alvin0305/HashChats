import axios from "./axiosInstance";

export const fetchUserChats = (token) =>
  axios.get(`/api/chats`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
export const createChat = (userIds, name, is_group) =>
  axios.post(`/api/chats`, { userIds, name, is_group });

export const fetchPinnedMessageInChat = (id, token) =>
  axios.get(`/api/chats/pinned/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
