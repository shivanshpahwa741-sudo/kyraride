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

  return (
    <div className="break-inside-avoid mb-2 sm:mb-3">
      <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-card/60 relative group">
        {/* Admin Delete Button - Overlay */}
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 p-1.5 rounded-full bg-background/80 hover:bg-destructive/90 transition-colors"
            title="Delete review"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-destructive" />
          </button>
        )}

        {/* Image - only show if there's a valid image URL */}
        {hasImage && (
          <img
            src={review.image_url}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        )}

        {/* Content Footer - Compact on mobile */}
        <div className="p-2 sm:px-3 sm:py-2.5">
          {/* Review Text - Truncated on mobile */}
          {hasText && (
            <p className="text-foreground text-[11px] sm:text-xs leading-relaxed line-clamp-2 sm:line-clamp-none">
              {review.review_text}
            </p>
          )}

          {/* Footer: Name & Stars - Compact */}
          <div className="flex items-center justify-between gap-1.5 mt-1 sm:mt-1.5">
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {review.user_name}
            </span>
            <div className="flex gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                    star <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;