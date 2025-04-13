"use client"

import { Bot, Menu } from "lucide-react"
import { Button } from "./Button"
import { motion } from "framer-motion"
import Link from "next/link"
import type React from "react"
import LoginModal from "../auth/LoginModal"
import SignupModal from "../auth/SignupModal"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthProvider"

export default function Navbar() {
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isSignupOpen, setIsSignupOpen] = useState(false)
    const { user,logout } = useAuth();
    const router = useRouter(); 
    const handleLogout = () => {
        logout();
        router.push("/"); 
    }
    
    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-white/10"
            >
                <Link href="/" className="flex items-center space-x-2">
                    <Bot className="w-8 h-8 text-purple-500" />
                    <span className="text-white font-medium text-xl">HackPal</span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    <NavLink href="/features">Features</NavLink>
                    <NavLink href="/how-it-works">How it Works</NavLink>
                    <NavLink href="/pricing">Pricing</NavLink>
                </div>

                <div className="md:flex items-center space-x-4">
                    {
                        user ?
                            <Button size="md" className="bg-purple-600 hover:bg-purple-700 text-white" variant="outline" onClick={handleLogout}>
                                Logout
                            </Button>
                            :
                            <div className="flex gap-4 ">
                                <Button size="md" className="bg-purple-600 hover:bg-purple-700 text-white" variant="outline" onClick={() => setIsLoginOpen(true)}>
                                    Login
                                </Button>
                                <Button size="md" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsSignupOpen(true)}>
                                    Sign up
                                </Button>
                            </div>
                    }
                </div>

                <Button variant="ghost" size="lg" className="md:hidden text-white">
                    <Menu className="w-6 h-6" />
                </Button>
            </motion.nav>
            {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
            {isSignupOpen && <SignupModal onClose={() => setIsSignupOpen(false)} />}
        </>
    )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="text-gray-300 hover:text-white transition-colors relative group">
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
        </Link>
    )
}
