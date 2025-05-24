import React from "react";
import { FaPhone, FaVideo } from "react-icons/fa";

import "./chatheader.css";

const ChatHeader = ({ user, chat }) => {
  const getDisplayName = () => {
    if (chat.is_group) return chat.name;
    return chat.members.filter((m) => m.username != user.username)[0].username;
  };

  const imgWidth = 40;
  const iconWidth = 24;

  const getAvatar = () => {
    if (chat.is_group) return chat.image;
    return chat.members.filter((m) => m.username != user.username)[0].avatar || "/avatar.webp";
  };

  const getStatus = () => {
    if (chat.is_group) return false;
    return (
      chat.members.filter((m) => m.username != user.username)[0].status ===
      "online"
    );
  };

  return (
    <div className="chat-header">
      <div className="chat-header-img-name-div">
        <img src={getAvatar()} alt="No internet" width={imgWidth} className="avatar"/>
        <h3 className="chat-header-name">{getDisplayName()}</h3>
      </div>
      <div className="chat-header-icons-div">
        <FaPhone className="chat-header-icon" size={iconWidth} />
        <FaVideo className="chat-header-icon" size={iconWidth} />
      </div>
    </div>
  );
};

export default ChatHeader;
