"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface User {
  id: Id<"users">;
  username: string;
  role: string;
  full_name?: string;
  profile_picture?: Id<"_storage">;
  status: string;
  staffProfile?: any;
  firstLoginRequired?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  mounted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Handle initial hydration
  useEffect(() => {
    setMounted(true);
    try {
      const savedUser = localStorage.getItem("studio_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
    }
    setLoading(false);
  }, []);

  const loginMutation = useMutation(api.auth.login);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await loginMutation({ username, password });

      // Update state and localStorage
      setUser(result.user);
      localStorage.setItem("studio_user", JSON.stringify(result.user));

      // Force a small delay to ensure state propagates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect based on role
      if (result.user.role === "super_admin") {
        window.location.href = "/dashboard";
      } else if (result.firstLoginRequired) {
        window.location.href = "/profile";
      } else {
        window.location.href = "/staff-dashboard";
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("studio_user");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "super_admin",
        mounted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
