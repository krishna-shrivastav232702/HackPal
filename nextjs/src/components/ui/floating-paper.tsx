"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileText } from "lucide-react"

export function FloatingPaper({ count = 5 }) {
    // Use a flag to determine if we're on the client
    const [isClient, setIsClient] = useState(false)
    const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
    
    useEffect(() => {
        // Mark that we're on the client
        setIsClient(true)
        
        // Update dimensions only on client side
        setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
        })

        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // If we're still server-side, render placeholder divs with no animation
    if (!isClient) {
        return (
            <div className="relative w-full h-full">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="opacity-0">
                        <div className="relative w-16 h-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-purple-400/50" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Only render the animated version on the client
    return (
        <div className="relative w-full h-full">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    initial={{
                        x: Math.random() * dimensions.width,
                        y: Math.random() * dimensions.height,
                    }}
                    animate={{
                        x: [Math.random() * dimensions.width, Math.random() * dimensions.width, Math.random() * dimensions.width],
                        y: [
                            Math.random() * dimensions.height,
                            Math.random() * dimensions.height,
                            Math.random() * dimensions.height,
                        ],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: 20 + Math.random() * 10,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                    }}
                >
                    <div className="relative w-16 h-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center justify-center transform hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8 text-purple-400/50" />
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
