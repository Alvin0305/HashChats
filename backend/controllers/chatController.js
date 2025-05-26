import pool from "../db.js";

export const createChat = async (req, res) => {
  const created_by = req.user.id;
  const { userIds, name, is_group } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0)
    return res.status(400).json({ error: "User list required" });

  try {
    const { rows: chatRows } = await pool.query(
      `INSERT INTO chats (name, is_group, created_by)
        VALUES ($1, $2, $3) 
        RETURNING *`,
      [name, is_group, created_by]
    );
    const chat_id = chatRows[0].id;

    const allUserIds = [...new Set([Number(created_by), ...userIds])];
    const values = allUserIds.map((id, i) => `($1, $${i + 2})`).join(",");
    console.log(values);

    await pool.query(
      `INSERT INTO chat_members (chat_id, user_id)
        VALUES ${values}`,
      [chat_id, ...allUserIds]
    );

    const { rows: output } = await pool.query(
      `
      SELECT c.*, json_agg(u.*) AS members
      FROM chats c
      JOIN chat_members cm ON cm.chat_id = c.id
      JOIN users u ON u.id = cm.user_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [chat_id]
    );
    console.log(output);

    res.status(201).json(output[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server error ${err.message}` });
  }
};

export const getUserChats = async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `
            SELECT c.*, json_agg(u.*) AS members
            FROM chats c
            JOIN chat_members cm ON cm.chat_id = c.id
            JOIN users u ON u.id = cm.user_id
            WHERE c.id IN (
                SELECT chat_id FROM chat_members WHERE user_id = $1
            )
            GROUP BY c.id
            ORDER BY c.created_at DESC
            `,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const getPinnedMessage = async (req, res) => {
  const { chat_id } = req.params;

  try {
    const { rows } = await pool.query(
      `
        SELECT * FROM messages 
        WHERE chat_id = $1
        AND is_pinned = TRUE
        `,
      [chat_id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const fetchMediaInChat = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM messages
      WHERE chat_id = $1
      AND file_url IS NOT NULL
      ORDER BY created_at DESC`,
      [id]
    );

    console.log(rows);
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: `fetching media failed due to ${err.message}` });
  }
};
