import React, { useState, useEffect, use } from "react";
import { useChat } from "../../../contexts/chatContext";
import "./chatroom.css";
import ChatHeader from "../ChatHeader/ChatHeader";
import { useUser } from "../../../contexts/userContext";
import Chats from "../Chats/Chats";
import { FaPlus, FaTimes } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import {
  fetchMessages,
  uploadFileMessage,
} from "../../../services/messageService";
import socket from "../../../sockets";
import { toast } from "react-toastify";

const ChatRoom = ({ setShowProfile }) => {
  const { chat, setChat } = useChat();
  const { user } = useUser();

  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);

    const fileInput = document.getElementById("file-upload-input");
    if (fileInput) fileInput.value = null;
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        // console.log(chat);
        const response = await fetchMessages(chat.id, user.token);
        // console.log(chat);
        console.log("messages: ", response.data);
        setMessages(response.data);
        socket.emit("join_chat", chat.id, user.id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
  }, [chat]);

  useEffect(() => {
    socket.on("receive_message", (newMessage, chat_id) => {
      console.log("received new message", newMessage);
      console.log("chat_id:", chat_id);
      if (chat_id !== chat.id) return;

      if (newMessage.sender_id != user.id) {
        toast.info("New Message");
      }

      if (newMessage.sender_id !== user.id) {
        console.log(
          `user ${user.id} is in the chat and received message ${newMessage.id}`
        );
        socket.emit("read_messages", { chat_id, reader_id: user.id });
      }

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

    socket.on("messages_read", ({ chat_id, reader_id, messages }) => {
      console.log(`messages are read by ${reader_id} in chat ${chat_id}`);

      setMessages((prevMessages) =>
        prevMessages.map((m) => {
          const isNotAlreadySeen = messages.some(
            (msg) => msg.message_id === m.id
          );
          if (isNotAlreadySeen) {
            if (!m.seen_by.includes(reader_id)) {
              m.seen_by.push(reader_id);
            }
          }
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log(replyTo);

    if (!messageInput.trim() && !selectedFile) {
      console.log(selectedFile);
      console.log("message input or file is missing");
      return;
    }

    if (updateMessage) return handleUpdate();

    setIsUploading(true);

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sender_id", user.id);
      formData.append("chat_id", chat.id);
      if (replyTo) formData.append("reply_to", replyTo.id);
      if (messageInput.trim()) formData.append("text", messageInput.trim());

      try {
        const response = await uploadFileMessage(formData, user.token);
        setMessageInput("");
        setReplyTo(null);
        clearFileSelection();
      } catch (err) {
        console.log("error uploading file: ", err);
        toast.error(
          err.response?.data?.message ||
            "File upload failed. Check file type/size."
        );
      } finally {
        setIsUploading(false);
      }
    } else if (messageInput.trim()) {
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
      setIsUploading(false);
    }
  };

  const iconSize = 24;

  const closeReply = () => {
    setIsUploading(false);
    setReplyTo(null);
    console.log(isUploading);
  };

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
            setShowProfile={setShowProfile}
          />
          {filePreview && (
            <div className="file-preview-container">
              <img
                src={filePreview}
                alt="Preview"
                className="file-preview-image"
              />
              <button onClick={clearFileSelection} className="clear-file-btn">
                <FaTimes size={20} className="clear-file-icon" />
              </button>
            </div>
          )}
          {selectedFile && !filePreview && (
            <div className="file-preview-container">
              <p>Selected File: {selectedFile.name}</p>
              <button onClick={clearFileSelection} className="clear-file-btn">
                <FaTimes size={20} className="clear-file-icon" />
              </button>
            </div>
          )}
          {replyTo && (
            <div className="reply-to-message-div">
              {replyTo.file_url ? (
                <div className="message-file-container">
                  {isImageFile(replyTo.file_url, replyTo.file_type) ? (
                    <img
                      src={replyTo.file_url}
                      alt={replyTo.original_filename || "Image"}
                      className="chat-reply-image-file"
                      onClick={() => window.open(replyTo.file_url, "_blank")}
                    />
                  ) : isVideoFile(replyTo.file_url, replyTo.file_type) ? (
                    <video className="chat-reply-video-file">
                      <source
                        src={replyTo.file_url}
                        type={replyTo.file_type || "video/mp4"}
                      />
                      Your browser does not support the video tag.
                      <a
                        href={replyTo.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download video:{" "}
                        {replyTo.original_filename || "video-file"}
                      </a>
                    </video>
                  ) : (
                    <div className="chat-reply-generic-file">
                      <a
                        href={replyTo.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={replyTo.original_filename}
                      >
                        📄 {replyTo.original_filename || "Download File"}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <h4 className="reply-to-message-text m0">{replyTo.text}</h4>
              )}
              <button onClick={closeReply} className="clear-file-btn">
                <FaTimes size={20} className="clear-file-icon" />
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="message-input-div"
          >
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={selectedFile ? "Add a caption..." : "Message..."}
              className="message-field"
              disabled={isUploading}
            />
            <input
              type="file"
              id="file-upload-input"
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept="image/*, video/*, application/pdf"
            />
            <label
              htmlFor="file-upload-input"
              className="message-button file-upload-label"
            >
              <FaPlus className="message-icon" size={iconSize} />
            </label>
            <button className="message-button" type="submit">
              <FiSend
                className="message-icon"
                size={iconSize}
                disabled={isUploading}
              />
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
