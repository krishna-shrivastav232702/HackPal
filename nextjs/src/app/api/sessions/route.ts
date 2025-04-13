import { NextRequest,NextResponse } from "next/server";
import connectToDatabase from "@/db/db";
import Session from "@/models/session.model";
import Messages from "@/models/message.model";
import User from "@/models/user.model";


export async function POST(req:NextRequest){
    try {
        await connectToDatabase();
        const body = await req.json();
        const {userId} = body;
        if(!userId){
            return NextResponse.json(
                { message: "User id is required" },
                { status: 400 }
            );
        }
        const user = await User.findById(userId);
        if(!user){
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }
        const sessions = await Session.find({userId:user._id}).sort({updatedAt:-1}).lean();
        const sessionData = await Promise.all(
            sessions.map(async (session)=>{
                const firstMessage = await Messages.findOne({
                    sessionId:session._id,
                    role:'user'
                }).sort({timestamp:1}).limit(1).lean();
                const preview = firstMessage && 'content' in firstMessage ? firstMessage.content.substring(0,100) : '';
                return {
                    ...session,
                    preview,
                };
            })
        );
        return NextResponse.json({success:true,sessions:sessionData});
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}