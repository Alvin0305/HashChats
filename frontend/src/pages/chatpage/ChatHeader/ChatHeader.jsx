import React, { useEffect, useState } from "react";
import {
  FaBackspace,
  FaBackward,
  FaPhone,
  FaPhoneAlt,
  FaPhoneSlash,
  FaVideo,
} from "react-icons/fa";

import "./chatheader.css";
import VideoCall from "./VideoCall";
import socket from "../../../sockets";
import { fetchUserById } from "../../../services/userServer";
import AudioCall from "./AudioCall";
import { FiArrowLeft, FiSkipBack } from "react-icons/fi";
import { useTab } from "../../../contexts/tabContext";

const ChatHeader = ({ user, chat, setShowChatDetails }) => {
  const getDisplayName = () => {
    if (chat.is_group) return chat.name;
    return chat.members.filter((m) => m.username != user.username)[0].username;
  };

  const [incomingCallerId, setIncomingCallerId] = useState(null);
  const [incomingCaller, setIncomingCaller] = useState(null);

  const imgWidth = 40;
  const iconWidth = 24;

  const getAvatar = () => {
    if (chat.is_group) return chat.image;
    return (
      chat.members.filter((m) => m.username != user.username)[0].avatar ||
      "/avatar.webp"
    );
  };

  const getStatus = () => {
    if (chat.is_group) return false;
    return (
      chat.members.filter((m) => m.username != user.username)[0].status ===
      "online"
    );
  };

  const [showDialog, setShowDialog] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  const handleAudioCall = async () => {
    setShowAudioCall(true);
  };

  const handleVideoCall = async () => {
    setShowVideoCall(true);
  };

  const connectCall = () => {
    console.log("connected call", incomingCallType);
    if (incomingCallType === "video") {
      setShowVideoCall(true);
    } else if (incomingCallType === "audio") {
      setShowAudioCall(true);
    }
    setShowDialog(false);
  };

  const [incomingOffer, setIncomingOffer] = useState(null);
  const [incomingCallType, setIncomingCallType] = useState(null);

  useEffect(() => {
    const handleIncomingCall = ({ from, offer, call_type }) => {
      console.log(
        "Chat header: incoming call from",
        from,
        "offer:",
        offer,
        "type:",
        call_type
      );
      setShowDialog(true);
      setIncomingCallerId(from);
      setIncomingOffer(offer);
      setIncomingCallType(call_type);
      const fetchIncomingUserDetails = async () => {
        try {
          const userData = await fetchUserById(from, user.token);
          console.log(userData.data);
          setIncomingCaller(userData.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchIncomingUserDetails();
    };
    socket.on("incoming_call", handleIncomingCall);

    socket.on("end_call", () => {
      console.log("end call request");
      close();
    });
  }, [user?.token]);

  const close = () => {
    setShowAudioCall(false);
    setShowVideoCall(false);
    setShowDialog(false);
  };

  const onCut = () => {
    socket.emit("call_ended", { from: incomingCallerId, to: user.id });
  };

  const { currentTab, setCurrentTab } = useTab();

  if (!user) return <div>Loading...</div>;

  return (
    <div className="chat-header">
      <div className="flex">
        <button
          className={`show-on-phone chat-back-button`}
          onClick={() => setCurrentTab("chat-list")}
        >
          <FiArrowLeft className="chat-back-icon" size={24} />
        </button>
        <div
          className="chat-header-img-name-div"
          onClick={() => {
            setShowChatDetails(true);
            setCurrentTab("chat-details");
          }}
        >
          <img
            src={getAvatar()}
            alt="No internet"
            width={imgWidth}
            className="avatar"
          />
          <h3 className="chat-header-name">{getDisplayName()}</h3>
        </div>
      </div>
      <div className="chat-header-icons-div">
        <FaPhone
          className="chat-header-icon"
          size={iconWidth}
          onClick={handleAudioCall}
        />
        <FaVideo
          className="chat-header-icon"
          size={iconWidth}
          onClick={handleVideoCall}
        />
      </div>
      {showDialog && (
        <div className="call-dialog">
          <div className="call-dialog-caller-div">
            <img
              src={incomingCaller?.avatar || "/avatar.webp"}
              alt="No internet"
              width={50}
              className="avatar"
            />
            <h4 className="m0">
              Incoming Call from{" "}
              {incomingCaller?.username?.toUpperCase() || "None"}
            </h4>
          </div>

          <div className="call-dialog-buttons">
            <button
              onClick={connectCall}
              className="call-dialog-button accept-call-button"
            >
              <FaPhoneAlt size={20} color="green" className="call-icon" />
            </button>
            <button
              className="call-dialog-button reject-call-button"
              onClick={onCut}
            >
              <FaPhoneSlash size={20} color="red" className="call-icon" />
            </button>
          </div>
        </div>
      )}
      {showAudioCall && (
        <AudioCall
          localUserId={user.id}
          remoteUserId={
            chat.is_group ? null : chat.members.find((m) => m.id !== user.id).id
          }
          isCaller={!showDialog}
          onClose={onCut}
        />
      )}
      {showVideoCall && (
        <VideoCall
          localUserId={user.id}
          remoteUserId={incomingCallerId}
          isCaller={false}
          receivedOffer={incomingOffer}
          onClose={onCut}
        />
      )}
    </div>
  );
};

export default ChatHeader;
