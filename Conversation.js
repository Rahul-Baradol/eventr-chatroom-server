// models/message.ts
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique: true 
  },
  messages: [
    {
      senderUUID: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
    }
  ]
});

export default mongoose.models.messages || mongoose.model("messages", messageSchema);
