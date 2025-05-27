import express from "express";
import {
  getUserByEmail,
  getUserById,
  updateUser,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

import pool from "../db.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { streamifier } from "../utils/streamifier.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fieldSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are supported"), false);
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

const router = express.Router();

router.post("/upload/:id", upload.single("file"), async (req, res) => {
  console.log("uploading image");
  const { id } = req.params;
  console.log("id:", id);
  const io = req.io;

  if (!req.file) return res.status(400).json({ error: "No file found" });
  if (!id) return res.status(400).json({ error: "user id not given" });

  try {
    const cloudinaryUploadOptions = {
      folder: "hashchats",
      resource_type: "image",
      public_id: `${id}_${Date.now()}`,
    };

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      cloudinaryUploadOptions
    );

    const { rows } = await pool.query(
      `UPDATE users SET avatar = $1 WHERE id = $2 RETURNING *`,
      [uploadResult.secure_url, id]
    );

    console.log("rows: ", rows);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Upload failed due to ${err.message}` });
  }
});

router.post("/byemail", protect, getUserByEmail);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);

export default router;
