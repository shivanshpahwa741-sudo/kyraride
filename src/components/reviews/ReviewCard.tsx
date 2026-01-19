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
  return (
    <div className="break-inside-avoid">
      <div className="kyra-card p-0 overflow-hidden">
        {/* Header - User Name & Rating */}
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent font-semibold text-sm uppercase">
                  {review.user_name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{review.user_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                title="Delete review"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
          </div>
          {/* Star Rating */}
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="w-full">
          <img
            src={review.image_url}
            alt={`Review by ${review.user_name}`}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>

        {/* Review Text */}
        <div className="px-4 py-4">
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {review.review_text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;