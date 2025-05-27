import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  addMemberToChat,
  createChat,
  deleteAllMessagesInChat,
  fetchMediaInChat,
  getPinnedMessage,
  getUserChats,
  getUserGroups,
  removeMemberFromChat,
  updateChat,
} from "../controllers/chatController.js";

const router = express.Router();

router.route("/").post(protect, createChat).get(protect, getUserChats);

router.get("/groups", protect, getUserGroups);
router.get("/pinned/:chat_id", protect, getPinnedMessage);
router.get("/media/:id", protect, fetchMediaInChat);
router.post("/add-member", protect, addMemberToChat);
router.post("/remove-member", protect, removeMemberFromChat);
router.put("/:id", protect, updateChat);
router.delete("/:id", protect, deleteAllMessagesInChat);

export default router;
