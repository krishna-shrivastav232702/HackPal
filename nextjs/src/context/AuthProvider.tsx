"use client";
import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type User = {
    userId?: string;
    username?: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    useEffect(() => {
        const checkUserLoggedIn = async () => {
            try {
                const userId = localStorage.getItem("userId");
                if (userId) {
                    
                    setUser({
                        userId: userId,
                    });
                }
            } catch (error) {
                console.error("Error checking authentication status:", error);
            } finally {
                setLoading(false);
            }
        };
    
        checkUserLoggedIn();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { data } = await axios.post("/api/users/login", {
                email,
                password,
            });

            localStorage.setItem("userId", data.user.userId);

            setUser({
                userId: data.user.userId,
                username: data.user.username,
            });

            toast.success("Login successful");
        } catch (error: any) {
            setError(error.response?.data?.message || "Login Failed");
            toast.error("Login Failed");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (username: string, email: string, password: string) => {
        try {
            setLoading(true);
            const response = await axios.post("/api/users/signup", {
                username,
                email,
                password,
            });

            if (response.data.user.userId) {
                localStorage.setItem("userId", response.data.user.userId);
            }
            toast.success("Signup successful");
        } catch (error: any) {
            setError(error.response?.data?.message || "Signup Failed");
            toast.error("Signup Failed");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("userId");
        setUser(null);
        toast.success("Logged out successfully");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                signup,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}