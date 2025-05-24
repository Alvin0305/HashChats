import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  deleteMessage,
  getMessage,
  getMessages,
  pinMessage,
  sendMessage,
  unpinMessage,
  updateMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.get("/message/:message_id", protect, getMessage);
router.get("/:chat_id", protect, getMessages);
router.put("/:id", protect, updateMessage);
router.delete("/:id", protect, deleteMessage);
router.patch("/:id/pin", protect, pinMessage);
router.patch("/:id/unpin", protect, unpinMessage);

export default router;
