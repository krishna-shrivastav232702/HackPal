// components/auth/Signup.tsx
"use client"

import React, { FC, useState } from "react";
import { useAuth } from "@/context/AuthProvider"
import { useRouter } from "next/navigation"; 

interface SignupProps {
    onSignupSuccess?: () => void;
}

type UserRole = "user" | "admin";

const Signup: FC<SignupProps> = ({ onSignupSuccess }) => {
    const { signup } = useAuth();
    const [error, setError] = useState<string>("");
    const router = useRouter(); 

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const name = (form.elements.namedItem("name") as HTMLInputElement).value;

    

        try {
            if (!email || !password || !name) {
                setError("All fields are required");
                return;
            }
            await signup(name, email, password);
            if (onSignupSuccess) onSignupSuccess();
            router.push("/"); 
        } catch (error) {
            setError("Signup failed, please try again");
        }
    }
    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-200">
                <h1 className="text-3xl font-extrabold text-center text-gray-800">Create an Account</h1>
                {error && <p className="text-center text-red-500">{error}</p>}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter your name"
                            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="ml-32 w-1/3 text-black font-bold py-3 bg-gray-200 rounded-full hover:scale-95 hover:transition-all duration-300"
                    >
                        Register
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Signup
