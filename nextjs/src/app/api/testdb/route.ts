import { NextResponse } from "next/server";
import connectToDatabase from "@/db/db";

export async function GET() {
    try {
        await connectToDatabase();
        return NextResponse.json({ message: "Database connected successfully!" });
    } catch (error) {
        console.error("Database connection failed:", error);
        return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
}