import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/db/db";
import Session from "@/models/session.model";
import Messages from "@/models/message.model";

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
    try {
        await connectToDatabase();
        const { sessionId } = await params;
        const session = await Session.findOne({
            _id: sessionId,
        }).lean();
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Session not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, session });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}


export async function PUT(req: NextRequest, { params }: { params: { sessionId: string } }) {
    try {
        await connectToDatabase();
        const { sessionId } = params;
        const body = await req.json();
        const { userId, title, status } = body;
        const session = await Session.findOneAndUpdate(
            { _id: sessionId, userId: userId },
            {
                title,
                status,
                updatedAt: new Date()
            },
            { new: true }
        );
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Session not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, session });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
