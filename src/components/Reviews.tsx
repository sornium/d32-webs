import { useState, useEffect } from "react";
import { useStore } from "../store";
import { Star, Image as ImageIcon, Check, AlertCircle, Flag } from "lucide-react";
import DiscordTimestamp from "./DiscordTimestamp";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { useTranslation } from "../lib/i18n";

interface Review {
  reviewId?: string;
  rating: number;
  reviewText: string;
  userId: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  avatarUrl?: string;
  productId: string;
  productName: string;
  isVerifiedPurchase: boolean;
  isDiscordVerified?: boolean;
  images?: string[];
  reported?: boolean;
  date?: string;
  createdAt?: string;
}

interface ReviewProps {
  productId: string;
}

export default function Reviews({ productId }: ReviewProps) {
  const { user } = useStore();
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    hasReviewed: boolean;
  } | null>(null);
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/products/${productId}/review-eligibility`);
      if (res.ok) {
        const data = await res.json();
        setEligibility(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
    checkEligibility();
  }, [productId, user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 3) {
      toast.error(t("Maximum 3 images allowed per review", "Maximum 3 images allowed per review"));
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("Each image must be under 2MB", "Each image must be under 2MB"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!user) {
      setFormError(t("You must be logged in to leave a review.", "You must be logged in to leave a review."));
      return;
    }

    if (!reviewText.trim()) {
      setFormError(t("Please provide review text.", "Please provide review text."));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          reviewText,
          images,
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowReviewForm(false);
          setSubmitSuccess(false);
          setReviewText("");
          setImages([]);
          setRating(5);
          fetchReviews();
          checkEligibility();
        }, 1500);
      } else {
        const errorData = await res.json();
        setFormError(errorData.error || t("Failed to submit review.", "Failed to submit review."));
      }
    } catch (err) {
      setFormError(t("An unexpected error occurred.", "An unexpected error occurred."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReviewId || !reportReason.trim()) return;

    try {
      const res = await fetch(`/api/reviews/${reportingReviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });

      if (res.ok) {
        toast.success(t("Review reported for moderation.", "Review reported for moderation."));
        setReportingReviewId(null);
        setReportReason("");
        fetchReviews();
      } else {
        toast.error(t("Failed to report review.", "Failed to report review."));
      }
    } catch (err) {
      toast.error(t("An unexpected error occurred.", "An unexpected error occurred."));
    }
  };

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) /
          reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {t("Customer Reviews", "Customer Reviews")}
          </h2>
          {avgRating && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex text-white">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Number(avgRating) ? "text-white fill-white" : "text-white/20"}`}
                  />
                ))}
              </div>
              <span className="text-white font-medium">
                {avgRating} {t("out of", "out of")} 5
              </span>
            </div>
          )}
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {eligibility?.eligible ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-5 py-2.5 bg-white hover:bg-white/90 text-black rounded-full transition text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 cursor-pointer"
              >
                {showReviewForm ? t("Cancel", "Cancel") : t("Write Review", "Write Review")}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  disabled
                  className="px-4 py-2 bg-white/5 border border-white/15 rounded-full text-white/40 cursor-not-allowed text-xs font-medium"
                >
                  {eligibility?.hasReviewed
                    ? t("Already Reviewed", "Already Reviewed")
                    : t("Purchase Required To Review", "Purchase Required To Review")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-white/50">{t("Sign in to leave a review", "Sign in to leave a review")}</div>
        )}
      </div>

      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <form
              onSubmit={handleSubmit}
              className="p-6 rounded-3xl bg-white/[0.08] border border-white/15 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]"
            >
              {submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-white">
                  <Check className="w-12 h-12 mb-4" />
                  <p className="text-lg">{t("Review submitted for moderation!", "Review submitted for moderation!")}</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white mb-4">
                    {t("Create Review", "Create Review")}
                  </h3>

                  {formError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {formError}
                    </div>
                  )}

                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-white/60 text-sm">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= rating ? "text-white fill-white" : "text-white/20"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    placeholder="What did you think about this product?"
                    className="w-full bg-[#121214] border border-white/15 rounded-2xl p-4 text-white min-h-[120px] focus:outline-none focus:border-white/40 mb-4 placeholder-white/30 text-sm"
                  />

                  <div className="mb-4">
                    <div className="flex gap-2 flex-wrap mb-2">
                      {images.map((img, i) => (
                        <div
                          key={i}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20"
                        >
                          <img
                            src={img}
                            alt="Upload"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setImages(images.filter((_, idx) => idx !== i))
                            }
                            className="absolute top-1 right-1 bg-black/70 p-1 rounded-full text-white hover:bg-black"
                          >
                            <AlertCircle className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {images.length < 3 && (
                      <label className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-xl w-max cursor-pointer text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 transition">
                        <ImageIcon className="w-4 h-4 text-white" />
                        Add Image
                        <input
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.heic,.heif,.svg,.bmp,.tiff,.avif,.jfif,.pjpeg,.pjp"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-white text-black font-bold text-xs rounded-full hover:bg-white/90 transition disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((sk) => (
            <div
              key={sk}
              className="p-6 rounded-3xl bg-white/[0.06] border border-white/15 h-[160px] animate-pulse"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                  <div>
                    <div className="w-24 h-4 bg-white/10 rounded animate-pulse mb-1"></div>
                    <div className="w-16 h-3 bg-white/5 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="w-3/4 h-3 bg-white/5 rounded animate-pulse"></div>
                <div className="w-1/2 h-3 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="text-white/50 bg-white/[0.06] border border-white/15 p-8 rounded-3xl text-center backdrop-blur-2xl">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          reviews.map((review) => {
            const avatarPhoto = review.avatarUrl || review.profilePicture;
            const hasProfilePicture = !!avatarPhoto;
            const getInitials = (displayName?: string, username?: string) => {
              const name = displayName || username || "Anonymous";
              return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
            };
            const initials = getInitials(review.displayName, review.username);

            return (
              <div
                key={review.reviewId}
                className="bg-white/[0.06] border border-white/15 hover:border-white/30 hover:bg-white/[0.10] transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between relative group shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-2xl"
              >
                {/* Decorative styled quotes mark on top right */}
                <div className="absolute top-2 right-6 text-white/[0.07] font-serif text-6xl select-none pointer-events-none group-hover:text-white/15 transition-colors duration-300">
                  ”
                </div>

                <div className="space-y-4">
                  {/* Reviewer identity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasProfilePicture ? (
                        <img
                          src={avatarPhoto!}
                          alt={review.displayName || review.username}
                          className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-semibold text-sm select-none shrink-0 shadow-inner">
                          {initials}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-bold text-sm leading-tight truncate">
                          {review.displayName || review.username?.replace("@", "")}
                        </span>
                        <span className="text-xs text-white/50 truncate mt-0.5 font-mono">
                          {review.username?.startsWith("@") ? review.username : `@${review.username}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user && user.id !== review.userId && !review.reported && (
                        <button
                          onClick={() => setReportingReviewId(review.reviewId || null)}
                          className="text-white/40 hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-1 cursor-pointer"
                          title="Report Review"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                      {review.reported && (
                        <span className="text-red-400 text-xs flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <Flag className="w-3 h-3" /> Reported
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating stars & verified badges */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? "fill-white text-white"
                              : "text-white/20"
                          }`}
                        />
                      ))}
                    </div>
                    
                    <div className="flex gap-1.5">
                      {review.isVerifiedPurchase && (
                        <span className="text-[10px] text-white bg-white/15 border border-white/30 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider shadow-sm">
                          Verified
                        </span>
                      )}
                      {review.isDiscordVerified && (
                        <span className="text-[10px] text-white/90 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider shadow-sm">
                          Discord
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Review text */}
                  <p className="text-white/80 text-sm leading-relaxed font-sans pt-1">
                    "{review.reviewText}"
                  </p>

                  {/* Images if any */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 pt-2 overflow-x-auto pb-1 custom-scrollbar">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Review Attachment"
                          className="h-16 w-16 object-cover rounded-xl border border-white/15 shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Date display */}
                <div className="flex justify-end mt-4">
                  <DiscordTimestamp
                    dateString={review.createdAt || review.date}
                    isDiscordVerified={review.isDiscordVerified}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report Modal */}
      {reportingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#09090c]/95 border border-white/20 rounded-3xl p-6 shadow-2xl backdrop-blur-3xl">
            <h3 className="text-lg font-bold text-white mb-4">
              Report Review
            </h3>
            <form onSubmit={handleReport}>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                placeholder="Why are you reporting this review?"
                className="w-full bg-[#121214] border border-white/15 rounded-2xl p-4 text-white min-h-[100px] focus:outline-none focus:border-white/40 mb-4 text-sm"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReportingReviewId(null)}
                  className="px-4 py-2 text-white/50 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500 border border-red-500/30 hover:border-red-500 hover:text-white rounded-full transition-colors text-xs font-bold cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
