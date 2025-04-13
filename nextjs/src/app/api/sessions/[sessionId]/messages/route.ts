// /app/api/sessions/[sessionId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/db';
import Messages from '@/models/message.model';
import Session from '@/models/session.model';
import axios from 'axios';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        await connectToDatabase();
        const { sessionId } = await params;
        const session = await Session.findOne({
            _id: sessionId,
        });
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Session not found' },
                { status: 404 }
            );
        }
        const messages = await Messages.find({ sessionId })
            .sort({ timestamp: 1 })
            .lean();

        return NextResponse.json({ success: true, messages });
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        await connectToDatabase();
        const { sessionId } = await params;

        let content = '';
        let userId = '';
        let pdfFile = null;
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await req.json();
            content = body.message;
            userId = body.userId;
        } else if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            content = formData.get('message') as string;
            userId = formData.get('userId') as string;
            pdfFile = formData.get('pdf') as File | null;
        }
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }
        const session = await Session.findOne({
            _id: sessionId,
            userId: userId,
        });
        console.log("after");
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Session not found' },
                { status: 404 }
            );
        }
        if (!content && !pdfFile) {
            return NextResponse.json(
                { success: false, message: 'Message content is required' },
                { status: 400 }
            );
        }
        // error here ??
        const userMessage = await Messages.create({
            sessionId,
            role: 'user',
            content: content || 'PDF uploaded',
        });
        await Session.findByIdAndUpdate(sessionId, {
            updatedAt: new Date()
        });
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('message', content);

        if (pdfFile) {
            formData.append('pdf', pdfFile);
        }
        const response = await axios.post('http://localhost:5000/api/hackpal', formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        const data = response.data;
        const assistantMessage = await Messages.create({
            sessionId,
            role: 'assistant',
            content: data.response,
        });
        return NextResponse.json({
            success: true,
            messages: [userMessage, assistantMessage],
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}