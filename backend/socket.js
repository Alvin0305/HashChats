import pool from "./db.js";

const connectedUsers = new Map();

export const configureSockets = (io) => {
  io.on("connection", (socket) => {
    console.log("user connected:", socket.id);

    socket.on("register_user", (userId) => {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    // ------- chat socket connections ------------

    socket.on("join_chat", async (chat_id, user_id) => {
      socket.join(`chat_${chat_id}`);
      console.log(`User ${user_id} joined to chat_${chat_id}`);

      try {
        console.log("trying to mark messages on joining chat");

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
              RETURNING *
          `,
          [chat_id, user_id]
        );
        console.log(`marked messages:`);
        rows.forEach((row) => {
          console.log(row);
        });
        io.to(`chat_${chat_id}`).emit("messages_read", {
          chat_id,
          reader_id: user_id,
          messages: rows,
        });
      } catch (err) {
        console.log("marking messages read on joining error");
        console.log(err);
      }
    });

    socket.on("read_messages", async ({ chat_id, reader_id }) => {
      console.log(
        `socket received read messages from ${reader_id} in ${chat_id}`
      );

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
              RETURNING *
          `,
          [chat_id, reader_id]
        );

        console.log("messages being marked read: ");
        rows.forEach((row) => {
          console.log(row);
        });

        io.to(`chat_${chat_id}`).emit("messages_read", {
          chat_id,
          reader_id,
          messages: rows,
        });
      } catch (err) {
        console.log("marking message failed");
        console.log(err);
      }
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
      const { chat_id, sender_id, text, file_url, reply_to } = messageData;

      console.log("sending message", messageData, chat_id);

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

        newMessage.seen_by = [];

        io.to(`chat_${chat_id}`).emit("receive_message", newMessage, chat_id);
      } catch (err) {
        console.log(`Failed to send message:`);
        console.log(err);
      }
    });

    socket.on("receive_message", (msg) => {
      console.log("received message", msg);
    });

    socket.on("update_message", async (message_id, chat_id, text) => {
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

      for (const [userId, id] of connectedUsers.entries()) {
        if (id === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });

    // ------- call socket connections -----------

    // In socket.js, inside 'call_user' handler
    socket.on("call_user", ({ calleeId, offer, from, call_type }) => {
      console.log(
        `[SERVER] Received 'call_user'. To calleeId: ${calleeId}, From: ${from}, Type: ${call_type}`
      );
      const calleeSocketId = connectedUsers.get(calleeId);
      console.log(
        `[SERVER] Looked up calleeSocketId for ${calleeId}: ${calleeSocketId}`
      );
      console.log(
        "[SERVER] Current connectedUsers map:",
        JSON.stringify(Array.from(connectedUsers.entries()))
      );

      if (calleeSocketId) {
        console.log(
          `[SERVER] Emitting 'incoming_call' to calleeSocketId: ${calleeSocketId}. From: ${from}, Type: ${call_type}`
        );
        io.to(calleeSocketId).emit("incoming_call", { from, offer, call_type });
      } else {
        console.log(
          `[SERVER] CalleeId ${calleeId} not found in connectedUsers. Cannot route 'incoming_call'.`
        );
      }
    });

    // Optional: Add 'from' to ice_candidate emit for easier client-side debugging if needed
    socket.on("ice_candidate", ({ to, candidate, from }) => {
      // Expect 'from' if client sends it
      console.log(
        `[SERVER] Received 'ice_candidate'. To: ${to}, From: ${
          from || "unknown"
        }.`
      );
      const targetSocketId = connectedUsers.get(to);
      if (targetSocketId) {
        console.log(
          `[SERVER] Emitting 'ice_candidate' to targetSocketId: ${targetSocketId}. Candidate from: ${
            from || "unknown"
          }`
        );
        // Forward 'from' if you want the client to know who the candidate came from, though usually not strictly needed
        // as the client already knows its remote peer.
        io.to(targetSocketId).emit("ice_candidate", { candidate, from });
      } else {
        console.log(
          `[SERVER] TargetId ${to} for 'ice_candidate' not found in connectedUsers.`
        );
      }
    });

    socket.on(
      "answer_call",
      async ({ callerId, answer, calleeId, call_type }) => {
        console.log("answered the call");
        const callerSocketId = connectedUsers.get(callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call_answered", { answer });
        }

        try {
          const { rows: existingCalls } = await pool.query(
            `SELECT * FROM calls 
             WHERE caller_id = $1 AND callee_id = $2 
             AND call_type = $3 
             AND end_time IS NULL`,
            [callerId, calleeId, call_type]
          );

          if (existingCalls.length === 0) {
            const { rows } = await pool.query(
              `INSERT INTO calls (caller_id, callee_id, call_type)
               VALUES ($1, $2, $3)
               RETURNING *`,
              [callerId, calleeId, call_type]
            );
            console.log("Call logged:", rows[0]);
          }
        } catch (err) {
          console.log(err);
        }
      }
    );

    socket.on("call_ended", async ({ from, to }) => {
      console.log("call ended");
      const targetSocketId = connectedUsers.get(to);
      const callerSocketId = connectedUsers.get(from);
      console.log(targetSocketId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("end_call");
      }

      console.log(callerSocketId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("end_call");
      }

      try {
        await pool.query(
          `UPDATE calls 
           SET end_time = NOW() 
           WHERE caller_id = $1 AND callee_id = $2 AND end_time IS NULL`,
          [from, to]
        );
      } catch (err) {
        console.log("Failed to update call end time", err);
      }
    });
  });
};
