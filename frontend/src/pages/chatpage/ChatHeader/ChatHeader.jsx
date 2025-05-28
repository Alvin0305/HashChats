import React, { useEffect, useState } from "react";
import {
  FaPhoneAlt,
  FaPhoneSlash,
  FaVideo,
  FaPhone, // Added FaPhone back if it was used differently elsewhere, or ensure consistency
} from "react-icons/fa";
import "./chatheader.css";
import VideoCall from "./VideoCall";
import AudioCall from "./AudioCall"; // Assuming you have a similar AudioCall component
import socket from "../../../sockets";
import { fetchUserById } from "../../../services/userServer";
import { FiArrowLeft } from "react-icons/fi";
import { useTab } from "../../../contexts/tabContext";
// import { useUser } from "../../../contexts/userContext"; // Already getting user as prop

const ChatHeader = ({ user, chat, setShowChatDetails }) => {
  // const { user } = useUser(); // User is passed as a prop

  const getDisplayName = () => {
    if (!chat || !chat.members) return "Loading..."; // Guard against null chat/members
    if (chat.is_group) return chat.name;
    const remoteMember = chat.members.find((m) => m.id !== user.id);
    return remoteMember ? remoteMember.username : "User";
  };

  const getAvatar = () => {
    if (!chat || !chat.members) return "/avatar.webp"; // Default avatar
    if (chat.is_group) return chat.image || "/avatar.webp";
    const remoteMember = chat.members.find((m) => m.id !== user.id);
    return (remoteMember && remoteMember.avatar) || "/avatar.webp";
  };

  // State for managing incoming call details
  const [incomingCallerId, setIncomingCallerId] = useState(null);
  const [incomingCallerDetails, setIncomingCallerDetails] = useState(null); // Store fetched user details
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [incomingCallType, setIncomingCallType] = useState(null); // 'video' or 'audio'

  // State for UI visibility
  const [showIncomingCallDialog, setShowIncomingCallDialog] = useState(false);
  const [showAudioCallUI, setShowAudioCallUI] = useState(false);
  const [showVideoCallUI, setShowVideoCallUI] = useState(false);

  // State to differentiate between initiating a call vs. being in an accepted call
  const [isInitiatingCall, setIsInitiatingCall] = useState(false); // True if this user clicked call icon
  const [isActiveCall, setIsActiveCall] = useState(false); // True if a call is ongoing (either initiated or accepted)

  const imgWidth = 40;
  const iconWidth = 24;

  // Helper to get the ID of the remote user in the current chat
  const getRemoteChatMemberId = () => {
    if (!chat || chat.is_group || !chat.members || !user) return null;
    const remoteMember = chat.members.find((m) => m.id !== user.id);
    return remoteMember ? remoteMember.id : null;
  };

  // --- Call Initiation ---
  const initiateAudioCall = () => {
    const remoteId = getRemoteChatMemberId();
    if (!remoteId) {
      console.error(
        "ChatHeader: Cannot initiate audio call, remote user ID not found."
      );
      return;
    }
    console.log(`ChatHeader: Initiating AUDIO call to ${remoteId}`);
    setIncomingCallerId(remoteId); // For AudioCall's remoteUserId prop when initiating
    setIsInitiatingCall(true);
    setIsActiveCall(true);
    setShowAudioCallUI(true);
    // Hide other UIs
    setShowVideoCallUI(false);
    setShowIncomingCallDialog(false);
  };

  const initiateVideoCall = () => {
    const remoteId = getRemoteChatMemberId();
    if (!remoteId) {
      console.error(
        "ChatHeader: Cannot initiate video call, remote user ID not found."
      );
      return;
    }
    console.log(`ChatHeader: Initiating VIDEO call to ${remoteId}`);
    setIncomingCallerId(remoteId); // For VideoCall's remoteUserId prop when initiating
    setIsInitiatingCall(true);
    setIsActiveCall(true);
    setShowVideoCallUI(true);
    // Hide other UIs
    setShowAudioCallUI(false);
    setShowIncomingCallDialog(false);
  };

  // --- Handling Incoming Calls ---
  useEffect(() => {
    if (!socket || !user?.token) return; // Ensure socket and user token are available

    const handleIncomingCall = async ({ from, offer, call_type }) => {
      // Don't show incoming call dialog if already in a call
      if (isActiveCall) {
        console.log(
          `ChatHeader: Received incoming_call from ${from} but already in an active call. Ignoring.`
        );
        // Optionally, send a "busy" signal back
        // socket.emit("user_busy", { to: from, from: user.id });
        return;
      }

      console.log(
        `ChatHeader: Received 'incoming_call'. From: ${from}, Type: ${call_type}, Offer:`,
        offer
      );
      setIncomingCallerId(from);
      setIncomingOffer(offer);
      setIncomingCallType(call_type);
      setShowIncomingCallDialog(true);

      try {
        const userData = await fetchUserById(from, user.token);
        setIncomingCallerDetails(userData.data);
      } catch (err) {
        console.error(
          "ChatHeader: Error fetching incoming caller details:",
          err
        );
        setIncomingCallerDetails({ username: "Unknown User" }); // Fallback
      }
    };

    const handleEndCallSignal = () => {
      console.log(
        "ChatHeader: Received 'end_call' signal. Closing all call UIs."
      );
      resetCallStates();
    };

    console.log(
      "ChatHeader: Attaching socket listeners: incoming_call, end_call"
    );
    socket.on("incoming_call", handleIncomingCall);
    socket.on("end_call", handleEndCallSignal);

    return () => {
      console.log(
        "ChatHeader: Detaching socket listeners: incoming_call, end_call"
      );
      socket.off("incoming_call", handleIncomingCall);
      socket.off("end_call", handleEndCallSignal);
    };
  }, [user?.token, isActiveCall]); // Re-run if user.token or isActiveCall changes

  // --- Accepting or Rejecting Incoming Call ---
  const acceptIncomingCall = () => {
    console.log(
      `ChatHeader: User accepted ${incomingCallType} call from ${incomingCallerId}`
    );
    setIsInitiatingCall(false); // This user is the callee
    setIsActiveCall(true);
    if (incomingCallType === "video") {
      setShowVideoCallUI(true);
    } else if (incomingCallType === "audio") {
      setShowAudioCallUI(true);
    }
    setShowIncomingCallDialog(false);
  };

  const rejectIncomingCall = () => {
    console.log(`ChatHeader: User rejected call from ${incomingCallerId}`);
    if (incomingCallerId && user?.id) {
      socket.emit("call_ended", {
        from: user.id,
        to: incomingCallerId,
        reason: "rejected",
      });
    }
    resetCallStates();
  };

  // --- Ending an Active Call (Hang Up) ---
  const handleHangUp = () => {
    console.log("ChatHeader: Hang up initiated by local user.");
    const partnerId = isInitiatingCall
      ? getRemoteChatMemberId()
      : incomingCallerId;
    if (partnerId && user?.id) {
      socket.emit("call_ended", {
        from: user.id,
        to: partnerId,
        reason: "hanged_up",
      });
    }
    resetCallStates();
  };

  // --- Resetting Call States ---
  const resetCallStates = () => {
    console.log("ChatHeader: Resetting all call-related states.");
    setShowAudioCallUI(false);
    setShowVideoCallUI(false);
    setShowIncomingCallDialog(false);
    setIsInitiatingCall(false);
    setIsActiveCall(false);
    setIncomingCallerId(null);
    setIncomingOffer(null);
    setIncomingCallType(null);
    setIncomingCallerDetails(null);
  };

  const { currentTab, setCurrentTab } = useTab();

  if (!user || !chat) return <div>Loading user/chat...</div>;

  // Determine remote user ID for ongoing calls (either initiated or accepted)
  const activeCallRemoteUserId = isInitiatingCall
    ? getRemoteChatMemberId()
    : incomingCallerId;

  return (
    <div className="chat-header">
      {/* Call UIs are rendered on top and conditionally */}
      {showIncomingCallDialog && (
        <div className="call-dialog">
          {" "}
          {/* Ensure CSS makes this an overlay */}
          <div className="call-dialog-caller-div">
            <img
              src={incomingCallerDetails?.avatar || "/avatar.webp"}
              alt="Caller Avatar"
              width={50}
              className="avatar"
            />
            <h4 className="m0">
              Incoming {incomingCallType} Call from{" "}
              {incomingCallerDetails?.username?.toUpperCase() || "Unknown"}
            </h4>
          </div>
          <div className="call-dialog-buttons">
            <button
              onClick={acceptIncomingCall}
              className="call-dialog-button accept-call-button"
            >
              <FaPhoneAlt size={20} color="green" className="call-icon" />{" "}
              {/* Accept Icon */}
            </button>
            <button
              onClick={rejectIncomingCall}
              className="call-dialog-button reject-call-button"
            >
              <FaPhoneSlash size={20} color="red" className="call-icon" />{" "}
              {/* Reject Icon */}
            </button>
          </div>
        </div>
      )}

      {showAudioCallUI && isActiveCall && (
        <AudioCall
          localUserId={user.id}
          remoteUserId={activeCallRemoteUserId}
          isCaller={isInitiatingCall} // True if this user started the call
          receivedOffer={!isInitiatingCall ? incomingOffer : null} // Pass offer only if callee
          onClose={handleHangUp} // Unified hang-up handler
        />
      )}

      {showVideoCallUI && isActiveCall && (
        <VideoCall
          localUserId={user.id}
          remoteUserId={activeCallRemoteUserId}
          isCaller={isInitiatingCall} // True if this user started the call
          receivedOffer={!isInitiatingCall ? incomingOffer : null} // Pass offer only if callee
          onClose={handleHangUp} // Unified hang-up handler
        />
      )}

      {/* Original Chat Header Content - Rendered underneath call UIs or when no call UI is active */}
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
            if (!isActiveCall) {
              // Prevent opening details if in a call, or manage overlay
              setShowChatDetails(true);
              setCurrentTab("chat-details");
            }
          }}
        >
          <img
            src={getAvatar()}
            alt="Chat Avatar"
            width={imgWidth}
            className="avatar"
          />
          <h3 className="chat-header-name">{getDisplayName()}</h3>
        </div>
      </div>
      {!isActiveCall && ( // Only show call initiation icons if not already in a call
        <div className="chat-header-icons-div">
          <FaPhone
            className="chat-header-icon"
            size={iconWidth}
            onClick={initiateAudioCall}
          />
          <FaVideo
            className="chat-header-icon"
            size={iconWidth}
            onClick={initiateVideoCall}
          />
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
