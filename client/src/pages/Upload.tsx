import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePhoto } from "@/hooks/use-photos";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPhotoSchema } from "@shared/schema";
import { z } from "zod";
import {
  Loader2,
  Image as ImageIcon,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useUpload } from "@/hooks/use-upload";

export default function Upload() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createPhoto = useCreatePhoto();
  const { uploadFile, isUploading, progress } = useUpload();
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "creator") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof insertPhotoSchema>>({
    resolver: zodResolver(insertPhotoSchema),
    defaultValues: {
      title: "",
      url: "",
      caption: "",
      location: "",
      peoplePresent: "",
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const response = await uploadFile(file);
    if (response) {
      const imageUrl = `${response.objectPath}`;
      setUploadedUrl(imageUrl);
      form.setValue("url", imageUrl);
    }
  };

  const clearUpload = () => {
    setUploadedUrl(null);
    setPreviewUrl(null);
    form.setValue("url", "");
  };

  const onSubmit = (data: z.infer<typeof insertPhotoSchema>) => {
    createPhoto.mutate(data);
  };

  if (!user || user.role !== "creator") return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-display">
                Upload a new photo
              </CardTitle>
              <CardDescription>
                Share your latest masterpiece with the community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo</FormLabel>
                        <FormControl>
                          {!uploadedUrl && !previewUrl ? (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {isUploading ? (
                                  <>
                                    <Loader2 className="w-10 h-10 mb-3 text-muted-foreground animate-spin" />
                                    <p className="text-sm text-muted-foreground">
                                      Uploading... {progress}%
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <UploadIcon className="w-10 h-10 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                      <span className="font-semibold">
                                        Click to upload
                                      </span>{" "}
                                      or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      PNG, JPG, GIF up to 10MB
                                    </p>
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                                data-testid="input-photo-file"
                              />
                            </label>
                          ) : (
                            <div className="relative">
                              <input type="hidden" {...field} />
                            </div>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(previewUrl || uploadedUrl) && (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/5 border">
                      <img
                        src={previewUrl || uploadedUrl || ""}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearUpload}
                        data-testid="button-clear-upload"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Give your photo a name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="caption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caption</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell the story behind this photo..."
                            className="resize-none min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Paris, France"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="peoplePresent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>People (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Who is in this photo?"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setLocation("/")}
                      disabled={createPhoto.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPhoto.isPending}
                      className="min-w-[120px]"
                    >
                      {createPhoto.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        "Publish Photo"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
