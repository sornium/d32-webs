import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Clock } from "lucide-react";

interface DiscordTimestampProps {
  dateString?: string;
  isDiscordVerified?: boolean;
}

export default function DiscordTimestamp({ dateString, isDiscordVerified = true }: DiscordTimestampProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the date safely
  const date = dateString ? new Date(dateString) : new Date();
  const isValidDate = !isNaN(date.getTime());

  // Formatter for main display (Discord's short date style, e.g., "05/15/2026")
  const formatShortDate = (d: Date) => {
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
  };

  // Cross-browser precise formatter for the native Discord tooltip format (e.g. "Monday, June 29, 2026 2:08 AM")
  const formatFullDateTime = (d: Date) => {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const weekday = weekdays[d.getDay()];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${weekday}, ${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
  };

  // Close the tooltip when clicking outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isValidDate) {
    return <span className="text-zinc-500 font-mono text-xs">Invalid Date</span>;
  }

  const shortDate = formatShortDate(date);
  const fullDateTime = formatFullDateTime(date);

  return (
    <div
      ref={containerRef}
      className="relative inline-block select-none"
      id={`discord-timestamp-${date.getTime()}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Discord timestamp button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip((prev) => !prev);
        }}
        className={`group px-2.5 py-0.5 rounded-[11px] text-[11px] cursor-pointer transition-all duration-150 inline-flex items-center gap-1.5 ${
          isDiscordVerified
            ? "bg-[#2b2d31]/80 hover:bg-[#35373c] text-[#dbdee1] border border-white/5 active:scale-95"
            : "bg-[#1e1f22]/50 hover:bg-[#2b2d31]/50 text-zinc-400 hover:text-zinc-300 border border-transparent"
        }`}
        title="View full time and date"
      >
        <Clock className="w-3.5 h-3.5 text-[#949ba4] group-hover:text-white transition-colors duration-150 shrink-0" />
        <span style={{ fontFamily: "Verdana, sans-serif" }}>{shortDate}</span>
      </button>

      {/* Native Discord style tooltip shown in the second image */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-[#111214] text-[#dbdee1] text-[12px] font-sans font-medium px-3 py-1.5 rounded-[5px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-center whitespace-nowrap pointer-events-none"
            id={`discord-tooltip-popup-${date.getTime()}`}
          >
            {fullDateTime}
            {/* Native down-pointing caret */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#111214]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
