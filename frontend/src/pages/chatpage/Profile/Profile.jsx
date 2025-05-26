import React, { useEffect, useState } from "react";
import { useUser } from "../../../contexts/userContext";
import { fetchUserById } from "../../../services/userServer";
import { fetchMediaInChat } from "../../../services/chatService";
import "./Profile.css";
import { useChat } from "../../../contexts/chatContext";
import { FaTimes } from "react-icons/fa";

const Profile = ({ setShowProfile }) => {
  const { user: currentUser } = useUser();
  const [user, setUser] = useState(null);

  const [media, setMedia] = useState([]);

  const { chat } = useChat();

  useEffect(() => {
    const user = chat.members.find((m) => m.id !== currentUser.id);
    console.log("chat: ", chat);
    console.log(user);
    const fetchInitials = async () => {
      try {
        const [userResponse, mediaResponse] = await Promise.all([
          fetchUserById(user.id, currentUser.token),
          fetchMediaInChat(chat.id, currentUser.token),
        ]);
        console.log(userResponse.data);
        console.log(mediaResponse.data);
        setUser(userResponse.data);
        setMedia(mediaResponse.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitials();
  }, [chat]);

  const isImageFile = (url, type) => {
    if (type) return type.startsWith("image/");
    if (url) return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
    return false;
  };

  const isVideoFile = (url, type) => {
    if (type) return type.startsWith("video/");
    if (url) return /\.(mp4|webm|ogg)$/i.test(url);
    return false;
  };

  const getMedia = (message) => {
    if (isImageFile(message.file_url, message.file_type)) {
      return (
        <img
          src={message.file_url}
          alt={message.original_filename}
          className="profile-page-image"
          key={message.id}
          onClick={() => window.open(message.file_url, "_blank")}
        />
      );
    }

    if (isVideoFile(message.file_url, message.file_type)) {
      return (
        <video
          controls
          src={message.file_url}
          className="profile-page-video"
          key={message.id}
          onClick={() => window.open(message.file_url, "_blank")}
        ></video>
      );
    }

    return "";
  };

  useEffect(() => {
    console.log("profile page loading");
  }, []);

  return (
    <div className="profile">
      <button
        className="profile-close-button"
        onClick={() => setShowProfile(false)}
      >
        <FaTimes size={24} color="white" />
      </button>
      <img src={user?.avatar} alt="Avatar" className="profile-avatar" />
      <h1 className="profile-page-username m0">{user?.username}</h1>
      <h4 className="profile-page-email m0">{user?.email}</h4>
      <p className="profile-page-description">{user?.description}</p>
      <h2 className="profile-page-heading">MEDIA</h2>
      <div className="profile-page-media-div">
        {media.map((m) => getMedia(m))}
      </div>
    </div>
  );
};

export default Profile;
