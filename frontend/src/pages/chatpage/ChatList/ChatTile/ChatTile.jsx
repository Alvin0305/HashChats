import React from "react";
import "./chattile.css";
import { FaCheck, FaDotCircle } from "react-icons/fa";
import { useChat } from "../../../../contexts/chatContext";
import { useTab } from "../../../../contexts/tabContext";

const ChatTile = ({ user, chat }) => {
  const getDisplayName = () => {
    if (chat.is_group) return chat.name;
    return chat.members?.find((m) => m.username !== user.username).username;
  };

  const iconWidth = 40;

  const getUserLastSeen = () => {
    if (chat.is_group) return "";
    return `Last Seen: ${
      new Date(
        chat.members?.find((m) => m.username != user.username)?.last_seen_at
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) || "None"
    }`;
  };

  const getAvatar = () => {
    if (chat.is_group) return chat.image;
    return (
      chat.members?.find((m) => m.username != user.username).avatar ||
      "/avatar.webp"
    );
  };

  const getStatus = () => {
    if (chat.is_group) return false;
    return (
      chat.members?.find((m) => m.username != user.username).status === "online"
    );
  };

  const { chat: selectedChat, setChat } = useChat();
  const { setCurrentTab } = useTab();

  return (
    <div
      className={`chat-tile ${
        selectedChat && selectedChat.id === chat.id ? "selected-chat-tile" : ""
      }`}
      onClick={() => {
        console.log("changing to:", chat);
        setCurrentTab("chat-room");
        setChat(chat);
      }}
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
      {getStatus() ? (
        <FaDotCircle size={8} color="green" />
      ) : (
        <h5>{getUserLastSeen()}</h5>
      )}
    </div>
  );
};

export default ChatTile;
