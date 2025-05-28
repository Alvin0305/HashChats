import React, { useEffect, useRef, useState } from "react";
import socket from "../../../sockets";
import { FaPhoneSlash, FaVideoSlash, FaVolumeMute } from "react-icons/fa";
import "./videocall.css";
import { useUser } from "../../../contexts/userContext";

const VideoCall = ({
  localUserId,
  remoteUserId,
  isCaller,
  receivedOffer,
  onClose,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketEventsAttached = useRef(false);

  const { user } = useUser();

  useEffect(() => {
    const iceServers = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const startCall = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localVideoRef.current.srcObject = localStream;
        localStreamRef.current = localStream;

        const peer = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = peer;

        peer.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice_candidate", {
              to: remoteUserId,
              candidate: event.candidate,
            });
          }
        };

        localStream.getTracks().forEach((track) => {
          peer.addTrack(track, localStream);
        });

        // ✅ Only create an offer if caller
        if (isCaller) {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("call_user", {
            calleeId: remoteUserId,
            from: localUserId,
            offer,
            call_type: "video",
          });
        } else if (receivedOffer) {
          if (!peerConnectionRef.current) {
            console.error(
              "Callee: Peer connection not ready for received offer"
            );
            return;
          }
          const peer = peerConnectionRef.current;
          console.log(
            "Callee: Setting remote description with received offer",
            receivedOffer
          );
          await peer.setRemoteDescription(
            new RTCSessionDescription(receivedOffer)
          );
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          console.log("Callee: emiting answer call to", remoteUserId);

          socket.emit("answer_call", {
            callerId: remoteUserId,
            answer,
            calleeId: localUserId,
            call_type: "video",
          });
        }
      } catch (err) {
        console.error("Error starting call:", err);
      }
    };

    const handleCallAnswered = async ({ answer }) => {
      if (!isCaller || !peerConnectionRef.current) {
        // Only caller processes answer
        if (!isCaller)
          console.log("VideoCall: Callee received call_answered, ignoring.");
        return;
      }
      console.log("VideoCall (Caller): Received call_answered", answer);
      const peer = peerConnectionRef.current;
      if (peer.signalingState !== "have-local-offer") {
        console.warn(
          "VideoCall (Caller): Received answer but signalingState is not 'have-local-offer'. Current state:",
          peer.signalingState
        );
        // Might need to queue the answer if candidates are still being processed, or if order is off.
        // For now, let's assume it should be in this state.
      }
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(
          "VideoCall (Caller): Remote description (answer) set successfully."
        );
      } catch (err) {
        console.error(
          "VideoCall (Caller): Error setting remote description (answer):",
          err
        );
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (candidate && peerConnectionRef.current) {
        try {
          // Ensure remote description is set before adding candidates
          if (!peerConnectionRef.current.remoteDescription) {
            console.warn(
              "VideoCall: Received ICE candidate but remoteDescription is null. Queuing or ignoring.",
              candidate
            );
            // You might need to implement a queue for candidates received too early.
            // For simplicity now, we'll just log and attempt.
            // A robust solution queues candidates and applies them after remoteDescription is set.
          }
          console.log("VideoCall: Adding received ICE candidate", candidate);
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.error(
            "VideoCall: Error adding received ICE candidate:",
            err,
            "Candidate:",
            candidate,
            "Remote Description:",
            peerConnectionRef.current.remoteDescription
          );
        }
      }
    };

    const handleEndCall = () => {
      console.log("VideoCall: Received end_call signal.");
      onClose();
    };

    // Attach socket events once
    if (!socketEventsAttached.current) {
      socketEventsAttached.current = true;

      // REMOVED: socket.on("incoming_call", ...) - This was the problematic one here.

      socket.on("call_answered", handleCallAnswered);
      socket.on("ice_candidate", handleIceCandidate);
      socket.on("end_call", handleEndCall);
    }

    // Start the call
    startCall();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // REMOVED: socket.off("incoming_call");
      socket.off("call_answered", handleCallAnswered);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("end_call", handleEndCall);
      socketEventsAttached.current = false; // Reset for potential remount if component allows
    };
  }, [isCaller, localUserId, remoteUserId, receivedOffer, onClose]);

  const iconSize = 20;

  const toggleAudio = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks();
    if (audioTracks && audioTracks.length > 0) {
      const enabled = !audioTracks[0].enabled;
      audioTracks[0].enabled = enabled;
      setAudioEnabled(enabled);
    }
  };

  const toggleVideo = () => {
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks && videoTracks.length > 0) {
      const enabled = !videoTracks[0].enabled;
      videoTracks[0].enabled = enabled;
      setVideoEnabled(enabled);
    }
  };

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  return (
    <div className="video-call-container">
      <div className="video-call-videos">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="video-local"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="video-remote"
        />
      </div>
      <div className="video-call-buttons-div">
        <button onClick={toggleAudio} className="video-call-button">
          <FaVolumeMute
            className="video-call-icon"
            size={iconSize}
            color={audioEnabled ? "white" : "gray"}
          />
        </button>
        <button onClick={toggleVideo} className="video-call-button">
          <FaVideoSlash
            className="video-call-icon"
            size={iconSize}
            color={videoEnabled ? "white" : "gray"}
          />
        </button>
        <button
          onClick={onClose}
          className="video-call-button video-call-end-button"
        >
          <FaPhoneSlash
            className="video-call-icon"
            size={iconSize}
            color="white"
          />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
