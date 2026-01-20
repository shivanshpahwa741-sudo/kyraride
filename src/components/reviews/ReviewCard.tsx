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
    <div className="break-inside-avoid mb-3">
      <div className="rounded-xl overflow-hidden bg-card/50 hover:bg-card/80 transition-colors group relative">
        {/* Admin Delete Button - Overlay */}
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 hover:bg-destructive/90 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete review"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive group-hover:text-destructive-foreground" />
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

        {/* Content Footer */}
        <div className="p-3">
          {/* Review Text - only show if exists */}
          {hasText && (
            <p className="text-foreground/90 text-xs leading-relaxed mb-2 line-clamp-3">
              {review.review_text}
            </p>
          )}

          {/* Compact Footer: Name & Stars */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">
              {review.user_name}
            </span>
            <div className="flex gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
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