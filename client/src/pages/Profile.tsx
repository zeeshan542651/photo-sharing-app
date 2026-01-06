import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePhotos } from "@/hooks/use-photos";
import { Navbar } from "@/components/Navbar";
import { PhotoCard } from "@/components/PhotoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, Camera, Settings, Grid3X3, Heart, MessageCircle, 
  Star, MapPin, Calendar, Plus, Edit2, Image as ImageIcon
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { format } from "date-fns";
import { motion } from "framer-motion";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50),
  bio: z.string().max(200).optional(),
});

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: photos, isLoading: photosLoading } = usePhotos();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { uploadFile, isUploading: isUploadingPhoto } = useUpload();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || user.username || "",
        bio: user.bio || "",
      });
    }
  }, [user, form]);

  const updateProfile = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema> & { profilePicture?: string }) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profile updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const response = await uploadFile(file);
    if (response) {
      updateProfile.mutate({ 
        displayName: form.getValues("displayName") || user?.username || "",
        bio: form.getValues("bio"),
        profilePicture: `/api${response.objectPath}`
      });
    }
  };

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfile.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const userPhotos = photos?.filter((p) => p.userId === user.id) || [];
  const initials = (user.displayName || user.username).slice(0, 2).toUpperCase();
  const isCreator = user.role === "creator";

  const totalRatings = userPhotos.reduce((acc, p) => acc + (p.averageRating ? 1 : 0), 0);
  const avgRating = totalRatings > 0 
    ? (userPhotos.reduce((acc, p) => acc + (parseFloat(String(p.averageRating)) || 0), 0) / totalRatings).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <section className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
            <div className="relative group shrink-0">
              <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-background ring-2 ring-border">
                <AvatarImage 
                  src={user.profilePicture || undefined} 
                  alt={user.displayName || user.username} 
                />
                <AvatarFallback className="text-4xl font-display bg-gradient-to-br from-primary/20 to-accent/20">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                {isUploadingPhoto ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                  disabled={isUploadingPhoto}
                  data-testid="input-profile-picture"
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex flex-col sm:items-start items-center">
                  <h1 className="text-2xl font-display font-medium" data-testid="text-display-name">
                    {user.displayName || user.username}
                  </h1>
                  <span className="text-sm text-muted-foreground" data-testid="text-username">
                    @{user.username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize" data-testid="text-user-role">
                    {user.role}
                  </Badge>
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-edit-profile">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                          <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-display-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    value={field.value || ""} 
                                    placeholder="Tell us about yourself..."
                                    className="resize-none min-h-[100px]"
                                    data-testid="input-bio"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-2 pt-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => setIsEditDialogOpen(false)}
                              data-testid="button-cancel-edit"
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={updateProfile.isPending} data-testid="button-save-profile">
                              {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Save Changes
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-6 text-sm">
                {isCreator && (
                  <>
                    <div className="text-center">
                      <span className="font-bold text-lg block" data-testid="stat-photos">{userPhotos.length}</span>
                      <span className="text-muted-foreground">Photos</span>
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-lg block flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {avgRating}
                      </span>
                      <span className="text-muted-foreground">Avg Rating</span>
                    </div>
                  </>
                )}
                <div className="text-center">
                  <span className="font-bold text-lg block flex items-center justify-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {user.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : "N/A"}
                  </span>
                  <span className="text-muted-foreground">Joined</span>
                </div>
              </div>

              {user.bio && (
                <p className="text-muted-foreground max-w-md" data-testid="text-bio">
                  {user.bio}
                </p>
              )}

              {isCreator && (
                <Button onClick={() => setLocation("/upload")} className="gap-2" data-testid="button-upload-photo">
                  <Plus className="w-4 h-4" />
                  Upload Photo
                </Button>
              )}
            </div>
          </section>

          <Separator />

          {isCreator ? (
            <section>
              <Tabs defaultValue="photos" className="w-full">
                <TabsList className="w-full justify-center">
                  <TabsTrigger value="photos" className="gap-2" data-testid="tab-photos">
                    <Grid3X3 className="w-4 h-4" />
                    Photos
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="photos" className="mt-6">
                  {photosLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : userPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                      {userPhotos.map((photo, index) => (
                        <motion.div
                          key={photo.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link href={`/photo/${photo.id}`}>
                            <div className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm">
                              <img 
                                src={photo.url} 
                                alt={photo.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                data-testid={`img-photo-${photo.id}`}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                                <div className="flex items-center gap-1 text-white font-medium">
                                  <Star className="w-5 h-5 fill-white" />
                                  {photo.averageRating ? parseFloat(String(photo.averageRating)).toFixed(1) : "N/A"}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No photos yet</h3>
                      <p className="text-muted-foreground mb-6">Share your first photo with the community</p>
                      <Button onClick={() => setLocation("/upload")} data-testid="button-first-upload">
                        <Camera className="w-4 h-4 mr-2" />
                        Upload Your First Photo
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          ) : (
            <section className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-display font-medium mb-2">Welcome, {user.displayName || user.username}!</h3>
                <p className="text-muted-foreground mb-6">
                  Explore amazing photos from our creative community. Rate your favorites and join the conversation!
                </p>
                <Button onClick={() => setLocation("/")} size="lg" data-testid="button-browse-photos">
                  Discover Photos
                </Button>
              </div>
            </section>
          )}
        </motion.div>
      </main>
    </div>
  );
}
