import express from "express";
import { getUserByEmail, getUserById } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/byemail", protect, getUserByEmail);
router.get("/:id", protect, getUserById);

export default router;
