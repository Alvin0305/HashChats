import pool from "../db.js";

export const addToFavourites = async (req, res) => {
  const { user_id, chat_id } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO favourites (user_id, chat_id)
        VALUES ($1, $2)
        RETURNING *`,
      [user_id, chat_id]
    );
    if (!rows.length)
      return res.status(401).json({ error: "Already in favourites" });
    res.json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Insertion failed due to ${err.message}` });
  }
};

export const removeFromFavourites = async (req, res) => {
  const { user_id, chat_id } = req.body;

  try {
    const { rows } = await pool.query(
      `DELETE FROM favourites
        WHERE user_id = $1 AND chat_id = $2
        RETURNING *`,
      [user_id, chat_id]
    );
    if (!rows.length) return res.status(401).json({ error: "Deletion failed" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Insertion failed due to ${err.message}` });
  }
};

export const checkIfChatIsFavourite = async (req, res) => {
  const { user_id, chat_id } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM favourites
        WHERE user_id = $1 AND chat_id = $2`,
      [user_id, chat_id]
    );
    console.log("rows:", rows);
    if (!rows || !rows.length) return res.json({ success: false });
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Check failed due to ${err.message}` });
  }
};

export const getFavouriteChats = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.*, json_agg(u.*) AS members
        FROM chats c
        JOIN chat_members cm ON cm.chat_id = c.id
        JOIN users u ON u.id = cm.user_id
        WHERE c.id IN (
            SELECT chat_id FROM chat_members WHERE user_id = $1
        )
        AND c.id IN (
            SELECT chat_id FROM favourites WHERE user_id = $1
        )
        GROUP BY c.id
        ORDER BY c.created_at DESC`,
      [id]
    );

    console.log("rows:", rows);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: `fetching favourites failed due to ${err.message}` });
  }
};
