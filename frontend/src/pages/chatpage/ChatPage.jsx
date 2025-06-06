import React, { useEffect, useState } from "react";
import { getUserProfile } from "../../services/authService";
import { useUser } from "../../contexts/userContext";
import ChatList from "./ChatList/ChatList";
import ChatRoom from "./ChatRoom/ChatRoom";

import "./chatpage.css";
import socket from "../../sockets";
import ChatDetails from "./ChatDetails/ChatDetails";
import SideBar from "./SideBar/SideBar";
import { useChatList } from "../../contexts/chatlistContext";
import { fetchUserChats } from "../../services/chatService";
import Profile from "./Profile/Profile";

const ChatPage = () => {
  const { user } = useUser();
  const { setChatList } = useChatList();

  const [loading, setLoading] = useState(true);
  const [showChatDetails, setShowChatDetails] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    console.log("User ID:", user?.id);
    if (user?.id) {
      socket.emit("register_user", user.id);
      console.log("Registered user with socket");
    }

    socket.on("incoming-call", (data) => {
      console.log("Incoming call received:", data);
    });

    return () => {
      socket.off("incoming-call");
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const response = await getUserProfile(user?.token);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchUserContacted = async () => {
      try {
        const response = await fetchUserChats(user?.token);
        console.log(response.data);
        setChatList(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserContacted();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="chat-page">
      <div className="chat-page-wrapper">
        <SideBar setShowProfile={setShowProfile} />
        {!showProfile ? <ChatList user={user} /> : <Profile />}
        <ChatRoom setShowChatDetails={setShowChatDetails} />
        {showChatDetails && (
          <ChatDetails setShowChatDetails={setShowChatDetails} />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
