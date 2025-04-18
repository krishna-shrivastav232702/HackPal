"use client"

import { motion } from "framer-motion"
import { FileText, Sparkles } from "lucide-react"
import { RoboAnimation } from "./robo-animation"
import { FloatingPaper } from "./floating-paper"
import { Button } from "./Button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthProvider"
import { useState } from "react"
import LoginModal from "../auth/LoginModal"

export default function Hero() {
    const router = useRouter();
    const {user} = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const handleClick = () =>{
        if (user) {
            router.push("/chat");
        } else {
            setIsLoginOpen(true);
        }
    }
    return (
        <div className="relative min-h-[calc(100vh-76px)] flex items-center">
            <div className="absolute inset-0 overflow-hidden">
                <FloatingPaper count={6} />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                            Supercharge Your Hackathon Game with
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                                {" "}
                                AI
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
                    >
                        Get instant summaries, idea generation, code debugging & more—just upload a PDF and let the magic happen.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button onClick={handleClick} size="lg" variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20 flex items-center">
                            <Sparkles className="mr-2 h-5 w-5" />
                            Get Started
                        </Button>
                    </motion.div>
                </div>
            </div>

            <div className="absolute bottom-0 right-0 w-96 h-96">
                <RoboAnimation />
            </div>
            {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
        </div>
    )
}
