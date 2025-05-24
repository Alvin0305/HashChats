import React from "react";
import "./chattile.css";
import { FaCheck } from "react-icons/fa";
import { useChat } from "../../../../contexts/chatContext";

const ChatTile = ({ user, chat }) => {
  const getDisplayName = () => {
    if (chat.is_group) return chat.name;
    return chat.members.filter((m) => m.username != user.username)[0].username;
  };

  const iconWidth = 40;

  const getAvatar = () => {
    if (chat.is_group) return chat.image;
    return (
      chat.members.filter((m) => m.username != user.username)[0].avatar ||
      "/avatar.webp"
    );
  };

  const getStatus = () => {
    if (chat.is_group) return false;
    return (
      chat.members.filter((m) => m.username != user.username)[0].status ===
      "online"
    );
  };

  const { chat: selectedChat, setChat } = useChat();

  return (
    <div
      className={`chat-tile ${
        selectedChat && selectedChat.id === chat.id ? "selected-chat-tile" : ""
      }`}
      onClick={() => setChat(chat)}
    >
      <div className="chat-avatar-name-div">
        <img
          src={getAvatar()}
          alt="No internet"
          width={iconWidth}
          className="avatar"
        />
        <h3 className="chat-tile-name">{getDisplayName()}</h3>
      </div>
      {getStatus() ? <FaCheck size={20} color="green" /> : ""}
    </div>
  );
};

export default ChatTile;
