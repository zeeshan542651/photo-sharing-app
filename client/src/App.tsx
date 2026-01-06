import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import PhotoDetail from "@/pages/PhotoDetail";
import Upload from "@/pages/Upload";
import AuthPage from "@/pages/Auth";
import Profile from "@/pages/Profile";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Wrapper to handle auth loading state globally if needed
function Main() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      <Route path="/photo/:id" component={PhotoDetail} />
      <Route path="/upload" component={Upload} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Main />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
