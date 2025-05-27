import express from "express";
import {
  addToFavourites,
  checkIfChatIsFavourite,
  getFavouriteChats,
  removeFromFavourites,
} from "../controllers/favouritesController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addToFavourites);
router.post("/remove", protect, removeFromFavourites);
router.post("/check", protect, checkIfChatIsFavourite);
router.get("/:id", protect, getFavouriteChats);

export default router;
