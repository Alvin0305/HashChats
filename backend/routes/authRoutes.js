import express from "express";
import { loginUser, markAsOffline, registerUser } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout/:id", protect, markAsOffline);
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

export default router;
