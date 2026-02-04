"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  DollarSign,
  Receipt,
  Wallet,
  User,
  LogOut,
  Menu,
  Settings,
  CreditCard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const sidebarItems = [
  // Admin Items
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, role: "super_admin" },
  { name: "Staff", href: "/staff", icon: Users, role: "super_admin" },
  { name: "Tasks", href: "/tasks", icon: ClipboardList, role: "super_admin" },
  { name: "Payments", href: "/payments", icon: DollarSign, role: "super_admin" },
  { name: "Expenses", href: "/expenses", icon: Receipt, role: "super_admin" },

  // Staff Items
  { name: "Dashboard", href: "/staff-dashboard", icon: LayoutDashboard, role: "staff" },
  { name: "My Tasks", href: "/staff-tasks", icon: ClipboardList, role: "staff" },
  { name: "Payouts", href: "/payouts", icon: Wallet, role: "staff" },
  { name: "Payment Methods", href: "/payment-methods", icon: CreditCard, role: "staff" },
  { name: "Settings", href: "/profile", icon: Settings, role: "staff" },

  // Shared Items
  { name: "Profile", href: "/profile", icon: User, role: "super_admin" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SidebarContentProps {
  pathname: string;
  filteredItems: typeof sidebarItems;
  user: any;
  mobileMenuClose: () => void;
  logout: () => void;
}

function SidebarContent({ pathname, filteredItems, user, mobileMenuClose, logout }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Icris Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Internal Management System</p>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={mobileMenuClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profile_picture as any} />
            <AvatarFallback>{user?.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role === "super_admin" ? "Admin" : "Staff"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout, loading, mounted } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to login if not authenticated (only after mounted)
  useEffect(() => {
    if (mounted && !loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading, mounted]);

  // Show loading or don't render if not mounted yet
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredItems = sidebarItems.filter((item) => {
    if (isAdmin) {
      return item.role === "super_admin";
    } else {
      return item.role === "staff";
    }
  });

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <SidebarContent
          pathname={pathname}
          filteredItems={filteredItems}
          user={user}
          mobileMenuClose={() => {}}
          logout={logout}
        />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent
              pathname={pathname}
              filteredItems={filteredItems}
              user={user}
              mobileMenuClose={() => setMobileMenuOpen(false)}
              logout={logout}
            />
          </SheetContent>
        </Sheet>
        <h1 className="font-semibold">Icris Studio</h1>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:pt-0 pt-14 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
