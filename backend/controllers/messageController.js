import pool from "../db.js";

export const sendMessage = async (req, res) => {
  const sender_id = req.user.id;
  const { chat_id, text, file_url, reply_to } = req.body;

  if (!chat_id || (!text && !file_url))
    return res
      .status(400)
      .json({ error: "Chat ID and message content is required" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO 
        messages (chat_id, sender_id, text, file_url, reply_to)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
      [chat_id, sender_id, text || null, file_url || null, reply_to || null]
    );

    const message = rows[0];
    const { rows: senderRows } = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [sender_id]
    );

    message.sender = senderRows[0];
    res.status(201).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const getMessage = async (req, res) => {
  const { message_id } = req.params;

  try {
    const { rows } = await pool.query(
      `
        SELECT m.*, u.username AS name FROM messages AS m
        JOIN users AS u ON m.sender_id = u.id
        WHERE m.id = $1`,
      [message_id]
    );

    res.status(200).json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const getMessages = async (req, res) => {
  const { chat_id } = req.params;

  try {
    const { rows } = await pool.query(
      `
            SELECT m.*, u.id AS sender_id, u.avatar, u.username
            FROM messages AS m
            JOIN users AS u ON m.sender_id = u.id
            WHERE m.chat_id = $1
            ORDER BY m.created_at ASC`,
      [chat_id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const updateMessage = async (req, res) => {
  const { id } = req.params;
  let { text } = req.body;
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(`SELECT * FROM messages WHERE id = $1`, [
      id,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Message not found" });
    if (rows[0].sender_id !== userId)
      return res.status(403).json({ error: "You can edit only your messages" });

    const { rows: updated } = await pool.query(
      `UPDATE messages
        SET text = $1
        WHERE id = $2
        RETURNING *`,
      [text, id]
    );

    const updatedMessage = updated[0];

    req.io
      .to(`chat_${updatedMessage.chat_id}`)
      .emit("message_updated", updatedMessage);

    res.json(updatedMessage);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Server error: ${error}` });
  }
};

export const deleteMessage = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(`SELECT * FROM messages WHERE id = $1`, [
      id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: "Message not found" });
    if (rows[0].sender_id !== userId)
      return res
        .status(403)
        .json({ error: "You can only delete your message" });

    await pool.query(`DELETE FROM messages WHERE id = $1`, [id]);

    req.io.to(`chat_${rows[0].chat_id}`).emit("message_deleted", rows[0]);
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const pinMessage = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: current } = await pool.query(
      `SELECT * FROM messages WHERE id = $1`,
      [id]
    );

    // unpinning currently pinned message
    await pool.query(
      `UPDATE messages SET is_pinned = FALSE
        WHERE chat_id = $1`,
      [current[0].chat_id]
    );

    const { rows } = await pool.query(
      `UPDATE messages 
            SET is_pinned = TRUE
            WHERE id = $1
            RETURNING *`,
      [id]
    );

    if (!rows.length)
      return res.status(404).json({ error: "Message not found" });

    res.json({ success: true, message: "Message Pinned" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server Error ${err.message}` });
  }
};

export const unpinMessage = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `UPDATE messages 
              SET is_pinned = FALSE
              WHERE id = $1
              RETURNING *`,
      [id]
    );

    if (!rows.length)
      return res.status(404).json({ error: "Message not found" });

    res.json({ success: true, message: "Message Unpinned" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server Error ${err.message}` });
  }
};
