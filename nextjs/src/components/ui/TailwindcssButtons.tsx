"use client";
import React from "react";
import reactElementToJSXString from "react-element-to-jsx-string";
import { toast, Toaster } from "sonner";
import { ButtonsCard } from "../ui/tailwindcss-buttons";

export function TailwindcssButtons() {
    const copy = (button: any) => {
        if (button.code) {
            copyToClipboard(button.code);
            return;
        }
        let buttonString = reactElementToJSXString(button.component);

        if (buttonString) {
            const textToCopy = buttonString;
            copyToClipboard(textToCopy);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                console.log("Text copied to clipboard:", text);
                toast.success("Copied to clipboard");
            })
            .catch((err) => {
                console.error("Error copying text to clipboard:", err);
                toast.error("Error copying to clipboard");
            });
    };
    return (
        <div className="pb-40 px-4 w-full">
            <Toaster position="top-center" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full  max-w-7xl mx-auto gap-10">
                {buttons.map((button, idx) => (
                    <ButtonsCard key={idx} onClick={() => copy(button)}>
                        {button.component}
                    </ButtonsCard>
                ))}
            </div>
        </div>
    );
}
export const buttons = [
    {
        name: "Top Gradient",
        description: "Top Gradient button for your website",
        showDot: false,
        component: (
            <button className="px-8 py-2 rounded-full relative bg-slate-700 text-white text-sm hover:shadow-2xl hover:shadow-white/[0.1] transition duration-200 border border-slate-600">
                <div className="absolute inset-x-0 h-px w-1/2 mx-auto -top-px shadow-2xl  bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
                <span className="relative z-20">Top gradient</span>
            </button>
        ),
    },
];
