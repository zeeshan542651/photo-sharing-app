import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Aperture,
  LogOut,
  User as UserIcon,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-border/50" />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(12,95%,68%)] via-[hsl(264,80%,58%)] to-[hsl(174,72%,45%)] rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative bg-gradient-to-br from-[hsl(12,95%,68%)] via-[hsl(264,80%,58%)] to-[hsl(174,72%,45%)] text-white p-2 rounded-xl group-hover:scale-105 transition-transform">
              <Aperture className="w-5 h-5" />
            </div>
          </div>
          <span className="font-display text-xl font-bold tracking-tight gradient-text">
            ZEE-SHARE
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === "creator" && (
                <Link href="/upload">
                  <Button
                    variant={location === "/upload" ? "default" : "ghost"}
                    className={`gap-2 hidden sm:flex font-medium ${
                      location === "/upload" ? "badge-gradient border-0" : ""
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full relative group"
                    data-testid="button-user-menu"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(12,95%,68%,0.3)] via-[hsl(264,80%,58%,0.3)] to-[hsl(174,72%,45%,0.3)] rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity" />
                    <Avatar className="w-9 h-9 border-2 border-border/50 relative">
                      {user.profilePicture && (
                        <AvatarImage
                          src={user.profilePicture}
                          alt={user.displayName || user.username}
                        />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-[hsl(264,80%,58%)] to-[hsl(174,72%,45%)] text-white font-display font-bold text-sm">
                        {(user.displayName || user.username)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 glass-card border-border/50"
                >
                  <DropdownMenuLabel className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        {user.profilePicture && (
                          <AvatarImage
                            src={user.profilePicture}
                            alt={user.displayName || user.username}
                          />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-[hsl(264,80%,58%)] to-[hsl(174,72%,45%)] text-white font-display font-bold">
                          {(user.displayName || user.username)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold leading-none">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                    <Link href="/profile" className="w-full">
                      <UserIcon className="mr-2 h-4 w-4 text-[hsl(264,80%,58%)]" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "creator" && (
                    <DropdownMenuItem
                      asChild
                      className="sm:hidden cursor-pointer py-2.5"
                    >
                      <Link href="/upload" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4 text-[hsl(174,72%,45%)]" />
                        <span>Create Photo</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive focus:text-destructive cursor-pointer py-2.5"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="badge-gradient border-0 font-medium gap-2">
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
