import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/db/db";
import Session from "@/models/session.model";



export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userId, title } = body;
        if (!userId) {
            return NextResponse.json(
                { message: "User id is required" },
                { status: 400 }
            );
        }
        const session = await Session.create({
            userId: userId,
            title: title || 'New Chat',
        });
        return NextResponse.json({ success: true, session }, { status: 201 });
    } catch (error) {
        console.error('Create session error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}