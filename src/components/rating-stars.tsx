"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  characterId: string;
}

export function RatingStars({ characterId }: RatingStarsProps) {
  const queryClient = useQueryClient();
  const [hoverScore, setHoverScore] = useState(0);
  const [showCouponMsg, setShowCouponMsg] = useState(false);
  const [userScore, setUserScore] = useState(0);

  const rateMutation = useMutation({
    mutationFn: (score: number) => api.characters.rate(characterId, score),
    onSuccess: (_data, score) => {
      setUserScore(score);
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      setShowCouponMsg(true);
    },
  });

  const handleRate = (score: number) => {
    if (userScore || rateMutation.isPending) return;
    rateMutation.mutate(score);
  };

  return (
    <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">
            {userScore ? "您的评分" : "给角色打分"}
          </h4>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => !userScore && setHoverScore(star)}
                onMouseLeave={() => !userScore && setHoverScore(0)}
                onClick={() => handleRate(star)}
                disabled={!!userScore || rateMutation.isPending}
                className={cn(
                  "transition-all duration-200 focus:outline-none",
                  !userScore && "hover:scale-110 active:scale-90",
                  userScore ? "cursor-default" : "cursor-pointer"
                )}
              >
                <Star
                  size={32}
                  fill={(hoverScore || userScore) >= star ? "#e67e22" : "transparent"}
                  color={(hoverScore || userScore) >= star ? "#e67e22" : "rgba(255,255,255,0.2)"}
                  className={cn(
                    "transition-colors",
                    hoverScore >= star && "drop-shadow-[0_0_8px_rgba(230,126,34,0.5)]"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCouponMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 py-3 px-4 bg-ansha/10 border border-ansha/20 rounded-xl text-ansha text-sm font-bold text-center">
              感谢评价！已获得7折优惠券，可在结账时使用。
            </div>
          </motion.div>
        )}
        {!showCouponMsg && userScore > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/40 text-xs italic">
            您已对该角色进行过评分。
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
