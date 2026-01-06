import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type SafeUser } from "@shared/schema";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg";

interface UserIdentityProps {
  user: SafeUser | { username: string; displayName?: string | null; profilePicture?: string | null };
  size?: Size;
  showUsername?: boolean;
  avatarOnly?: boolean;
  layout?: "row" | "column";
  className?: string;
  avatarClassName?: string;
  "data-testid"?: string;
}

const sizeConfig = {
  xs: { avatar: "w-5 h-5", text: "text-xs", secondary: "text-[10px]" },
  sm: { avatar: "w-6 h-6", text: "text-sm", secondary: "text-xs" },
  md: { avatar: "w-8 h-8", text: "text-sm", secondary: "text-xs" },
  lg: { avatar: "w-10 h-10", text: "text-base", secondary: "text-sm" },
};

export function UserIdentity({ 
  user, 
  size = "sm", 
  showUsername = true,
  avatarOnly = false,
  layout = "row",
  className,
  avatarClassName,
  "data-testid": testId
}: UserIdentityProps) {
  const config = sizeConfig[size];
  const displayName = user.displayName || user.username;
  const initials = displayName.charAt(0).toUpperCase();

  if (avatarOnly) {
    return (
      <Avatar 
        className={cn(config.avatar, "border", avatarClassName)} 
        data-testid={testId}
      >
        {user.profilePicture && (
          <AvatarImage src={user.profilePicture} alt={displayName} />
        )}
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-2",
        layout === "column" && "flex-col items-start gap-1",
        className
      )}
      data-testid={testId}
    >
      <Avatar className={cn(config.avatar, "border", avatarClassName)}>
        {user.profilePicture && (
          <AvatarImage src={user.profilePicture} alt={displayName} />
        )}
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn("flex flex-col min-w-0")}>
        <span className={cn(config.text, "font-medium text-foreground truncate leading-tight")}>
          {displayName}
        </span>
        {showUsername && (
          <span className={cn(config.secondary, "text-muted-foreground truncate leading-tight")}>
            @{user.username}
          </span>
        )}
      </div>
    </div>
  );
}
