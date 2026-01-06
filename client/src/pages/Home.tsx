import { useState } from "react";
import { usePhotos } from "@/hooks/use-photos";
import { Navbar } from "@/components/Navbar";
import { PhotoCard } from "@/components/PhotoCard";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Sparkles, Camera, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const { data: photos, isLoading, error } = usePhotos(search);

  return (
    <div className="min-h-screen bg-background gradient-mesh flex flex-col relative overflow-hidden">
      {/* Decorative floating blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-[hsl(12,95%,68%,0.15)] to-transparent rounded-full blur-3xl float-animation pointer-events-none" />
      <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-gradient-to-br from-[hsl(264,80%,58%,0.12)] to-transparent rounded-full blur-3xl pointer-events-none" style={{ animationDelay: '-2s' }} />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-[hsl(174,72%,45%,0.1)] to-transparent rounded-full blur-3xl float-animation pointer-events-none" style={{ animationDelay: '-4s' }} />
      
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <section className="mb-16 max-w-3xl mx-auto text-center space-y-8 animate-in pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium text-muted-foreground">
            <Sparkles className="w-4 h-4 text-[hsl(264,80%,58%)]" />
            <span>Discover amazing photography</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1]">
            <span className="text-foreground">Where creativity</span>
            <br />
            <span className="gradient-text">comes alive</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Explore a curated collection of stunning visuals from our creative community. Share your perspective with the world.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto search-glow rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(12,95%,68%,0.2)] via-[hsl(264,80%,58%,0.2)] to-[hsl(174,72%,45%,0.2)] rounded-2xl blur-xl opacity-50" />
            <div className="relative glass-card rounded-2xl overflow-hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                className="pl-12 h-14 bg-transparent border-0 focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
                placeholder="Search photos, locations, creators..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="w-4 h-4 text-[hsl(12,95%,68%)]" />
              <span>{photos?.length || 0} Photos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-[hsl(174,72%,45%)]" />
              <span>Trending today</span>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(12,95%,68%)] via-[hsl(264,80%,58%)] to-[hsl(174,72%,45%)] rounded-full blur-xl opacity-30 animate-pulse" />
              <Loader2 className="relative w-12 h-12 animate-spin text-[hsl(264,80%,58%)]" />
            </div>
            <p className="mt-6 text-muted-foreground font-medium">Loading amazing content...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <div className="glass-card inline-block p-8 rounded-2xl">
              <p className="text-destructive font-medium">Something went wrong. Please try again.</p>
            </div>
          </div>
        ) : photos && photos.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
          >
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                variants={{
                  hidden: { opacity: 0, y: 24, scale: 0.96 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <PhotoCard photo={photo} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24">
            <div className="glass-card inline-block p-12 rounded-3xl">
              <div className="w-20 h-20 bg-gradient-to-br from-[hsl(264,80%,58%,0.2)] to-[hsl(174,72%,45%,0.2)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-[hsl(264,80%,58%)]" />
              </div>
              <h3 className="text-2xl font-display font-semibold mb-3">No photos found</h3>
              <p className="text-muted-foreground max-w-sm">Try adjusting your search or explore our featured collections.</p>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="gradient-text font-display font-semibold">Lumina</span>
            <span className="text-border">|</span>
            <span>Crafted for creators</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
