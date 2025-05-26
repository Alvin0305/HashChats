import React, { useState } from "react";
import { useEffect } from "react";
import { createChat, fetchUserChats } from "../../../services/chatService";
import ChatTile from "./ChatTile/ChatTile";

import "./chatlist.css";
import { useChatList } from "../../../contexts/chatlistContext";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchUserByEmail } from "../../../services/userServer";

const ChatList = ({ user }) => {
  const [users, setUsers] = useState([]);
  const { setChatList } = useChatList();

  useEffect(() => {
    // console.log(user);
    const fetchUserContacted = async () => {
      try {
        const response = await fetchUserChats(user?.token);
        console.log(response.data);
        setUsers(response.data);
        setChatList(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserContacted();
  }, []);

  const [showAddChatDialog, setShowAddChatDialog] = useState(false);
  const [email, setEmail] = useState("");

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetchUserByEmail(email, user.token);
      console.log(response.data);
      console.log(users[0]);

      if (response.data) {
        const createChatRes = await createChat(
          [user.id, response.data.id],
          "",
          false,
          user.token
        );
        console.log(createChatRes.data);
        setUsers((prevUsers) => [...prevUsers, createChatRes.data]);
      }
      onClose();
    } catch (err) {
      if (err.response.status === 404) {
        toast.error(`User with Email ${email} not found`);
        onClose();
      }
      // if ()
      console.log(err);
    }
  };

  const onClose = () => {
    setShowAddChatDialog(false);
    setEmail("");
  };

  return (
    <div className="chatlist">
      {users.map((u, index) => (
        <ChatTile key={index} user={user} chat={u} />
      ))}
      <button
        className="add-chat-button"
        onClick={() => setShowAddChatDialog(true)}
      >
        <FaPlus className="add-chat-icon" size={24} />
      </button>
      {showAddChatDialog && (
        <div className="add-user-dialog">
          <form action="" className="add-user-form">
            <input
              type="text"
              placeholder="Email..."
              className="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="add-user-buttons">
              <button className="add-user-button" onClick={onClose}>
                CANCEL
              </button>
              <button className="add-user-button" onClick={(e) => addUser(e)}>
                ADD
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatList;
