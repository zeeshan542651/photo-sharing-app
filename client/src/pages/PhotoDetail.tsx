import { useRoute } from "wouter";
import { usePhoto, useAddComment, useRatePhoto } from "@/hooks/use-photos";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { UserIdentity } from "@/components/UserIdentity";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Star, Users, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export default function PhotoDetail() {
  const [, params] = useRoute("/photo/:id");
  const id = parseInt(params?.id || "0");
  const { data: photo, isLoading } = usePhoto(id);
  const { user } = useAuth();
  
  const addComment = useAddComment();
  const ratePhoto = useRatePhoto();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Initialize rating from user's existing rating
  useEffect(() => {
    if (photo?.currentUserRating) {
      setRating(photo.currentUserRating);
    }
  }, [photo?.currentUserRating]);

  const commentForm = useForm<z.infer<typeof insertCommentSchema>>({
    resolver: zodResolver(insertCommentSchema),
    defaultValues: { content: "" }
  });

  const onCommentSubmit = (data: z.infer<typeof insertCommentSchema>) => {
    addComment.mutate({ photoId: id, data }, {
      onSuccess: () => commentForm.reset()
    });
  };

  const handleRate = (value: number) => {
    ratePhoto.mutate({ photoId: id, data: { rating: value } });
    setRating(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-2xl font-display">Photo not found</h2>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Gallery
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Image Section - Takes up 2/3 on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-black aspect-auto max-h-[80vh] flex items-center justify-center ring-1 ring-border">
              <img 
                src={photo.url} 
                alt={photo.title} 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-medium text-foreground">{photo.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <UserIdentity 
                    user={photo.creator} 
                    size="sm" 
                    showUsername={true}
                    data-testid="user-identity-photo-creator"
                  />
                  <span>•</span>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {photo.createdAt && format(new Date(photo.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              {photo.averageRating && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-yellow-700 dark:text-yellow-500">{Number(photo.averageRating).toFixed(1)}</span>
                    <span className="text-sm text-yellow-600/70 dark:text-yellow-500/70">({photo.ratingCount})</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{photo.ratingCount} {photo.ratingCount === 1 ? 'rating' : 'ratings'}</span>
                </div>
              )}
            </div>

            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">About this shot</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{photo.caption}</p>
              
              <div className="flex flex-wrap gap-3 mt-4">
                {photo.location && (
                  <Badge variant="secondary" className="px-3 py-1 text-sm font-normal gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {photo.location}
                  </Badge>
                )}
                {photo.peoplePresent && (
                  <Badge variant="outline" className="px-3 py-1 text-sm font-normal gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {photo.peoplePresent}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Interactions */}
          <div className="space-y-8 h-fit lg:sticky lg:top-24">
            {/* Rating Box */}
            <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-lg">Rate this photo</h3>
                {photo.currentUserRating && (
                  <Badge variant="secondary" className="text-xs">
                    Your rating: {photo.currentUserRating}
                  </Badge>
                )}
              </div>
              {user ? (
                <>
                  <div className="flex justify-between items-center px-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className="transition-transform hover:scale-110 focus:outline-none"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRate(star)}
                        disabled={ratePhoto.isPending}
                        data-testid={`button-rate-${star}`}
                      >
                        <Star 
                          className={cn(
                            "w-8 h-8 transition-colors",
                            (hoverRating || rating) >= star 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "fill-transparent text-muted-foreground/30"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {photo.currentUserRating && (
                    <p className="text-xs text-center text-muted-foreground">
                      Click to update your rating
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Log in to rate photos</p>
                  <Link href="/login">
                    <Button size="sm" variant="outline">Log in</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Comments ({photo.comments.length})</h3>
              </div>

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {photo.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                ) : (
                  photo.comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <UserIdentity 
                          user={comment.user} 
                          size="md" 
                          showUsername={true}
                          data-testid={`user-identity-comment-${comment.id}`}
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {comment.createdAt && format(new Date(comment.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-lg ml-10">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              {user ? (
                <div className="pt-4 border-t">
                  <Form {...commentForm}>
                    <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="space-y-3">
                      <FormField
                        control={commentForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Add a thoughtful comment..." 
                                className="resize-none min-h-[80px] bg-background"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={addComment.isPending || !commentForm.formState.isDirty}>
                          {addComment.isPending ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg text-center border border-dashed">
                  <p className="text-sm text-muted-foreground mb-3">Join the conversation</p>
                  <Link href="/login">
                    <Button variant="secondary" size="sm">Log in to Comment</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
