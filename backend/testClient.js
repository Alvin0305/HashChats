import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to server", socket.id);

  socket.emit("join_chat", 4);
  socket.emit("typing", 4);

  setTimeout(() => {
    socket.emit("stop_typing", 4);
  }, 3000);

  socket.emit("send_message", {
    chat_id: 4,
    sender_id: 2,
    text: "Hello",
  });

  socket.emit("stop_typing", 4);
});

socket.on("receive_message", (msg) => {
  console.log("received message", msg);
});

socket.on("disconnect", () => {
  console.log("disconnect from server", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("connection error: ", err);
});
