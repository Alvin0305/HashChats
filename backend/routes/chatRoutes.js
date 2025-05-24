import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createChat, getPinnedMessage, getUserChats } from "../controllers/chatController.js";

const router = express.Router();

router.route("/").post(protect, createChat).get(protect, getUserChats);

router.get("/pinned/:chat_id", protect, getPinnedMessage);

export default router;