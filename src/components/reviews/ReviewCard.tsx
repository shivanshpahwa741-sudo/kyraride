import { format } from "date-fns";
import { Star, Trash2 } from "lucide-react";

interface ReviewCardProps {
  review: {
    id: string;
    user_name: string;
    review_text: string;
    image_url: string;
    created_at: string;
    rating: number;
  };
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

const ReviewCard = ({ review, isAdmin, onDelete }: ReviewCardProps) => {
  const hasImage = review.image_url && review.image_url.trim() !== "";
  const hasText = review.review_text && review.review_text.trim() !== "";
  const initial = review.user_name.charAt(0).toUpperCase();

  return (
    <div className="break-inside-avoid mb-3">
      <div className="rounded-xl overflow-hidden bg-card/60 border border-border/30 relative">
        {/* Admin Delete Button */}
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 hover:bg-destructive/90 transition-colors"
            title="Delete review"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        )}

        {/* Header: Avatar, Name, Date */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {initial}
            </div>
            <div>
              <p className="text-foreground font-medium text-sm">{review.user_name}</p>
              <p className="text-muted-foreground text-xs">
                {format(new Date(review.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Stars */}
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Image */}
        {hasImage && (
          <img
            src={review.image_url}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        )}

        {/* Review Text */}
        {hasText && (
          <div className="px-4 py-3">
            <p className="text-foreground/90 text-sm leading-relaxed">
              {review.review_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;