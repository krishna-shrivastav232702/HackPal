import { NextResponse, NextRequest } from "next/server";
import connectToDatabase from "@/db/db";
import User from "@/models/user.model";

import bcryptjs from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const rebody = await request.json();
        const { username, email, password } = rebody;

        const user = await User.findOne({ email: email });

        if (user) {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 400 }
            );
        }
        const passwordString = String(password);
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(passwordString, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });
        await newUser.save();
        return NextResponse.json({
            message: "Signup successful",
            success: true,
            user: {
                username: newUser.username,
                userId: newUser._id,
                totalPoints: newUser.TotalPoints,
                capturedFlags: newUser.capturedFlags,
                challenge3Attempts: newUser.challenge3Attempts,
            },
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        return NextResponse.json(
            { error: "Database connection failed" },
            { status: 500 }
        );
    }
}