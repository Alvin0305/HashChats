import React, { useEffect, useState } from "react";
import "./message.css";
import { getMessageById } from "../../../../services/messageService";
import socket from "../../../../sockets";

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
}) => {
  const isSent = message.sender_id === user.id;

  const [replydMessage, setReplydMessage] = useState(null);

  useEffect(() => {
    if (!message.reply_to) return;
    const fetchReplyedMessage = async () => {
      try {
        const response = await getMessageById(message.reply_to, user.token);
        console.log(response.data);
        setReplydMessage(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReplyedMessage();
  }, []);

  const getUserName = () => {
    if (isSent) return "You";
    return chat.members.filter((m) => m.id === message.sender_id)[0].username;
  };

  const getUserAvatar = () => {
    return (
      chat.members.filter((m) => m.id === user.id)[0].avatar || "/avatar.webp"
    );
  };

  const getOtherUserAvatar = () => {
    if (chat.is_group) return chat.image;
    return (
      chat.members.filter((m) => m.id === message.sender_id)[0].avatar ||
      "/avatar.webp"
    );
  };

  const handleDelete = () => {
    socket.emit("delete_message", message.id, chat.id);
  };

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
        <div className="message-wrapper">
          <h5 className="deleted-message m0 deleted-tag">THIS MESSAGE IS DELETED</h5>
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
          isSent ? "sent-message-avatar" : ""
        }`}
      />
      <div
        className={`message-wrapper ${
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
          <div className="reply-tag">
            <h5 className="reply-tag-username m0">
              {replydMessage.name === user.username
                ? "YOU"
                : replydMessage.name}
            </h5>
            <h4 className="reply-tag-text m0">{replydMessage.text}</h4>
          </div>
        )}
        <h4 className="message-text m0">{message.text}</h4>
        <div className="message-tags">
          {message.edited && <h5 className="m0 edited-tag">EDITED</h5>}
        </div>
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
          <li
            className="message-context-menu-item"
            onClick={() => setUpdateMessage(message)}
          >
            Edit
          </li>
          <li className="message-context-menu-item" onClick={handleDelete}>
            Delete
          </li>
        </ul>
      )}
    </div>
  );
};

export default Message;

/*
 */
