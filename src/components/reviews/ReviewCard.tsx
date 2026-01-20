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
    <div className="break-inside-avoid mb-1.5 sm:mb-3">
      <div className="rounded-lg sm:rounded-xl overflow-hidden bg-card/60 relative group">
        {/* Admin Delete Button - Overlay */}
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 p-1 sm:p-1.5 rounded-full bg-background/80 hover:bg-destructive/90 transition-colors"
            title="Delete review"
          >
            <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-destructive" />
          </button>
        )}

        {/* Image */}
        {hasImage && (
          <img
            src={review.image_url}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        )}

        {/* Compact Content */}
        <div className="p-1.5 sm:p-2.5">
          {/* Review Text - Very compact on mobile */}
          {hasText && (
            <p className="text-foreground text-[10px] sm:text-xs leading-snug line-clamp-2 sm:line-clamp-3 mb-1">
              {review.review_text}
            </p>
          )}

          {/* Footer: Stars & Name - Single line */}
          <div className="flex items-center gap-1">
            <div className="flex gap-px shrink-0">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${
                    star <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
              {review.user_name.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;