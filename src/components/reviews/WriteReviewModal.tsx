import { useState, useRef } from "react";
import { X, Upload, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userName: string;
}

const WriteReviewModal = ({
  isOpen,
  onClose,
  onSuccess,
  userName,
}: WriteReviewModalProps) => {
  const { user } = useAuth();
  const [reviewText, setReviewText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image (PNG, JPG, JPEG, WebP, or GIF)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Only star rating is required - text and image are optional
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    // Check if user is verified
    if (!user?.phone) {
      toast.error("Please sign in to submit a review");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = "";

      // Upload image via secure edge function (validates user profile)
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('phone', user.phone);

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
          "upload-review-image",
          { body: formData }
        );

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Upload failed: " + uploadError.message);
        }

        if (uploadData?.error) {
          throw new Error(uploadData.error);
        }

        imageUrl = uploadData.url;
        console.log("Secure upload successful:", imageUrl);
      }

      // Submit review through secure edge function
      const reviewTextValue = reviewText.trim() || "";
      
      const { data, error } = await supabase.functions.invoke("submit-review", {
        body: {
          phone: user.phone,
          userName: user.name,
          reviewText: reviewTextValue,
          imageUrl: imageUrl,
          rating: rating,
        },
      });

      if (error) {
        console.error("Review submission error:", error);
        throw new Error(error.message || "Failed to submit review");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log("Review submitted:", data);

      // Reset form
      setReviewText("");
      setSelectedImage(null);
      setImagePreview(null);
      setRating(5);
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReviewText("");
      setSelectedImage(null);
      setImagePreview(null);
      setRating(5);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Write a Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-semibold text-sm uppercase">
                {userName.charAt(0)}
              </span>
            </div>
            <span className="font-medium text-foreground">{userName}</span>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload (Optional) */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Add Photo <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-accent/50 hover:bg-secondary/20 transition-all"
              >
                <div className="flex gap-4">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Tap to upload from device
                </span>
              </button>
            )}
          </div>

          {/* Review Text (Optional) */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Your Review <span className="text-muted-foreground font-normal">(optional, max 500 chars)</span>
            </label>
            <Textarea
              placeholder="Share your experience with KYRA..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
              className="min-h-[100px] resize-none bg-input border-border/50 text-foreground placeholder:text-muted-foreground"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {reviewText.length}/500
            </p>
          </div>

          {/* Submit Button - only requires rating */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            variant="hero"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Post Review"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WriteReviewModal;