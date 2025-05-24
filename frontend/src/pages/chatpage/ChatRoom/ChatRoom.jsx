import React, { useState, useEffect } from "react";
import { useChat } from "../../../contexts/chatContext";
import "./chatroom.css";
import ChatHeader from "../ChatHeader/ChatHeader";
import { useUser } from "../../../contexts/userContext";
import Chats from "../Chats/Chats";
import { FaPlus } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import {
  fetchMessages,
  updateMessageAPI,
} from "../../../services/messageService";
import socket from "../../../sockets";

const ChatRoom = () => {
  const { chat, setChat } = useChat();
  const { user } = useUser();

  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        console.log(chat);
        const response = await fetchMessages(chat.id, user.token);
        setMessages(response.data);
        socket.emit("join_chat", chat.id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
  }, [chat]);

  useEffect(() => {
    socket.on("receive_message", ({ newMessage }) => {
      console.log("received new message", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on("message_deleted", (message_id) => {
      console.log("message with id deleted:", message_id);
      setMessages((prevMessages) =>
        prevMessages.filter((m) => {
          if (m.id === message_id) m.deleted = true;
          return m;
        })
      );
    });

    socket.on("message_updated", (updatedMessage) => {
      console.log("updating in frontend");
      console.log(updatedMessage);

      setMessages((prevMessages) =>
        prevMessages.filter((m) => {
          if (m.id === updatedMessage.id) {
            m.edited = true;
            m.text = updatedMessage.text;
          }
          return m;
        })
      );
      setMessageInput("");
    });

    return () => {
      socket.off("receive_message");
    };
  }, [chat]);

  const handleUpdate = () => {
    try {
      const text = messageInput.trim();
      socket.emit("update_message", updateMessage.id, chat.id, text);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim()) return;
    if (updateMessage) return handleUpdate();

    const messageData = {
      sender_id: user.id,
      text: messageInput,
      chat_id: chat.id,
      reply_to: replyTo?.id || null,
      file_url: null,
    };

    socket.emit("send_message", messageData);
    setMessageInput("");
    setReplyTo(null);
  };

  const iconSize = 24;
  const [messageInput, setMessageInput] = useState("");

  return (
    <div className="chat-room">
      {chat ? (
        <div className="chat-box">
          <ChatHeader user={user} chat={chat} />
          <Chats
            chat={chat}
            messages={messages}
            setMessages={setMessages}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            setUpdateMessage={setUpdateMessage}
          />
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="message-input-div"
          >
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Message..."
              className="message-field"
            />
            <button className="message-button">
              <FaPlus className="message-icon" size={iconSize} />
            </button>
            <button className="message-button" type="submit">
              <FiSend className="message-icon" size={iconSize} />
            </button>
          </form>
        </div>
      ) : (
        <div className="empty-chat-room">
          <h1>SELECT SOMEONE TO CHAT</h1>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
