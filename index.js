import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dbConnect from './db/connect.js';
import Conversation from './Conversation.js';
import dotenv from 'dotenv'; dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
   cors: {
      origin: "*",  // Allow all origins
      methods: ["GET", "POST"]  // Allow GET and POST methods
   }
});

io.on('connection', async function (socket) {
   await dbConnect();

   socket.on('start conversation', async ({ senderUUID, receiverUUID, senderName, receiverName }) => {
      let user1UUID, user2UUID;
      if (senderUUID < receiverUUID) {
         user1UUID = senderUUID;
         user2UUID = receiverUUID;
      }
      else {
         user1UUID = receiverUUID
         user2UUID = senderUUID
      }

      const conversationId = `${user1UUID}_${user2UUID}`;
      try {
         let conversation = await Conversation.findById(conversationId);

         if (!conversation) {
            // Create new document and join room
            // await Conversation.create({ _id: conversationId, messages: [] });
            const conversation = new Conversation({ _id: conversationId, messages: [] });
            await conversation.save();

            socket.join(conversationId);
            console.log("New conversation started with ID:", conversationId);
         } else {
            socket.join(conversationId);
            const messages = conversation.messages;
            io.to(conversationId).emit('messages', { messages });
            console.log("User joined existing conversation with ID:", conversationId);
         }
      } catch (error) {
         console.error("Error handling 'start conversation' event:", error);
      }
   });

   socket.on('message sent', async ({ senderUUID, receiverUUID, content }) => {
      let user1UUID, user2UUID;
      if (senderUUID < receiverUUID) {
         user1UUID = senderUUID;
         user2UUID = receiverUUID;
      }
      else {
         user1UUID = receiverUUID
         user2UUID = senderUUID
      }

      const conversationId = `${user1UUID}_${user2UUID}`;
      try {
         let conversation = await Conversation.findById(conversationId);

         if (!conversation) {
            // Create new document, join room, and emit message
            await Conversation.create({ _id: conversationId, messages: [{ senderUUID, content }] });
            conversation = new Conversation({ _id: conversationId, messages: [] });
            await conversation.save();

            socket.join(conversationId);
            io.to(conversationId).emit('message', { senderUUID, content });
            console.log("New message sent in new conversation with ID:", conversationId);
         } else {
            // Add message to existing conversation and emit message
            conversation.messages.push({ senderUUID, content });
            io.to(conversationId).emit('message', { senderUUID, content });
            await conversation.save();
            console.log("New message sent in existing conversation with ID:", conversationId);
         }
      } catch (error) {
         console.error("Error handling 'message sent' event:", error);
      }
   });
});

server.listen(process.env.PORT || 3000);

// io.on('connection', function (socket) {
//   socket.on('start conversation', async ({ senderUUID, receiverUUID, senderName, receiverName }) => {
//     let user1UUID,user2UUID;
//     if (senderUUID<receiverUUID){
//       user1UUID=senderUUID;
//       user2UUID=receiverUUID;
//     }
//     else{
//       user1UUID=receiverUUID
//       user2UUID=senderUUID
//     }

//     const conversationId = `${user1UUID}_${user2UUID}`;
//     try {
//       let conversation = await Conversation.findById(conversationId);

//       if (!conversation) {
//         // Create new document and join room
//         await Conversation.create({ _id: conversationId, senderName, receiverName, messages: [] });
//         socket.join(conversationId);
//         console.log("New conversation started with ID:", conversationId);
//       } else {
//         socket.join(conversationId);
//         const messages = conversation.messages;
//         io.to(conversationId).emit('messages', { messages });
//         console.log("User joined existing conversation with ID:", conversationId);
//       }
//     } catch (error) {
//       console.error("Error handling 'start conversation' event:", error);
//     }
//   }); 

//   socket.on('message sent', async ({ senderUUID, receiverUUID, content }) => {
//     let user1UUID,user2UUID;
//     if (senderUUID<receiverUUID){
//       user1UUID=senderUUID;
//       user2UUID=receiverUUID;
//     }
//     else{
//       user1UUID=receiverUUID
//       user2UUID=senderUUID
//     }

//     const conversationId = `${user1UUID}_${user2UUID}`;
//     try {
//       let conversation = await Conversation.findById(conversationId);

//       if (!conversation) {
//         // Create new document, join room, and emit message
//         conversation = await Conversation.create({ _id: conversationId, messages: [{ senderUUID, content }] });
//         socket.join(conversationId);
//         io.to(conversationId).emit('message', { senderUUID, content });
//         console.log("New message sent in new conversation with ID:", conversationId);
//       } else {
//         // Add message to existing conversation and emit message
//         conversation.messages.push({ senderUUID, content });
//         io.to(conversationId).emit('message', { senderUUID, content });
//         await conversation.save();
//         console.log("New message sent in existing conversation with ID:", conversationId);
//       }
//     } catch (error) {
//       console.error("Error handling 'message sent' event:", error);
//     }
//   });
// });