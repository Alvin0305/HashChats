import pool from "../db.js";

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return rows[0];
};

export const createUser = async (username, email, password_hash) => {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3) 
        RETURNING *`,
    [username, email, password_hash]
  );

  return rows[0];
};
