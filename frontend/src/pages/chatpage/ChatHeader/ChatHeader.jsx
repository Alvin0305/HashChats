import React, { useEffect, useState } from "react";
import { FaPhone, FaPhoneAlt, FaPhoneSlash, FaVideo } from "react-icons/fa";

import "./chatheader.css";
import VideoCall from "./VideoCall";
import socket from "../../../sockets";
import { fetchUserById } from "../../../services/userServer";
import AudioCall from "./AudioCall";

const ChatHeader = ({ user, chat }) => {
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
    console.log("connected call");
    setShowVideoCall(true);
    setShowDialog(false);
  };

  useEffect(() => {
    socket.on("incoming_call", ({ from }) => {
      console.log("call incoming", from);
      setShowDialog(true);
      setIncomingCallerId(from);
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
    });

    socket.on("end_call", () => {
      console.log("end call request");
      close();
    });
  }, [chat]);

  const close = () => {
    setShowAudioCall(false);
    setShowVideoCall(false);
    setShowDialog(false);
  };

  const onCut = () => {
    socket.emit("call_ended", { from: incomingCallerId, to: user.id });
  };

  return (
    <div className="chat-header">
      <div className="chat-header-img-name-div">
        <img
          src={getAvatar()}
          alt="No internet"
          width={imgWidth}
          className="avatar"
        />
        <h3 className="chat-header-name">{getDisplayName()}</h3>
      </div>
      <div className="chat-header-icons-div">
        <FaPhone className="chat-header-icon" size={iconWidth} onClick={handleAudioCall} />
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
          remoteUserId={
            chat.is_group ? null : chat.members.find((m) => m.id !== user.id).id
          }
          isCaller={!showDialog}
          onClose={onCut}
        />
      )}
    </div>
  );
};

export default ChatHeader;
