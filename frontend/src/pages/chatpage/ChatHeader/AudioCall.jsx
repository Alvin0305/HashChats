import React, { useEffect, useRef, useState } from "react";
import socket from "../../../sockets"; // Assuming this is your configured socket instance
import { FaPhoneSlash, FaVolumeMute, FaMicrophoneSlash } from "react-icons/fa"; // Added FaMicrophoneSlash
import "./audiocall.css"; // You might want a separate CSS or reuse videocall.css if styles are similar

const AudioCall = ({
  localUserId,
  remoteUserId,
  isCaller,
  receivedOffer, // This is the offer object if this user is the callee
  onClose,
  // You might want to pass remote user details for display
  // remoteUserDetails, e.g., { username, avatar }
}) => {
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null); // For playing remote audio
  const iceCandidateQueueRef = useRef([]);

  const logPrefix = isCaller
    ? `[AUDIO_CALLER: ${localUserId}]`
    : `[AUDIO_CALLEE: ${localUserId}]`;

  useEffect(() => {
    console.log(
      `${logPrefix} AudioCall component mounted/updated. isCaller: ${isCaller}, localUserId: ${localUserId}, remoteUserId: ${remoteUserId}, receivedOffer:`,
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
      console.log(`${logPrefix} New RTCPeerConnection created for audio call.`);

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
          `${logPrefix} Received remote audio track:`,
          event.track,
          "Streams:",
          event.streams
        );
        if (remoteAudioRef.current && event.streams && event.streams[0]) {
          // Attach the stream to an audio element to play it
          remoteAudioRef.current.srcObject = event.streams[0];
          console.log(
            `${logPrefix} Assigned remote audio stream to remoteAudioRef.`
          );
        } else {
          console.warn(
            `${logPrefix} remoteAudioRef or event.streams[0] is not available for ontrack.`
          );
        }
      };

      // Add state change listeners as in VideoCall for debugging
      peer.oniceconnectionstatechange = () => {
        /* ... console.log ... */
      };
      peer.onconnectionstatechange = () => {
        /* ... console.log ... */
      };
      peer.onsignalingstatechange = () => {
        /* ... console.log ... */
      };
    };

    const startCallFlow = async () => {
      console.log(`${logPrefix} Starting audio call flow.`);
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

        console.log(`${logPrefix} Requesting user media (audio only).`);
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false, // Explicitly false for audio call
        });
        localStreamRef.current = localStream;
        console.log(`${logPrefix} Got local audio stream:`, localStream);

        // No local video element to update for audio-only calls

        localStream.getTracks().forEach((track) => {
          console.log(
            `${logPrefix} Adding local audio track to peer connection:`,
            track.kind
          );
          peer.addTrack(track, localStream);
        });

        if (isCaller) {
          console.log(`${logPrefix} Is CALLER. Creating offer for audio call.`);
          const offer = await peer.createOffer();
          console.log(`${logPrefix} Offer created. Setting local description.`);
          await peer.setLocalDescription(offer);
          console.log(
            `${logPrefix} Local description (offer) set. Emitting 'call_user' to ${remoteUserId}.`
          );
          socket.emit("call_user", {
            calleeId: remoteUserId,
            from: localUserId,
            offer: offer,
            call_type: "audio", // Specify call type
          });
        } else if (receivedOffer) {
          console.log(
            `${logPrefix} Is CALLEE. Processing received audio offer from ${remoteUserId}:`,
            receivedOffer
          );
          await peer.setRemoteDescription(
            new RTCSessionDescription(receivedOffer)
          );
          console.log(
            `${logPrefix} Remote description (offer) set. Creating answer.`
          );
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          console.log(
            `${logPrefix} Local description (answer) set. Emitting 'answer_call' to ${remoteUserId}.`
          );
          socket.emit("answer_call", {
            callerId: remoteUserId,
            answer: answer,
            calleeId: localUserId,
            call_type: "audio", // Specify call type
          });
          processIceCandidateQueue();
        }
      } catch (err) {
        console.error(`${logPrefix} Error in startCallFlow (audio):`, err);
        onClose();
      }
    };

    const processIceCandidateQueue = () => {
      if (
        peerConnectionRef.current &&
        peerConnectionRef.current.remoteDescription
      ) {
        console.log(
          `${logPrefix} Processing ICE candidate queue. Length: ${iceCandidateQueueRef.current.length}`
        );
        while (iceCandidateQueueRef.current.length > 0) {
          const candidate = iceCandidateQueueRef.current.shift();
          peerConnectionRef.current
            .addIceCandidate(new RTCIceCandidate(candidate))
            .catch((e) =>
              console.error(
                `${logPrefix} Error adding queued ICE candidate:`,
                e
              )
            );
        }
      }
    };

    // --- Socket Event Handlers ---
    const handleCallAnswered = async ({ answer }) => {
      if (!isCaller) return;
      if (!peerConnectionRef.current) return;
      console.log(`${logPrefix} Received 'call_answered' (audio):`, answer);
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log(
          `${logPrefix} Remote description (answer) set successfully.`
        );
        processIceCandidateQueue();
      } catch (err) {
        console.error(`${logPrefix} Error setting remote desc (answer):`, err);
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      if (!peerConnectionRef.current) return;
      if (candidate) {
        console.log(
          `${logPrefix} Received 'ice_candidate' (audio) from ${
            from || "unknown"
          }:`,
          candidate
        );
        try {
          if (!peerConnectionRef.current.remoteDescription) {
            iceCandidateQueueRef.current.push(candidate);
            return;
          }
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.error(`${logPrefix} Error adding ICE candidate:`, err);
        }
      }
    };

    const handleEndCallSignal = () => {
      console.log(`${logPrefix} Received 'end_call' signal (audio).`);
      onClose();
    };

    console.log(
      `${logPrefix} Attaching socket listeners (audio): call_answered, ice_candidate, end_call`
    );
    socket.on("call_answered", handleCallAnswered);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("end_call", handleEndCallSignal);

    startCallFlow();

    return () => {
      console.log(`${logPrefix} AudioCall unmounting. Cleaning up.`);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      iceCandidateQueueRef.current = [];
      socket.off("call_answered", handleCallAnswered);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("end_call", handleEndCallSignal);
    };
  }, [isCaller, localUserId, remoteUserId, receivedOffer, onClose]);

  // UI State
  const [micEnabled, setMicEnabled] = useState(true);
  // const [speakerEnabled, setSpeakerEnabled] = useState(true); // For remote audio mute/unmute
  const iconSize = 20;

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
      console.log(
        `${logPrefix} Microphone ${track.enabled ? "enabled" : "disabled"}`
      );
    });
  };

  // Optional: Toggle remote speaker (mutes the <audio> element)
  // const toggleSpeaker = () => {
  //   if (remoteAudioRef.current) {
  //     remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
  //     setSpeakerEnabled(!remoteAudioRef.current.muted);
  //     console.log(`${logPrefix} Remote audio speaker ${!remoteAudioRef.current.muted ? "enabled" : "disabled"}`);
  //   }
  // };

  return (
    <div className="audio-call-container">
      {" "}
      {/* Use a different class or style videocall.css accordingly */}
      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <div className="audio-call-info">
        {/* You can display info about the call here, e.g., remote user's name/avatar */}
        {/* <img src={remoteUserDetails?.avatar || '/default-avatar.png'} alt="Remote User" /> */}
        {/* <h4>Calling {remoteUserDetails?.username || remoteUserId}</h4> */}
        <p>Audio Call in Progress...</p>
        <p>
          {isCaller ? `Calling ${remoteUserId}` : `Call from ${remoteUserId}`}
        </p>
      </div>
      <div className="audio-call-buttons-div">
        {" "}
        {/* Reuse or create new styles */}
        <button onClick={toggleMic} className="audio-call-button">
          <FaMicrophoneSlash // Or FaMicrophone if you want to show current state
            className="audio-call-icon"
            size={iconSize}
            color={micEnabled ? "white" : "gray"}
          />
        </button>
        {/* Optional Speaker Mute Button 
        <button onClick={toggleSpeaker} className="audio-call-button">
          <FaVolumeMute
            className="audio-call-icon"
            size={iconSize}
            color={speakerEnabled ? "white" : "gray"}
          />
        </button>
        */}
        <button
          onClick={() => {
            console.log(`${logPrefix} Hang up button clicked (audio).`);
            onClose();
          }}
          className="audio-call-button audio-call-end-button"
        >
          <FaPhoneSlash
            className="audio-call-icon"
            size={iconSize}
            color="white"
          />
        </button>
      </div>
    </div>
  );
};

export default AudioCall;
