import React from "react";
import { FaUser } from "react-icons/fa";
import { FiHeart, FiLogOut, FiMessageSquare, FiUsers } from "react-icons/fi";
import "./sidebar.css";
import { useUser } from "../../../contexts/userContext";
import { fetchUserChats, fetchUserGroups } from "../../../services/chatService";
import { useChatList } from "../../../contexts/chatlistContext";
import { getFavourites } from "../../../services/favouriteService";
import { useChat } from "../../../contexts/chatContext";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../../services/authService";

const SideBar = ({ setShowProfile }) => {
  const iconSize = 20;

  const { user, setUser } = useUser();
  const { setChatList } = useChatList();
  const { setChat } = useChat();

  const navigate = useNavigate();

  const handleMessageButton = async () => {
    setShowProfile(false);
    try {
      const response = await fetchUserChats(user?.token);
      console.log(response.data);
      setChatList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGroupButton = async () => {
    setShowProfile(false);
    try {
      const response = await fetchUserGroups(user?.token);
      console.log(response.data);
      setChatList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavouriteButton = async () => {
    setShowProfile(false);
    try {
      const response = await getFavourites(user?.id, user?.token);
      console.log(response.data);
      setChatList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileButton = () => {
    setShowProfile(true);
    setChat(null);
  };

  const handleLogout = async () => {
    setUser(null);
    try {
      const response = await logoutUser(user.id, user.token);
      console.log(response.data);
      setChatList([]);
      navigate("/");
    } catch (err) {
      console.log("logout failed", err);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-div">
        <button className="sidebar-button" onClick={handleMessageButton}>
          <FiMessageSquare className="sidebar-icon" size={iconSize} />
        </button>
        <button className="sidebar-button" onClick={handleGroupButton}>
          <FiUsers className="sidebar-icon" size={iconSize} />
        </button>
        <button className="sidebar-button" onClick={handleFavouriteButton}>
          <FiHeart className="sidebar-icon" size={iconSize} />
        </button>
      </div>
      <div className="sidebar-div">
        <button className="sidebar-button" onClick={handleProfileButton}>
          <FaUser className="sidebar-icon" size={iconSize} />
        </button>
        <button className="sidebar-button" onClick={handleLogout}>
          <FiLogOut className="sidebar-icon" size={iconSize} />
        </button>
      </div>
    </div>
  );
};

export default SideBar;
