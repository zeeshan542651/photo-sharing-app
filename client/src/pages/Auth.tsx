import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, insertUserSchema } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Camera } from "lucide-react";
import { useLocation } from "wouter";

// Extend schema for login
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const { login, register, isLoginPending, isRegisterPending, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  });

  const registerForm = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "", role: "consumer" }
  });

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    login(data);
  };

  const onRegister = (data: z.infer<typeof insertUserSchema>) => {
    register(data);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Visual Side */}
      <div className="hidden md:flex flex-col justify-center items-center bg-zinc-900 text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Unsplash image: abstract architecture */}
          <img 
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2000&auto=format&fit=crop" 
            alt="Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md border border-white/20">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold">Join the Community</h1>
          <p className="text-lg text-zinc-300">
            Discover breathtaking photography and connect with creators from around the world.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md border-none shadow-none md:shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-display">Welcome to Lumina</CardTitle>
            <CardDescription>
              Enter your details to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoginPending}>
                      {isLoginPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Note: Registration defaults to 'consumer' role. Creator accounts are special/admin created or manually changed in DB for this MVP */}
                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                      Note: New accounts are created as Consumers. Only Creators can upload photos.
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isRegisterPending}>
                      {isRegisterPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6 mt-2">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our Terms of Service.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
