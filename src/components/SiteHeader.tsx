import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOUNDATION_NAME, LOGO_URL } from "@/lib/brand";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/events", label: "Ongoing Events" },
  { to: "/results", label: "Results" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/rules", label: "Rules" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={LOGO_URL} alt={`${FOUNDATION_NAME} logo`} className="h-11 w-11 object-contain" />
          <span className="font-display max-w-[9rem] text-sm leading-tight font-semibold text-primary sm:max-w-none sm:text-base">
            {FOUNDATION_NAME}
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              activeProps={{ className: "text-primary bg-secondary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {user ? (
            <Button asChild variant="gold" size="sm">
              <Link to="/dashboard">
                <LayoutDashboard /> Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild variant="gold" size="sm">
              <Link to="/auth">Register / Login</Link>
            </Button>
          )}
          <button
            aria-label="Toggle menu"
            className="rounded-md p-2 text-primary lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-card px-4 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}