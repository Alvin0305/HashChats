import React, { useEffect, useRef, useState } from "react";
import "./Chats.css";
import { useUser } from "../../../contexts/userContext";
import Message from "./Message/Message";
import { pinMessage, unpinMessage } from "../../../services/messageService";
import { fetchPinnedMessageInChat } from "../../../services/chatService";
import { FaMapPin, FaPinterest, FaTimes, FaUtensilSpoon } from "react-icons/fa";
import { useChatList } from "../../../contexts/chatlistContext";

const Chats = ({
  chat,
  messages,
  setMessages,
  replyTo,
  setReplyTo,
  setUpdateMessage,
  setShowProfile
}) => {
  const { user } = useUser();
  const { chatlist } = useChatList();

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message_id: null,
  });

  const endOfChatRef = useRef(null);

  const [pinnedMessage, setPinnedMessage] = useState(null);

  const handlePin = async (message) => {
    try {
      console.log(user);
      const response = await pinMessage(message.id, user.token);
      console.log(response.data);
      setPinnedMessage(message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnpin = async () => {
    try {
      console.log(user);
      const response = await unpinMessage(pinnedMessage.id, user.token);
      console.log(response.data);
      setPinnedMessage(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log("chat:", chat);
    console.log("chatlist: ", chatlist);

    console.log("scrolling to the end");

    const fetchPinnedMessage = async () => {
      try {
        const response = await fetchPinnedMessageInChat(chat.id, user.token);
        console.log(response.data);
        if (response.data) setPinnedMessage(response.data);
        else setPinnedMessage(null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPinnedMessage();
  }, [chat]);

  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ ...contextMenu, visible: false });
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  return (
    <div className="chats">
      {pinnedMessage && (
        <div className="pinned-message">
          <h4 className="pinned-message-text m0">{pinnedMessage.text}</h4>
          <FaTimes className="pinned-message-icon" onClick={handleUnpin} />
        </div>
      )}
      {messages.map((message, index) => (
        <Message
          key={index}
          message={message}
          user={user}
          chat={chat}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          setPinnedMessage={handlePin}
          setUpdateMessage={setUpdateMessage}
          setShowProfile={setShowProfile}
        />
      ))}
      <div ref={endOfChatRef} />
    </div>
  );
};

export default Chats;
