import pool from "../db.js";

export const getUnreadMessagesInChatByUser = async (chat_id, user_id) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT * FROM messages AS m
        WHERE m.chat_id = $1
        AND m.deleted = False
        AND NOT EXISTS (
            SELECT 1 FROM message_seen ms
            WHERE ms.message_id = m.id 
            AND ms.user_id = $2
        )
        ORDER BY m.created_at ASC`,
      [chat_id, user_id]
    );

    rows.forEach((row) => {
      console.log(row);
    });
    return rows;
  } catch (err) {
    console.log(`fetching messages failed due to ${err}`);
  }
};

export const markUnreadMessagesInChatByUser = async (chat_id, user_id) => {
  try {
    const { rows } = await pool.query(
      `
    INSERT INTO message_seen (message_id, user_id)
    SELECT m.id, $2 
    FROM messages AS m
        WHERE m.chat_id = $1
        AND m.sender_id != $2
        AND m.deleted = FALSE
        AND NOT EXISTS (
            SELECT 1 FROM message_seen ms
            WHERE ms.message_id = m.id 
            AND ms.user_id = $2
        )
        ORDER BY m.created_at ASC
        RETURNING *`,
      [chat_id, user_id]
    );

    console.log("marked read: ");
    rows.forEach((row) => {
      console.log(row);
    });
    console.log("rows", rows);
    return rows;
  } catch (err) {
    console.log(`marking messages failed due to ${err}`);
  }
};
