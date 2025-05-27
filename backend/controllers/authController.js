import pool from "../db.js";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "../models/userModel.js";
import { generateToken } from "../utils/generateToken.js";

const markAsOnline = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users 
        SET status = 'online'
        WHERE id = $1
        RETURNING *`,
    [userId]
  );

  console.log(rows[0]);
};

export const markAsOffline = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE users 
        SET status = 'offline',
        last_seen_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [id]
    );
    res.json({ message: "Successfully logged out" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  console.log(req.body);

  try {
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ error: "User already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser(username, email, password_hash);

    console.log("user: ", user);
    markAsOnline(user.id);

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    markAsOnline(user.id);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};
