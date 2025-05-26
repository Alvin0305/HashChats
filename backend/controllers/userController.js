import { findUserByEmail, findUserById } from "../models/userModel.js";

export const getUserByEmail = async (req, res) => {
  const { email } = req.body;
  console.log("email:", email);
  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: `fetching user failed due to: ${err.message}` });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  console.log("id:", id);
  try {
    const user = await findUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: `fetching user failed due to: ${err.message}` });
  }
};