import axios from "./axiosInstance";

export const checkIfChatIsFavourite = async (user_id, chat_id, token) => {
  return await axios.post(
    `/api/favourites/check`,
    { user_id, chat_id },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );
};

export const addToFavourites = async (user_id, chat_id, token) => {
  return await axios.post(
    `/api/favourites/add`,
    { user_id, chat_id },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );
};

export const removeFromFavourites = async (user_id, chat_id, token) => {
  return await axios.post(
    `/api/favourites/remove`,
    { user_id, chat_id },
    {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }
  );
};

export const getFavourites = async (user_id, token) => {
    return await axios.get(
      `/api/favourites/${user_id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
  };
  