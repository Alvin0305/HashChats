import axios from "./axiosInstance";

export const uploadFileMessage = (formData, token) => {
  axios.post("/api/messages/upload", formData, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": undefined },
    withCredentials: true,
  });
};

export const fetchAllMedia = async (id, token) => {
  return await axios.get(`/api/messages/media/${id}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": undefined },
    withCredentials: true,
  });
};

export const sendMessage = (messageData, token) => {
  axios.post(`/api/messages/`, messageData, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};

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

export const markAllMessagesReadByUserAPI = (id, token, chat_id, reader_id) =>
  axios.post(
    `/api/messages/${id}`,
    { chat_id: chat_id, reader_id: reader_id },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );
