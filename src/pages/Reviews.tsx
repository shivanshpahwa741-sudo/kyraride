import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Masonry from "react-masonry-css";
import ReviewCard from "@/components/reviews/ReviewCard";
import WriteReviewModal from "@/components/reviews/WriteReviewModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Review {
  id: string;
  user_name: string;
  review_text: string;
  image_url: string;
  created_at: string;
  rating: number;
}

const Reviews = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check admin status via secure edge function
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.phone) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("check-admin", {
          body: { phone: user.phone },
        });

        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.isAdmin === true);
        }
      } catch (err) {
        console.error("Failed to check admin status:", err);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user?.phone]);

  const fetchReviews = async () => {
    try {
      // Use public_reviews view to avoid exposing user_id
      const { data, error } = await supabase
        .from("public_reviews")
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

  const handleDeleteReview = async () => {
    if (!deleteReviewId || !user?.phone) return;

    setIsDeleting(true);
    try {
      const response = await supabase.functions.invoke("delete-review", {
        body: { reviewId: deleteReviewId, adminPhone: user.phone },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success("Review deleted successfully");
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(false);
      setDeleteReviewId(null);
    }
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
          {!isCheckingAdmin && isAdmin && (
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded">
              Admin Mode
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="kyra-container py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : (
          <Masonry
            breakpointCols={{
              default: 5,
              1280: 4,
              1024: 3,
              640: 2
            }}
            className="flex -ml-3 w-auto"
            columnClassName="pl-3 bg-clip-padding"
          >
            {/* Add Review Card - Always First */}
            <div
              onClick={handleAddReviewClick}
              className="mb-3 cursor-pointer group"
            >
              <div className="rounded-xl sm:rounded-2xl flex flex-col items-center justify-center py-8 sm:py-10 bg-card/40 border border-dashed border-border/40 hover:border-accent/50 transition-all duration-300 hover:bg-secondary/20">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-2 group-hover:bg-accent/20 transition-colors">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                  Write a Review
                </p>
              </div>
            </div>

            {/* Review Cards */}
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isAdmin={isAdmin}
                onDelete={(id) => setDeleteReviewId(id)}
              />
            ))}
          </Masonry>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Review</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reviews;