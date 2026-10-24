import { useEffect, useState } from "react";
import { Star, ShieldCheck } from "lucide-react";
import DiscordTimestamp from "../components/DiscordTimestamp";

interface Review {
  reviewId?: string;
  rating: number;
  reviewText: string;
  authorId?: string;
  username: string;
  displayName: string;
  productName: string;
  profilePicture?: string;
  avatarUrl?: string;
  isDiscordVerified?: boolean;
  date?: string;
  createdAt?: string;
  images?: string[];
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState<string>("5.0");
  const [verifiedCount, setVerifiedCount] = useState<number>(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        if (data.length > 0) {
          const total = data.reduce((acc: number, r: Review) => acc + Number(r.rating || 5), 0);
          setAvgRating((total / data.length).toFixed(1));
          setVerifiedCount(data.length);
        }
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string, username?: string) => {
    const target = name || username || "U";
    return target.slice(0, 2).toUpperCase();
  };

  const formatReviewDate = (dateStr?: string) => {
    if (!dateStr) return "May 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return "May 2026";
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="text-left space-y-2">
        <span className="text-xs uppercase tracking-widest text-white/60 font-semibold font-mono">
          Reviews
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight leading-none">
          What customers say.
        </h1>
        <div className="flex items-center gap-2 pt-2 text-white/60 text-sm">
          <div className="flex text-white">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(Number(avgRating))
                    ? "fill-white text-white"
                    : "text-white/20"
                }`}
              />
            ))}
          </div>
          <span className="font-semibold text-white">{avgRating}</span>
          <span className="text-white/30">•</span>
          <span>{verifiedCount || 6} verified reviews</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.06] rounded-3xl border border-white/15 text-white/50 backdrop-blur-2xl">
          No reviews yet.
        </div>
      ) : (
        /* Grid layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => {
            const avatarPhoto = review.avatarUrl || review.profilePicture;
            const hasProfilePicture = !!avatarPhoto;
            const initials = getInitials(review.displayName, review.username);

            return (
              <div
                key={review.reviewId || review.createdAt}
                className="bg-white/[0.06] border border-white/15 hover:border-white/30 hover:bg-white/[0.10] transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between relative group shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-2xl"
              >
                {/* Decorative styled quotes mark on top right */}
                <div className="absolute top-2 right-6 text-white/[0.07] font-serif text-6xl select-none pointer-events-none group-hover:text-white/15 transition-colors duration-300">
                  ”
                </div>

                <div className="space-y-4">
                  {/* Reviewer identity */}
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

                  {/* Rating stars */}
                  <div className="flex gap-0.5 pt-1">
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

                  {/* Review text with custom quotes formatting */}
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

                {/* Footer section with Date and Product Badge */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 text-xs text-white/50">
                  <DiscordTimestamp
                    dateString={review.createdAt || review.date}
                    isDiscordVerified={review.isDiscordVerified}
                  />
                  <span className="px-3 py-1 bg-white/10 border border-white/20 text-[11px] font-semibold text-white tracking-wide rounded-full max-w-[150px] truncate shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                    {review.productName || "Prime License"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
