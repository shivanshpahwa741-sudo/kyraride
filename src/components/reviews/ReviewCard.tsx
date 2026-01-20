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
    <div className="break-inside-avoid mb-3">
      <div className="kyra-card p-0 overflow-hidden">
        {/* Header - Compact */}
        <div className="px-3 py-2 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent font-semibold text-xs uppercase">
                  {review.user_name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{review.user_name}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors"
                title="Delete review"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            )}
          </div>
          {/* Star Rating */}
          <div className="flex gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${
                  star <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Image - only show if there's a valid image URL */}
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
          <div className="px-3 py-2.5">
            <p className="text-foreground text-xs leading-relaxed">
              {review.review_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;