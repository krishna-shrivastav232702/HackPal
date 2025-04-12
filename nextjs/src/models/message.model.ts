import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sessionId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Session",
            required:true
        },
        role:{
            type:String,
            enum:['user','assistant'],
        },
        content:{
            type:String
        }
    },
    {
        timestamps: true,
    }
);

const Messages = mongoose.models.Session || mongoose.model("Messages", messageSchema);

export default Messages;
