import { format } from "date-fns";

interface ReviewCardProps {
  review: {
    id: string;
    user_name: string;
    review_text: string;
    image_url: string;
    created_at: string;
  };
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <div className="break-inside-avoid">
      <div className="kyra-card p-0 overflow-hidden">
        {/* Header - User Name */}
        <div className="px-4 py-3 border-b border-border/30">
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
