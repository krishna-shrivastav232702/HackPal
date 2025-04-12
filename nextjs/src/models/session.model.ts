import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        title: {
            type: String,
        },
        status: String,
        metadata:{
            hasPdf:Boolean
        }
    },
    {
        timestamps: true,
    }
);

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

export default Session;
