import connectToDatabase from "@/db/db";
import User from "@/models/user.model";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const rebody = await request.json();
        const { email, password } = rebody;

        const user = await User.findOne({ email });
        `         `;
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 400 });
        }

        const validpassword = await bcrypt.compare(String(password), user.password);

        if (!validpassword) {
            return NextResponse.json({ error: "Invalid password" }, { status: 400 });
        }


        const response = NextResponse.json({
            message: "Login successful",
            success: true,
            user: {
                username: user.username,
                userId: user._id,
                totalPoints: user.TotalPoints,
                capturedFlags: user.capturedFlags,
                challenge3Attempts: user.challenge3Attempts,
            },
        });

        return response;
    } catch (error: any) {
        console.error("Database connection failed:", error);
        return NextResponse.json(
            { error: "Database connection failed" },
            { status: 500 }
        );
    }
}