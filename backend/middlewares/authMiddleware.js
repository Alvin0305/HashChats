import jwt from "jsonwebtoken";
import pool from "../db.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    req.user = rows[0];
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Not authorized, token failed" });
  }
};
