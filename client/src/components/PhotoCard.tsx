import { Link } from "wouter";
import { type Photo, type SafeUser } from "@shared/schema";
import { UserIdentity } from "@/components/UserIdentity";
import { MapPin, Star } from "lucide-react";

interface PhotoCardProps {
  photo: Photo & { 
    creator: SafeUser; 
    averageRating: number | null;
    ratingCount: number;
    currentUserRating?: number | null;
  };
}

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <Link href={`/photo/${photo.id}`}>
      <div className="group glass-card photo-card-glow rounded-2xl overflow-hidden cursor-pointer h-full">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img 
            src={photo.url} 
            alt={photo.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          
          {/* Rating Badge */}
          {photo.averageRating && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-white">{Number(photo.averageRating).toFixed(1)}</span>
              <span className="text-xs text-white/60">({photo.ratingCount})</span>
            </div>
          )}
          
          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-white font-display text-xl font-semibold mb-2 line-clamp-1 drop-shadow-lg">
              {photo.title}
            </h3>
            
            {photo.location && (
              <div className="flex items-center text-white/80 text-sm mb-3">
                <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span className="truncate">{photo.location}</span>
              </div>
            )}
            
            {/* Creator Info */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <UserIdentity 
                user={photo.creator} 
                size="sm" 
                showUsername={true}
                className="text-white [&_span]:text-white [&_.text-muted-foreground]:text-white/60"
                data-testid={`user-identity-photo-${photo.id}`}
              />
            </div>
          </div>
        </div>
        
        {/* Caption Preview */}
        {photo.caption && (
          <div className="p-4 bg-card/50">
            <p className="text-sm text-muted-foreground line-clamp-2">{photo.caption}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
