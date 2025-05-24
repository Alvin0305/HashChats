import React, { useState } from "react";
import { useEffect } from "react";
import { fetchUserChats } from "../../../services/chatService";
import ChatTile from "./ChatTile/ChatTile";

import "./chatlist.css";

const ChatList = ({ user }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    console.log(user);
    const fetchUserContacted = async () => {
      try {
        const response = await fetchUserChats(user?.token);
        console.log(response.data);
        setUsers(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserContacted();
  }, []);

  return (
    <div className="chatlist">
      {users.map((u, index) => (
        <ChatTile key={index} user={user} chat={u} />
      ))}
    </div>
  );
};

export default ChatList;
