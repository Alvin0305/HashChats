import React, { useEffect, useState } from "react";
import { useUser } from "../../../contexts/userContext";
import { fetchUserById } from "../../../services/userServer";
import {
  addMemberToChat,
  deleteAllMessagesInChat,
  fetchMediaInChat,
  removeMemberFromChat,
  updateChat,
} from "../../../services/chatService";
import "./chatdetails.css";
import { useChat } from "../../../contexts/chatContext";
import { FaHeart, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { FiHeart, FiTrash } from "react-icons/fi";
import {
  addToFavourites,
  checkIfChatIsFavourite,
  removeFromFavourites,
} from "../../../services/favouriteService";
import { useTab } from "../../../contexts/tabContext";

const ChatDetails = ({ setShowChatDetails }) => {
  const { user: currentUser } = useUser();
  const { chat, setChat } = useChat();

  const [chatMember, setChatMember] = useState(null);
  const [media, setMedia] = useState([]);
  const [description, setDescription] = useState(
    chat?.is_group ? chat?.description : chatMember?.description
  );

  const [name, setName] = useState(
    chat?.is_group ? chat?.name ?? "" : chatMember?.username ?? ""
  );
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    if (!chat) return;
    const otherUser = chat?.members.find((m) => m.id !== currentUser.id);
    console.log("chat: ", chat);
    console.log(otherUser);
    const fetchInitials = async () => {
      try {
        const [userResponse, mediaResponse, favouriteResponse] =
          await Promise.all([
            fetchUserById(otherUser.id, currentUser.token),
            fetchMediaInChat(chat.id, currentUser.token),
            checkIfChatIsFavourite(currentUser.id, chat.id, currentUser.token),
          ]);
        console.log(userResponse.data);
        console.log(mediaResponse.data);
        setChatMember(userResponse.data);
        setMedia(mediaResponse.data);
        setDescription(
          chat.is_group ? chat.description : otherUser?.description
        );
        setName(chat.is_group ? chat.name : otherUser?.username);
        console.log("fav: ", favouriteResponse);
        setIsFavourite(favouriteResponse.data.success);
        const emails = [];
        chat.members.map((member) => emails.push(member.email));
        console.log("emails:", emails);
        setEmails(emails);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitials();
  }, [chat]);

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

  const getMedia = (message) => {
    if (isImageFile(message.file_url, message.file_type)) {
      return (
        <img
          src={message.file_url}
          alt={message.original_filename}
          className="chat-details-page-image"
          key={message.id}
          onClick={() => window.open(message.file_url, "_blank")}
        />
      );
    }

    if (isVideoFile(message.file_url, message.file_type)) {
      return (
        <video
          controls
          src={message.file_url}
          className="chat-details-page-video"
          key={message.id}
          onClick={() => window.open(message.file_url, "_blank")}
        ></video>
      );
    }

    return "";
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      const response = await addMemberToChat(
        chat.id,
        newEmail,
        currentUser.token
      );
      console.log(response.data);
      setEmails((prevEmails) => [...prevEmails, newEmail]);
      setNewEmail("");
    } catch (err) {
      console.error(err);
    }
  };

  const removeMember = async (e, email) => {
    e.preventDefault();

    try {
      console.log("token: ", currentUser.token);
      const response = await removeMemberFromChat(
        chat.id,
        email,
        currentUser.token
      );
      console.log(response.data);
      setEmails(emails.filter((e) => e !== email));
      setNewEmail("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = async (description, name) => {
    try {
      console.log(chat.id, description, name, currentUser.token);
      const response = await updateChat(
        chat.id,
        description,
        name,
        currentUser.token
      );
      console.log(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToFavouritesFunc = async (e) => {
    e.preventDefault();
    console.log("adding to favourites");
    try {
      const response = await addToFavourites(
        currentUser.id,
        chat.id,
        currentUser.token
      );
      console.log(response.data);
      setIsFavourite(true);
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromFavouritesFunc = async (e) => {
    e.preventDefault();
    console.log("removing from favourites");
    try {
      const response = await removeFromFavourites(
        currentUser.id,
        chat.id,
        currentUser.token
      );
      console.log(response.data);
      setIsFavourite(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async (e) => {
    e.preventDefault();

    try {
      const response = await deleteAllMessagesInChat(
        chat?.id,
        currentUser.token
      );
      console.log(response.data);
      setShowChatDetails(false);
      setChat(null);
    } catch (err) {
      console.error(err);
    }
  };

  const { currentTab, setCurrentTab } = useTab();

  if (!chat) return <div>Loading...</div>;

  return (
    <form
      className={`chat-details ${
        currentTab === "chat-details"
          ? "show-in-phone-tab"
          : "dont-show-in-phone-tab"
      }`}
    >
      <div className="chat-details-wrapper">
        <button
          className="chat-details-close-button"
          onClick={(e) => {
            e.preventDefault();
            setShowChatDetails(false);
            setCurrentTab("chat-room")
          }}
        >
          <FaTimes size={24} color="white" />
        </button>
        <img
          src={chat.is_group ? chat.image : chatMember?.avatar}
          alt="Avatar"
          className="chat-details-avatar"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            handleChange(description, e.target.value);
          }}
          className="chat-details-page-field chat-details-page-name"
          disabled={!chat.is_group}
        />
        {chat.is_group ? (
          <div className="group-members">
            <h3 className="chat-details-page-heading">MEMBERS</h3>
            <div className="chat-members">
              {emails.map((email, index) => {
                return (
                  currentUser.email !== email && (
                    <div key={index} className="group-member-div">
                      <FaTimes
                        className="remove-member-icon"
                        onClick={(e) => removeMember(e, email)}
                      />
                      <h4 className="group-member m0">{email}</h4>
                    </div>
                  )
                );
              })}
            </div>

            <div className="chat-details-page-add-member-div">
              <input
                type="text"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="add-member-input"
              />
              <button
                className="add-member-button"
                onClick={(e) => addMember(e)}
              >
                <FaPlus className="add-member-icon" />
              </button>
            </div>
          </div>
        ) : (
          <h4 className="chat-details-page-email m0">{chatMember?.email}</h4>
        )}
        <h3 className="chat-details-page-heading">DESCRIPTION</h3>
        <input
          type="text"
          value={description || ""}
          onChange={(e) => {
            setDescription(e.target.value);
            handleChange(e.target.value, name);
          }}
          disabled={!chat.is_group}
          className="chat-details-page-description chat-details-page-field"
        />
        <h2 className="chat-details-page-heading">MEDIA</h2>
        {media.length === 0 && <h5 className="m0">No media in chat yet</h5>}
        <div className="chat-details-page-media-div">
          {media.map((m) => getMedia(m))}
        </div>
        <div className="chat-details-buttons">
          <button
            className="chat-details-button"
            onClick={
              isFavourite
                ? (e) => removeFromFavouritesFunc(e)
                : (e) => addToFavouritesFunc(e)
            }
          >
            <FiHeart className="chat-details-button-icon" size={20} />{" "}
            {isFavourite ? (
              <h2 className="chat-details-button-text">
                Remove From Favourites
              </h2>
            ) : (
              <h2 className="chat-details-button-text">Add To Favourites</h2>
            )}
          </button>
          <button
            className="chat-details-button"
            onClick={(e) => handleDeleteChat(e)}
          >
            <FiTrash
              className="chat-details-button-icon"
              size={20}
              color="red"
            />{" "}
            <h2 className="chat-details-button-text delete-chat-text">
              Delete Chat
            </h2>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatDetails;
