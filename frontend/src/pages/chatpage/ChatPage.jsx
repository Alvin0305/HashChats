import React, { useEffect, useState } from "react";
import { getUserProfile } from "../../services/authService";
import { useUser } from "../../contexts/userContext";
import ChatList from "./ChatList/ChatList";
import ChatRoom from "./ChatRoom/ChatRoom";

import "./chatpage.css";

const ChatPage = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(user);
    const fetchProfile = async () => {
      try {
        const response = await getUserProfile(user?.token);
        console.log(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="chat-page">
      <div className="chat-page-wrapper">
        <ChatList user={user} />
        <ChatRoom />
      </div>
    </div>
  );
};

export default ChatPage;
