import React, { useEffect, useRef, useState } from "react";
import socket from "../../../sockets";
import { FaPhoneSlash, FaVideoSlash, FaVolumeMute } from "react-icons/fa";
import "./videocall.css";

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
  const iceCandidateQueueRef = useRef([]);

  const logPrefix = isCaller
    ? `[CALLER: ${localUserId}]`
    : `[CALLEE: ${localUserId}]`;

  useEffect(() => {
    console.log(
      `${logPrefix} VideoCall component mounted/updated. isCaller: ${isCaller}, localUserId: ${localUserId}, remoteUserId: ${remoteUserId}, receivedOffer:`,
      receivedOffer ? "Yes" : "No"
    );

    const iceServers = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const initializePeerConnection = () => {
      if (peerConnectionRef.current) {
        console.log(
          `${logPrefix} PeerConnection already exists. Closing existing one.`
        );
        peerConnectionRef.current.close();
      }
      const peer = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = peer;
      console.log(`${logPrefix} New RTCPeerConnection created.`);

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(
            `${logPrefix} Generated ICE candidate, sending to ${remoteUserId}:`,
            event.candidate
          );
          socket.emit("ice_candidate", {
            to: remoteUserId,
            candidate: event.candidate,
            from: localUserId,
          });
        } else {
          console.log(`${logPrefix} All ICE candidates have been sent.`);
        }
      };

      peer.ontrack = (event) => {
        console.log(
          `${logPrefix} Received remote track:`,
          event.track,
          "Streams:",
          event.streams
        );
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log(`${logPrefix} Assigned remote stream to remoteVideoRef.`);
        } else {
          console.warn(
            `${logPrefix} remoteVideoRef or event.streams[0] is not available for ontrack.`
          );
        }
      };

      peer.oniceconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          console.log(
            `${logPrefix} ICE Connection State: ${peerConnectionRef.current.iceConnectionState}`
          );
        }
      };
      peer.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          console.log(
            `${logPrefix} Connection State: ${peerConnectionRef.current.connectionState}`
          );
        }
      };
      peer.onsignalingstatechange = () => {
        if (peerConnectionRef.current) {
          console.log(
            `${logPrefix} Signaling State: ${peerConnectionRef.current.signalingState}`
          );
        }
      };
    };

    const startCallFlow = async () => {
      console.log(`${logPrefix} Starting call flow.`);
      try {
        if (!localUserId || !remoteUserId) {
          console.error(
            `${logPrefix} localUserId or remoteUserId is missing. Aborting call flow. local: ${localUserId}, remote: ${remoteUserId}`
          );
          onClose();
          return;
        }

        initializePeerConnection();
        const peer = peerConnectionRef.current;

        console.log(`${logPrefix} Requesting user media (video & audio).`);
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = localStream;
        console.log(`${logPrefix} Got local stream:`, localStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          console.log(`${logPrefix} Assigned local stream to localVideoRef.`);
        } else {
          console.warn(
            `${logPrefix} localVideoRef is null when trying to set srcObject.`
          );
        }

        localStream.getTracks().forEach((track) => {
          console.log(
            `${logPrefix} Adding local track to peer connection:`,
            track.kind
          );
          peer.addTrack(track, localStream);
        });

        if (isCaller) {
          console.log(`${logPrefix} Is CALLER. Creating offer.`);
          const offer = await peer.createOffer();
          console.log(`${logPrefix} Offer created. Setting local description.`);
          await peer.setLocalDescription(offer);
          console.log(
            `${logPrefix} Local description (offer) set. SignalingState: ${peer.signalingState}. Emitting 'call_user' to ${remoteUserId}.`
          );
          socket.emit("call_user", {
            calleeId: remoteUserId,
            from: localUserId,
            offer: offer,
            call_type: "video",
          });
        } else if (receivedOffer) {
          console.log(
            `${logPrefix} Is CALLEE. Processing received offer from ${remoteUserId}:`,
            receivedOffer
          );
          console.log(
            `${logPrefix} Setting remote description (offer). SignalingState before: ${peer.signalingState}`
          );
          await peer.setRemoteDescription(
            new RTCSessionDescription(receivedOffer)
          );
          console.log(
            `${logPrefix} Remote description (offer) set. SignalingState: ${peer.signalingState}. Creating answer.`
          );
          const answer = await peer.createAnswer();
          console.log(
            `${logPrefix} Answer created. Setting local description (answer).`
          );
          await peer.setLocalDescription(answer);
          console.log(
            `${logPrefix} Local description (answer) set. SignalingState: ${peer.signalingState}. Emitting 'answer_call' to ${remoteUserId}.`
          );
          socket.emit("answer_call", {
            callerId: remoteUserId,
            answer: answer,
            calleeId: localUserId,
            call_type: "video",
          });

          processIceCandidateQueue();
        }
      } catch (err) {
        console.error(`${logPrefix} Error in startCallFlow:`, err);
        onClose();
      }
    };

    const processIceCandidateQueue = () => {
      if (
        peerConnectionRef.current &&
        peerConnectionRef.current.remoteDescription
      ) {
        console.log(
          `${logPrefix} Processing ICE candidate queue. Queue length: ${iceCandidateQueueRef.current.length}`
        );
        while (iceCandidateQueueRef.current.length > 0) {
          const candidate = iceCandidateQueueRef.current.shift();
          console.log(`${logPrefix} Applying queued ICE candidate:`, candidate);
          peerConnectionRef.current
            .addIceCandidate(new RTCIceCandidate(candidate))
            .catch((e) =>
              console.error(
                `${logPrefix} Error adding queued ICE candidate:`,
                e
              )
            );
        }
      } else {
        console.log(
          `${logPrefix} Cannot process ICE queue yet, remoteDescription not set or peer connection not ready.`
        );
      }
    };

    const handleCallAnswered = async ({ answer }) => {
      if (!isCaller) {
        console.log(
          `${logPrefix} Received 'call_answered' but not the caller. Ignoring.`
        );
        return;
      }
      if (!peerConnectionRef.current) {
        console.error(
          `${logPrefix} 'call_answered' received, but peerConnection is null.`
        );
        return;
      }
      console.log(
        `${logPrefix} Received 'call_answered' from ${remoteUserId}:`,
        answer
      );
      const peer = peerConnectionRef.current;
      console.log(
        `${logPrefix} Setting remote description (answer). SignalingState before: ${peer.signalingState}`
      );
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(
          `${logPrefix} Remote description (answer) set successfully. SignalingState: ${peer.signalingState}`
        );

        processIceCandidateQueue();
      } catch (err) {
        console.error(
          `${logPrefix} Error setting remote description (answer):`,
          err
        );
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      if (!peerConnectionRef.current) {
        console.error(
          `${logPrefix} Received 'ice_candidate' from ${from}, but peerConnection is null.`
        );
        return;
      }
      if (candidate) {
        console.log(
          `${logPrefix} Received 'ice_candidate' from ${from || "unknown"}:`,
          candidate
        );
        try {
          if (!peerConnectionRef.current.remoteDescription) {
            console.warn(
              `${logPrefix} Remote description not yet set. Queuing ICE candidate from ${
                from || "unknown"
              }.`
            );
            iceCandidateQueueRef.current.push(candidate);
            return;
          }
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          console.log(
            `${logPrefix} Successfully added received ICE candidate from ${
              from || "unknown"
            }.`
          );
        } catch (err) {
          console.error(
            `${logPrefix} Error adding received ICE candidate from ${
              from || "unknown"
            }:`,
            err,
            "Candidate:",
            candidate
          );
        }
      }
    };

    const handleEndCallSignal = () => {
      console.log(`${logPrefix} Received 'end_call' signal.`);
      onClose();
    };

    console.log(
      `${logPrefix} Attaching socket listeners: call_answered, ice_candidate, end_call`
    );
    socket.on("call_answered", handleCallAnswered);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("end_call", handleEndCallSignal);

    startCallFlow();

    return () => {
      console.log(`${logPrefix} VideoCall component unmounting. Cleaning up.`);
      localStreamRef.current?.getTracks().forEach((track) => {
        console.log(`${logPrefix} Stopping local track:`, track.kind);
        track.stop();
      });
      if (peerConnectionRef.current) {
        console.log(`${logPrefix} Closing RTCPeerConnection.`);
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      iceCandidateQueueRef.current = [];

      console.log(
        `${logPrefix} Detaching socket listeners: call_answered, ice_candidate, end_call`
      );
      socket.off("call_answered", handleCallAnswered);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("end_call", handleEndCallSignal);
    };
  }, [isCaller, localUserId, remoteUserId, receivedOffer, onClose]);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const iconSize = 20;

  const toggleAudio = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
      console.log(
        `${logPrefix} Audio ${track.enabled ? "enabled" : "disabled"}`
      );
    });
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
      console.log(
        `${logPrefix} Video ${track.enabled ? "enabled" : "disabled"}`
      );
    });
  };

  return (
    <div className="video-call-container">
      <div className="video-call-videos">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="video-local"
          onLoadedMetadata={() =>
            console.log(`${logPrefix} Local video metadata loaded.`)
          }
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="video-remote"
          onLoadedMetadata={() =>
            console.log(`${logPrefix} Remote video metadata loaded.`)
          }
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
          onClick={() => {
            console.log(`${logPrefix} Hang up button clicked.`);
            onClose();
          }}
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
