import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReviewCard from "@/components/reviews/ReviewCard";
import WriteReviewModal from "@/components/reviews/WriteReviewModal";

interface Review {
  id: string;
  user_name: string;
  review_text: string;
  image_url: string;
  created_at: string;
}

const Reviews = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAddReviewClick = () => {
    if (!user) {
      toast.error("Please sign in to write a review");
      navigate("/auth");
      return;
    }
    setIsModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    setIsModalOpen(false);
    fetchReviews();
    toast.success("Review submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="kyra-container py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="kyra-container py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {/* Add Review Card - Always First */}
            <div
              onClick={handleAddReviewClick}
              className="break-inside-avoid cursor-pointer group"
            >
              <div className="kyra-card flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-border/50 hover:border-accent/50 transition-all duration-300 hover:bg-secondary/20">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                  Write a Review
                </p>
              </div>
            </div>

            {/* Review Cards */}
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {!isLoading && reviews.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            No reviews yet. Be the first to share your experience!
          </p>
        )}
      </main>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleReviewSubmitted}
        userName={user?.name || ""}
      />
    </div>
  );
};

export default Reviews;
