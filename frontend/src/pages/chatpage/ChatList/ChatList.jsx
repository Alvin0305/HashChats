import React, { useEffect, useState } from "react";
import { createChat } from "../../../services/chatService";
import ChatTile from "./ChatTile/ChatTile";

import "./chatlist.css";
import { useChatList } from "../../../contexts/chatlistContext";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchUserByEmail } from "../../../services/userServer";
import { useUser } from "../../../contexts/userContext";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../../services/authService";
import { useTab } from "../../../contexts/tabContext";

const ChatList = ({ user }) => {
  const { chatlist, setChatList } = useChatList();

  const { setUser } = useUser();

  const [showAddChatDialog, setShowAddChatDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetchUserByEmail(email, user.token);
      console.log(response.data);
      // console.log(users[0]);
      // console.log(users[0].members);
      console.log([user.id, response.data.id]);

      if (response.data) {
        // console.log("users: ", users);
        if (response.data.email === user.email) {
          console.log("You cannot chat with yourself");
          toast.error("You cannot chat with yourself");
          onClose();
          return;
        }
        if (
          chatlist.some(
            (u) =>
              ((u.members[0].id === user.id &&
                u.members[1].id === response.data.id) ||
                (u.members[1].id === user.id &&
                  u.members[0].id === response.data.id)) &&
              u.members.length === 2
          )
        ) {
          console.log("you both already have a chat");
          toast.error("You both already have a chat");
          onClose();
          return;
        }
        console.log(isGroup, groupName);
        const createChatRes = await createChat(
          [user.id, response.data.id],
          groupName,
          isGroup,
          user.token
        );
        console.log(createChatRes.data);
        setChatList((prevUsers) => [...prevUsers, createChatRes.data]);
      }
      onClose();
    } catch (err) {
      if (err.response.status === 404) {
        toast.error(`User with Email ${email} not found`);
        onClose();
      }
      console.log(err);
    }
  };

  const onClose = () => {
    setIsGroup(false);
    setShowAddChatDialog(false);
    setEmail("");
  };

  const { currentTab } = useTab();

  useEffect(() => {
    console.log(currentTab);
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div
      className={`chatlist ${
        currentTab === "chat-list"
          ? "show-in-phone-tab"
          : "dont-show-in-phone-tab"
      }`}
    >
      <div className="chatlist-top">
        <h2 className="m0"># CHATS</h2>
      </div>

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
            {isGroup && (
              <input
                type="text"
                value={groupName}
                placeholder="Group Name..."
                onChange={(e) => setGroupName(e.target.value)}
                className="email-input"
              />
            )}
            <div className="is-group-div">
              <label htmlFor="">IS GROUP</label>
              <input
                type="checkbox"
                value={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
                className="add-group-check-box"
              />
            </div>

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
      {chatlist?.map((u, index) => (
        <ChatTile key={index} user={user} chat={u} />
      ))}
      <button
        className="add-chat-button"
        onClick={() => setShowAddChatDialog(true)}
      >
        <FaPlus className="add-chat-icon" size={24} />
      </button>
    </div>
  );
};

export default ChatList;
