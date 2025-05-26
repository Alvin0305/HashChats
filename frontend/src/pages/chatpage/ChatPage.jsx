import React, { useEffect, useState } from "react";
import { getUserProfile } from "../../services/authService";
import { useUser } from "../../contexts/userContext";
import ChatList from "./ChatList/ChatList";
import ChatRoom from "./ChatRoom/ChatRoom";

import "./chatpage.css";
import socket from "../../sockets";
import Profile from "./Profile/Profile";

const ChatPage = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    console.log("User ID:", user?.id);
    if (user?.id) {
      socket.emit("register_user", user.id);
      console.log("Registered user with socket");
    }

    // Debugging: Log socket events
    socket.on("incoming-call", (data) => {
      console.log("Incoming call received:", data);
    });

    return () => {
      socket.off("incoming-call");
    };
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getUserProfile(user?.token);
        // console.log(response.data);
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
        <ChatRoom setShowProfile={setShowProfile} />
        {showProfile && <Profile setShowProfile={setShowProfile} />}
      </div>
    </div>
  );
};

export default ChatPage;
