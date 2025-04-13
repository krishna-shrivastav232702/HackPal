// components/ui/Button.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "outline" | "ghost";
};

export const Button = ({
    children,
    className,
    onClick,
    size = "md",
    variant = "default",
}: ButtonProps) => {
    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg",
    };

    const variantClasses = {
        default: "bg-purple-600 hover:bg-purple-700 text-white",
        outline: "bg-transparent border hover:bg-purple-500/20",
        ghost: "bg-transparent hover:bg-purple-500/10",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
        >
            {children}
        </button>
    );
};
