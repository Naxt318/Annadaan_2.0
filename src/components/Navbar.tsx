import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Leaf, ChevronDown, Menu, X, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  donor: "bg-amber-100 text-amber-800",
  ngo: "bg-green-100 text-green-800",
  volunteer: "bg-blue-100 text-blue-800",
};

export function Navbar() {
  const { userDoc } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      setLocation("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const roleLinks = {
    donor: [
      { label: "Donate Food", href: "/donor-dashboard" },
      { label: "My Donations", href: "/donor-dashboard" },
    ],
    ngo: [{ label: "Requests", href: "/ngo-dashboard" }],
    volunteer: [{ label: "Deliveries", href: "/volunteer-dashboard" }],
  };

  const links = userDoc ? roleLinks[userDoc.role] || [] : [];
  const initials = userDoc?.name
    ? userDoc.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">ANNADAAN</span>
          </Link>

          {userDoc && (
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link key={link.href + link.label} href={link.href}>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Button>
                </Link>
              ))}
              <Link href="/map">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Map
                </Button>
              </Link>
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {userDoc && <NotificationBell />}
            {userDoc ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="user-menu-trigger"
                    className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                      {initials}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium leading-none">{userDoc.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${roleColors[userDoc.role] || ""}`}>
                        {userDoc.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <div className="px-2 py-1.5 text-sm font-medium text-foreground">{userDoc.name}</div>
                  <div className="px-2 pb-1.5 text-xs text-muted-foreground">{userDoc.email}</div>
                  <DropdownMenuSeparator />
                  <button
                    data-testid="logout-button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            data-testid="mobile-menu-toggle"
            className="md:hidden p-2 rounded-md text-muted-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-4 space-y-2">
          {userDoc && (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {initials}
                </div>
                <div>
                  <p className="font-medium">{userDoc.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${roleColors[userDoc.role] || ""}`}>
                    {userDoc.role}
                  </span>
                </div>
              </div>
              {links.map((link) => (
                <Link key={link.href + link.label} href={link.href} onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">{link.label}</Button>
                </Link>
              ))}
              <Link href="/map" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Map</Button>
              </Link>
              <div className="border-t border-border pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
            </>
          )}
          {!userDoc && (
            <div className="flex flex-col gap-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full">Login</Button>
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
