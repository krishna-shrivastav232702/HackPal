"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Sidebar,
    SidebarBody,
    SidebarLink
} from "@/components/ui/sidebar";
import {
    MessageCircle,
    PlusCircle,
    Settings,
    User,
    Send,
    LogOut,
    Trash2,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Bot } from "lucide-react";

interface Message {
    _id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface Session {
    _id: string;
    userId: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    preview?: string;
}

export default function ChatPage() {
    const { user } = useAuth();
    const userId = user?.userId;
    console.log(userId);
    const [open, setOpen] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const {logout} = useAuth();

    useEffect(() => {
        fetchSessions();
    }, [userId]);

    useEffect(() => {
        if (activeSession) {
            fetchMessages(activeSession._id);
        }
    }, [activeSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchSessions = async () => {
        try {
            setIsLoadingSessions(true);
            const response = await axios.post('/api/sessions', { userId });
            console.log("response", response);
            if (response.data.success) {
                setSessions(response.data.sessions);

                if (response.data.sessions.length > 0 && !activeSession) {
                    setActiveSession(response.data.sessions[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        try {
            const response = await axios.get(`/api/sessions/${sessionId}/messages`);
            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const createNewSession = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('/api/sessions/newsession', {
                userId,
                title: 'New Chat'
            });

            if (response.data.success) {
                const newSession = response.data.session;
                setSessions(prev => [newSession, ...prev]);
                setActiveSession(newSession);
                setMessages([]);
            }
        } catch (error) {
            console.error("Error creating new session:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || !activeSession || isLoading) return;

        try {
            setIsLoading(true);

            const tempUserMessage = {
                _id: Date.now().toString(),
                sessionId: activeSession._id,
                role: 'user' as const,
                content: input,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, tempUserMessage]);
            setInput(""); 
            const response = await axios.post(`/api/sessions/${activeSession._id}/messages`, {
                message: input,
                userId
            });

            if (response.data.success) {
                setMessages(prev => {
                    const withoutTemp = prev.filter(msg => msg._id !== tempUserMessage._id);
                    return [...withoutTemp, ...response.data.messages];
                });

                if (activeSession.title === 'New Chat' && input.length > 0) {
                    const newTitle = input.length > 30 ? input.substring(0, 30) + '...' : input;
                    updateSessionTitle(activeSession._id, newTitle);
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setInput(input);
            setMessages(prev => prev.filter(msg => msg._id !== Date.now().toString()));
        } finally {
            setIsLoading(false);
        }
    };

    const updateSessionTitle = async (sessionId: string, title: string) => {
        try {
            const response = await axios.put(`/api/sessions/${sessionId}`, {
                userId,
                title,
                status: 'active'
            });

            if (response.data.success) {
                setSessions(prev =>
                    prev.map(session =>
                        session._id === sessionId
                            ? { ...session, title }
                            : session
                    )
                );

                if (activeSession && activeSession._id === sessionId) {
                    setActiveSession(prev => prev ? { ...prev, title } : null);
                }
            }
        } catch (error) {
            console.error("Error updating session title:", error);
        }
    };

    const handleSessionSelect = (sessionId: string) => {
        const selected = sessions.find(s => s._id === sessionId);
        if (selected) {
            setActiveSession(selected);
        }
    };

    const handleLogout = () => {
        logout();
        router.replace('/');
        setTimeout(() => {
            window.location.href = '/';
        }, 100);
    }

    return (
        <div className="flex w-full h-screen overflow-hidden bg-white dark:bg-neutral-900">
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
                        {open ? <Logo /> : <LogoIcon />}
                        <div className="mt-8 flex flex-col gap-2">
                            <SidebarLink
                                link={{
                                    label: "New Chat",
                                    href: "#new",
                                    icon: <PlusCircle className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
                                }}
                                className="px-2"
                                onClick={createNewSession}
                            />

                            {isLoadingSessions ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-neutral-500">
                                    No conversations yet
                                </div>
                            ) : (
                                sessions.map((session) => (
                                    <SidebarLink
                                        key={session._id}
                                        link={{
                                            label: session.title,
                                            href: `#${session._id}`,
                                            icon: <MessageCircle className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
                                        }}
                                        className={cn(
                                            "px-2",
                                            activeSession?._id === session._id && "bg-neutral-200 dark:bg-neutral-700 rounded-md"
                                        )}
                                        onClick={() => handleSessionSelect(session._id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <SidebarLink
                            link={{
                                label: "Logout",
                                href: "#",
                                icon: <LogOut className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
                            }}
                            className="px-2"
                            onClick={handleLogout}
                        />
                        <SidebarLink
                            link={{
                                label: "User Account",
                                href: "#profile",
                                icon: (
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
                                        <User className="h-4 w-4" />
                                    </div>
                                ),
                            }}
                            className="mt-4 px-2"
                        />
                    </div>
                </SidebarBody>
            </Sidebar>

            <div className="flex flex-col flex-1 h-full">
                <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4">
                    <h1 className="text-lg font-medium">
                        {activeSession?.title || "New Chat"}
                    </h1>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-full mb-4">
                                <MessageCircle className="h-6 w-6 text-neutral-500 dark:text-neutral-300" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                            <p className="text-neutral-500 max-w-md">
                                Ask a question or start a conversation with our AI assistant.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message._id}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user"
                                        ? "bg-blue-500 text-white"
                                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap">{message.content}</div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
                    <form onSubmit={sendMessage} className="relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full p-3 pr-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading || !activeSession}
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-3 text-neutral-500 hover:text-blue-500 disabled:text-neutral-300"
                            disabled={isLoading || !input.trim() || !activeSession}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                            <span className="sr-only">Send</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export const Logo = () => {
    return (
        <Link
            href="#"
            className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
        >
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-xl whitespace-pre text-black dark:text-white flex items-center gap-4"
            >
                <Bot className="w-10 h-10 text-purple-500 mt-[-1px]" />
                HackPal
            </motion.span>
        </Link>
    );
};

export const LogoIcon = () => {
    return (
        <Link
            href="#"
            className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
        >
            <Bot className="w-10 h-10 text-purple-500 mt-[-1px]" />
        </Link>
    );
};