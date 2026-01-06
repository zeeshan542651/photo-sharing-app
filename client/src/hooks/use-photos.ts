import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertPhoto, type InsertComment, type InsertRating } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function usePhotos(search?: string) {
  return useQuery({
    queryKey: [api.photos.list.path, search],
    queryFn: async () => {
      const url = search 
        ? `${api.photos.list.path}?search=${encodeURIComponent(search)}` 
        : api.photos.list.path;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return api.photos.list.responses[200].parse(await res.json());
    },
  });
}

export function usePhoto(id: number) {
  return useQuery({
    queryKey: [api.photos.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.photos.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch photo");
      return api.photos.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id),
  });
}

export function useCreatePhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: InsertPhoto) => {
      const res = await fetch(api.photos.create.path, {
        method: api.photos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Only creators can upload photos");
        throw new Error("Failed to create photo");
      }
      return api.photos.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.photos.list.path] });
      toast({ title: "Photo published", description: "Your photo is now live on the feed." });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ photoId, data }: { photoId: number, data: InsertComment }) => {
      const url = buildUrl(api.comments.create.path, { photoId });
      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to post comment");
      return api.comments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { photoId }) => {
      queryClient.invalidateQueries({ queryKey: [api.photos.get.path, photoId] });
      toast({ title: "Comment added" });
    },
    onError: () => {
      toast({ title: "Failed to comment", variant: "destructive" });
    },
  });
}

export function useRatePhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ photoId, data }: { photoId: number, data: InsertRating }) => {
      const url = buildUrl(api.ratings.rate.path, { photoId });
      const res = await fetch(url, {
        method: api.ratings.rate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to rate photo");
      return api.ratings.rate.responses[201].parse(await res.json());
    },
    onSuccess: (_, { photoId }) => {
      // Invalidate both photo detail and list to update rating counts everywhere
      queryClient.invalidateQueries({ queryKey: [api.photos.get.path, photoId] });
      queryClient.invalidateQueries({ queryKey: [api.photos.list.path] });
      toast({ title: "Rating saved" });
    },
    onError: () => {
      toast({ title: "Failed to submit rating", variant: "destructive" });
    },
  });
}
