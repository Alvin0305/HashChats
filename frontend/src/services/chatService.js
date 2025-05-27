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

export const addMemberToChat = (chat_id, email, token) =>
  axios.post(
    `/api/chats/add-member`,
    { chat_id, email },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );

export const removeMemberFromChat = (chat_id, email, token) =>
  axios.post(
    `/api/chats/remove-member`,
    { chat_id, email },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );

export const updateChat = (chat_id, description, name, token) =>
  axios.put(
    `/api/chats/${chat_id}`,
    { description, name },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );

export const deleteAllMessagesInChat = (chat_id, token) =>
  axios.delete(`/api/chats/${chat_id}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

export const fetchUserGroups = (token) =>
  axios.get(`/api/chats/groups`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
