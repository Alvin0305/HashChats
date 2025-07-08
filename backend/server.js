import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import favouritesRoutes from "./routes/favouritesRoutes.js";

import pool from "./db.js";
import { configureSockets } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// middle wares
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// file upload
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use("/upload", express.static(path.join(__dirname, "uploads")));

// socket.io
configureSockets(io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/user", userRoutes);
app.use("/api/favourites", favouritesRoutes);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

/*
API_SECRET=FPhX3r_MGxpW439s3oqyxqaMI3Q
API_KEY=228197764699448
CLOUDINARY_URL=cloudinary://228197764699448:FPhX3r_MGxpW439s3oqyxqaMI3Q@duki8udfb
UPLOAD_PRESET_NAME=hashchat_files
ASSET_FOLDER=hashchats
*/
