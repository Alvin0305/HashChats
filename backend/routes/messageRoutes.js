import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  deleteMessage,
  fetchAllMedia,
  getMessage,
  getMessages,
  markAllMessagesReadByUser,
  markAsRead,
  pinMessage,
  sendMessage,
  unpinMessage,
  updateMessage,
} from "../controllers/messageController.js";

import pool from "../db.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { streamifier } from "../utils/streamifier.js";

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.get("/message/:message_id", protect, getMessage);
router.get("/media/:id", protect, fetchAllMedia);
router.get("/:chat_id", protect, getMessages);
router.put("/:id", protect, updateMessage);
router.delete("/:id", protect, deleteMessage);
router.patch("/:id/pin", protect, pinMessage);
router.patch("/:id/unpin", protect, unpinMessage);
router.patch("/:id/read", protect, markAsRead);
router.post("/mark-read", protect, markAllMessagesReadByUser);

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only image, PDFs and videos are allowed"),
        false
      );
    }
  },
});

const uploadToCloudinary = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

router.post("/upload", upload.single("file"), async (req, res) => {
  const { sender_id, chat_id, reply_to, text } = req.body;
  const io = req.io;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  let resourceType = "auto";
  if (req.file.mimetype.startsWith("image/")) {
    resourceType = "image";
  } else if (req.file.mimetype.startsWith("video/")) {
    resourceType = "video";
  } else if (req.file.mimetype === "application/pdf") {
    resourceType = "raw"; 
  } else {
    resourceType = "raw"; 
  }
  console.log(`Determined resource_type: ${resourceType} for MIME type: ${req.file.mimetype}`);

  if (!sender_id || !chat_id) {
    return res
      .status(400)
      .json({ message: "Sender ID and Chat ID are required" });
  }

  try {
    const cloudinaryUploadOptions = {
      folder: "hashchats",
      resource_type: resourceType,
      // upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      public_id: `${chat_id}_${Date.now()}`,
    };

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      cloudinaryUploadOptions
    );
    const newMessage = {
      sender_id: parseInt(sender_id),
      chat_id: parseInt(chat_id),
      text: text || "",
      file_url: uploadResult.secure_url,
      original_filename: req.file.originalname,
      file_type: req.file.mimetype,
      reply_to: reply_to ? parseInt(reply_to) : null,
      created_at: new Date(),
      seen_by: [],
      edited: false,
      deleted: false,
    };

    const result = await pool.query(
      `INSERT INTO messages (sender_id, chat_id, text, file_url, original_filename, file_type, reply_to, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        newMessage.sender_id,
        newMessage.chat_id,
        newMessage.text,
        newMessage.file_url,
        newMessage.original_filename,
        newMessage.file_type,
        newMessage.reply_to,
        newMessage.created_at,
      ]
    );

    const dbMessage = result.rows[0];
    dbMessage.seen_by = [];
    dbMessage.edited = false;
    dbMessage.deleted = false;

    io.to(`chat_${newMessage.chat_id}`).emit(
      "receive_message",
      dbMessage,
      newMessage.chat_id
    );

    console.log(dbMessage);
    res.status(201).json(dbMessage);
  } catch (err) {
    console.error("Error uploading file or saving message: ", err);

    if (err.message.startsWith("Invalid file type")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error during file upload." });
  }
});

export default router;
