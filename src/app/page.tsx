"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading, mounted, isAdmin } = useAuth();

  useEffect(() => {
    if (mounted && !loading) {
      if (isAuthenticated) {
        window.location.href = isAdmin ? "/dashboard" : "/staff-dashboard";
      } else {
        window.location.href = "/login";
      }
    }
  }, [isAuthenticated, loading, mounted, isAdmin]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
