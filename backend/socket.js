import pool from "./db.js";

export const configureSockets = (io) => {
  io.on("connection", (socket) => {
    console.log("user connected:", socket.id);

    socket.on("join_chat", (chat_id) => {
      socket.join(`chat_${chat_id}`);
      console.log(`User joined to chat_${chat_id}`);
    });

    socket.on("typing", (chat_id) => {
      console.log("started typing");
      socket.to(`chat_${chat_id}`).emit("typing", chat_id);
    });

    socket.on("stop_typing", (chat_id) => {
      console.log("stopped typing");
      socket.to(`chat_${chat_id}`).emit("stop_typing", chat_id);
    });

    socket.on("send_message", async (messageData) => {
      console.log("sending message", messageData);

      const { chat_id, sender_id, text, file_url, reply_to } = messageData;

      try {
        const { rows } = await pool.query(
          `INSERT INTO 
            messages (chat_id, sender_id, text, file_url, reply_to)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
          [chat_id, sender_id, text || null, file_url || null, reply_to || null]
        );

        const newMessage = rows[0];

        let replyInfo = null;
        if (newMessage.reply_to) {
          const { rows: replyRows } = await pool.query(
            `SELECT * FROM messages WHERE id = $1`,
            [newMessage.reply_to]
          );
          replyInfo = replyRows[0] || null;
        }
        newMessage.reply_info = replyInfo;

        io.to(`chat_${chat_id}`).emit("receive_message", { newMessage });
      } catch (err) {
        console.log(`Failed to send message:`);
        console.log(err);
      }
    });

    socket.on("receive_message", (msg) => {
      console.log("received message", msg);
    });

    socket.on("mark_seen", async ({ chat_id, user_id }) => {
      try {
        await pool.query(
          `
            INSERT INTO message_seen (message_id, user_id, seen_at)
            SELECT id, $1, NOW(),
            FROM messages 
            WHERE chat_id = $2
            AND id NOT IN (
                SELECT message_id FROM message_seen WHERE user_id = $1
            )
            `,
          [user_id, chat_id]
        );

        io.to(`chat_${chat_id}`).emit("messages_seen", { chat_id, user_id });
      } catch (err) {}
    });

    socket.on("update_message", async (message_id, chat_id,  text) => {
      try {
        const { rows } = await pool.query(
          `UPDATE messages 
          SET edited = TRUE,
          text = $1
           WHERE id = $2
           RETURNING *`,
          [text, message_id]
        );
        if (rows.length === 0) {
          console.log("updation failed");
          return;
        }
        console.log("Message updated succesfully");
        io.to(`chat_${chat_id}`).emit("message_updated", rows[0]);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("delete_message", async (message_id, chat_id) => {
      try {
        const { rows } = await pool.query(
          `UPDATE messages SET deleted = TRUE WHERE id = $1`,
          [message_id]
        );
        console.log("Message deleted succesfully");
        io.to(`chat_${chat_id}`).emit("message_deleted", message_id);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("disconnect", () => {
      console.log("user diconnected:", socket.id);
    });
  });
};
