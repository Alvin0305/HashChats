import React, { useEffect, useState } from "react";
import "./message.css";
import { getMessageById } from "../../../../services/messageService";
import socket from "../../../../sockets";
import { copyToClipboard } from "../../../../utls/utils";
import { FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Message = ({
  message,
  user,
  chat,
  replyTo,
  setReplyTo,
  contextMenu,
  setContextMenu,
  setPinnedMessage,
  setUpdateMessage,
  setShowProfile,
}) => {
  const isSent = message.sender_id === user.id;

  const [replydMessage, setReplydMessage] = useState(null);

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

  useEffect(() => {
    if (!message.reply_to) return;
    const fetchReplyedMessage = async () => {
      try {
        const response = await getMessageById(message.reply_to, user.token);
        setReplydMessage(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReplyedMessage();
  }, []);

  const getUserName = () => {
    if (isSent) return "You";
    return chat.members.find((m) => m.id === message.sender_id).username;
  };

  const getUserAvatar = () => {
    return chat.members.find((m) => m.id === user.id)?.avatar || "/avatar.webp";
  };

  const getOtherUserAvatar = () => {
    if (chat.is_group) return chat.image;
    return (
      chat.members.find((m) => m.id === message.sender_id)?.avatar ||
      "/avatar.webp"
    );
  };

  const handleDelete = () => {
    socket.emit("delete_message", message.id, chat.id);
  };

  const handleCopy = () => {
    copyToClipboard(message.text);
  };

  const navigate = useNavigate();

  if (message.deleted) {
    return (
      <div className={`message ${isSent ? "message-sent" : ""}`}>
        <img
          src={isSent ? getUserAvatar() : getOtherUserAvatar()}
          alt="No internet"
          width={20}
          className={`avatar message-avatar ${
            isSent ? "sent-message-avatar" : ""
          }`}
        />
        <div className={`message-wrapper delete-message-wrapper`}>
          <h5 className="deleted-message m0 deleted-tag">
            THIS MESSAGE IS DELETED
          </h5>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`message ${isSent ? "message-sent" : ""}`}
      onDoubleClick={() => {
        if (replyTo && replyTo.id === message.id) setReplyTo(null);
        else setReplyTo(message);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({
          visible: true,
          x: e.pageX,
          y: e.pageY,
          message_id: message.id,
        });
      }}
    >
      <img
        src={isSent ? getUserAvatar() : getOtherUserAvatar()}
        alt="No internet"
        width={20}
        className={`avatar message-avatar ${
          isSent ? "sent-message-avatar" : "receive-message-avatar"
        }`}
        onClick={() => {
          !chat.is_group && setShowProfile(true);
        }}
      />
      <div
        className={`message-wrapper ${
          isSent ? "sent-message-wrapper" : "receive-message-wrapper"
        } ${
          replyTo && replyTo.id === message.id
            ? "selected-for-reply-message"
            : ""
        }`}
      >
        {chat.is_group && (
          <h5
            className={`message-username ${
              isSent ? "sent-message-username" : ""
            }`}
          >
            {getUserName()}
          </h5>
        )}
        {replydMessage && (
          <div className={`reply-tag ${isSent && "sent-reply-tag"}`}>
            <h5 className="reply-tag-username m0">
              {replydMessage.name === user.username
                ? "YOU"
                : replydMessage.name}
            </h5>
            {replydMessage.file_url ? (
              <div className="message-file-container">
                {isImageFile(
                  replydMessage.file_url,
                  replydMessage.file_type
                ) ? (
                  <img
                    src={replydMessage.file_url}
                    alt={replydMessage.original_filename || "Image"}
                    className="chat-reply-image-file"
                    onClick={() =>
                      window.open(replydMessage.file_url, "_blank")
                    }
                  />
                ) : isVideoFile(
                    replydMessage.file_url,
                    replydMessage.file_type
                  ) ? (
                  <video className="chat-reply-video-file">
                    <source
                      src={replydMessage.file_url}
                      type={replydMessage.file_type || "video/mp4"}
                    />
                    Your browser does not support the video tag.
                    <a
                      href={replydMessage.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download video:{" "}
                      {replydMessage.original_filename || "video-file"}
                    </a>
                  </video>
                ) : (
                  <div className="chat-reply-generic-file">
                    <a
                      href={replydMessage.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={replydMessage.original_filename}
                    >
                      📄 {replydMessage.original_filename || "Download File"}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <h4 className="reply-tag-text m0">{replydMessage.text}</h4>
            )}
          </div>
        )}
        {message.file_url ? (
          <div className="message-file-container">
            {isImageFile(message.file_url, message.file_type) ? (
              <img
                src={message.file_url}
                alt={message.original_filename || "Image"}
                className="chat-image-file"
                onClick={() => window.open(message.file_url, "_blank")}
              />
            ) : isVideoFile(message.file_url, message.file_type) ? (
              <video controls className="chat-video-file">
                <source
                  src={message.file_url}
                  type={message.file_type || "video/mp4"}
                />
                Your browser does not support the video tag.
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download video: {message.original_filename || "video-file"}
                </a>
              </video>
            ) : (
              <div className="chat-generic-file">
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={message.original_filename}
                >
                  📄 {message.original_filename || "Download File"}
                </a>
              </div>
            )}
          </div>
        ) : (
          <h4 className="message-text m0">{message.text}</h4>
        )}

        <h6 className="message-time m0">
          {new Date(message.created_at)
            .toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace("am", "AM")
            .replace("pm", "PM")}
        </h6>
        <div className="message-tags">
          {message.sender_id === user.id &&
            message.seen_by.length >= chat.members.length - 1 && <FaCheck />}
          {message.edited && (
            <h5
              id={isSent ? "sent-message-tag" : ""}
              className={`m0 edited-tag ${
                !isSent ? "recieved-message-tag" : "sent-message-tag"
              }`}
            >
              EDITED
            </h5>
          )}
        </div>
      </div>
      {contextMenu.visible && contextMenu.message_id === message.id && (
        <ul
          className="message-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        >
          <li
            className="message-context-menu-item"
            onClick={() => {
              setReplyTo(message);
            }}
          >
            Reply
          </li>
          <li
            className="message-context-menu-item"
            onClick={() => setPinnedMessage(message)}
          >
            Pin
          </li>
          {message.sender_id === user.id && (
            <li
              className="message-context-menu-item"
              onClick={() => setUpdateMessage(message)}
            >
              Edit
            </li>
          )}
          {message.sender_id === user.id && (
            <li className="message-context-menu-item" onClick={handleDelete}>
              Delete
            </li>
          )}
          <li className="message-context-menu-item" onClick={handleCopy}>
            Copy
          </li>
        </ul>
      )}
    </div>
  );
};

export default Message;

/*
 */
