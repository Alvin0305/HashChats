import React, { useEffect, useRef, useState } from "react";
import socket from "../../../sockets";
import { FaPhoneSlash, FaVideoSlash, FaVolumeMute } from "react-icons/fa";
import "./videocall.css";
import { useUser } from "../../../contexts/userContext";

const AudioCall = ({ localUserId, remoteUserId, isCaller, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketEventsAttached = useRef(false); // Prevent reattaching

  const { user } = useUser();

  useEffect(() => {
    const iceServers = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const startCall = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: false,
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
            call_type: "audio",
          });
        }
      } catch (err) {
        console.error("Error starting call:", err);
      }
    };

    // Attach socket events once
    if (!socketEventsAttached.current) {
      socketEventsAttached.current = true;

      socket.on("incoming_call", async ({ from, offer }) => {
        if (!peerConnectionRef.current) {
          console.log("peerConnectionRef.current is null");
          return;
        }
        const peer = peerConnectionRef.current;
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("answer_call", {
          callerId: from,
          answer,
          calleeId: user?.id,
          call_type: "audio",
        });
      });

      socket.on("call_answered", async ({ answer }) => {
        if (!peerConnectionRef.current) {
          console.log("peerConnectionRef.current is null");
          return;
        }

        const peer = peerConnectionRef.current;
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice_candidate", ({ candidate }) => {
        if (candidate && peerConnectionRef.current) {
          peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      });

      socket.on("call_ended", () => {
        console.log("call ended here also");
        onClose();
      });
    }

    // Start the call
    startCall();

    return () => {
      // Clean up
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;

      socket.off("incoming_call");
      socket.off("call_answered");
      socket.off("ice_candidate");
      socketEventsAttached.current = false;
    };
  }, [isCaller, localUserId, remoteUserId]);

  const iconSize = 20;

  const toggleAudio = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks();
    if (audioTracks && audioTracks.length > 0) {
      const enabled = !audioTracks[0].enabled;
      audioTracks[0].enabled = enabled;
      setAudioEnabled(enabled);
    }
  };

  const [audioEnabled, setAudioEnabled] = useState(true);

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

export default AudioCall;
