import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  X,
  ShieldAlert,
  BadgeCheck,
  Search,
  Info,
  AlertTriangle,
  AlertCircle,
  Camera,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useStore } from "../store";
import { useCurrency } from "../lib/currency";
import { useTranslation } from "../lib/i18n";

const PLATFORMS = ["TikTok", "Instagram", "Discord", "Twitter/X", "Tellonym"];
const EMAIL_PROVIDERS = ["Gmail", "Outlook", "Yahoo", "Rambler", "Other"];
const DISCORD_BADGES = [
  "Leaf",
  "Quest Badge",
  "Gift Badge",
  "Early Supporter",
  "Developer Badge",
  "Bug Hunter",
  "Bug Hunter Gold"
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const YEARS = Array.from({ length: 20 }, (_, i) =>
  (new Date().getFullYear() - i).toString(),
);
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30 flex items-center justify-between text-sm transition-colors hover:border-white/20"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full top-full mt-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden py-1 shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${value === opt ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardSell() {
  const navigate = useNavigate();
  const { isDbConfigured, user } = useStore();
  const { currency } = useCurrency();
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [mockScanning, setMockScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const [formData, setFormData] = useState({
    platform: PLATFORMS[0],
    discordType: "Username", // Username or Vanity
    vanityURL: "",
    vanityStatus: "Active",
    username: "",
    followers: "",
    creationDay: "",
    creationMonth: "",
    creationYear: "",
    emailProvider: EMAIL_PROVIDERS[0],
    originalEmail: "Yes",
    priceBIN: "",
    priceCO: "",
    condition: "Clean",
    usedStatus: "Unused / Fresh",
    warningHistory: "",
    screenshots: [] as File[],
    hasBadges: "No",
    badges: [] as string[],
    verified: "No",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        screenshots: [...prev.screenshots, ...newFiles].slice(0, 4),
      }));
      setScanError("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) =>
          f.type.startsWith("image/") ||
          /\.(png|jpe?g|gif|webp|heic|heif|bmp|tiff|avif|svg|jfif|pjpeg|pjp)$/i.test(
            f.name
          )
      );
      if (droppedFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          screenshots: [...prev.screenshots, ...droppedFiles].slice(0, 4),
        }));
        setScanError("");
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isAdding) return;
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const newFiles: File[] = [];

      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.startsWith("image/") || item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              newFiles.push(file);
            }
          }
        }
      }

      if (newFiles.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (
            file.type.startsWith("image/") ||
            /\.(png|jpe?g|gif|webp|heic|heif|bmp|tiff|avif|svg|jfif|pjpeg|pjp)$/i.test(file.name)
          ) {
            newFiles.push(file);
          }
        }
      }

      if (newFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          screenshots: [...prev.screenshots, ...newFiles].slice(0, 4),
        }));
        setScanError("");
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isAdding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.screenshots.length === 0) {
      setScanError(
        'Please upload or paste at least one screenshot proof containing "d32.store"',
      );
      return;
    }

    setMockScanning(true);
    // Simulate OCR scanning delay
    await new Promise((r) => setTimeout(r, 1200));
    setMockScanning(false);

    // Translate formData into server schema format
    const submitData = {
      platform: formData.platform,
      username: formData.platform === "Discord" && formData.discordType === "Vanity URL" ? formData.vanityURL : formData.username,
      followers: ["TikTok", "Instagram", "Twitter/X"].includes(formData.platform) ? formData.followers : null,
      bin: formData.priceBIN ? `$${formData.priceBIN}` : null,
      co: formData.priceCO ? `$${formData.priceCO}` : "None",
      condition: formData.condition,
      ogEmail: formData.originalEmail === "Yes",
      hasBadges: formData.platform === "Discord" && formData.discordType === "Username" && formData.hasBadges === "Yes",
      badges: formData.platform === "Discord" && formData.discordType === "Username" && formData.hasBadges === "Yes" ? formData.badges : [],
      verified: formData.platform === "TikTok" && formData.verified === "Yes",
    };

    try {
      await fetch("/api/proxies/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": user?.id || "",
        },
        body: JSON.stringify(submitData),
      });
    } catch (err) {
      console.error("Failed to submit listing to backend:", err);
    }

    toast.success(
      "Listing submitted successfully! Awaiting manual staff approval.",
    );

    setListings([...listings, { ...formData, status: "Pending Review" }]);
    setIsAdding(false);
    setFormData({
      platform: PLATFORMS[0],
      discordType: "Username",
      vanityURL: "",
      vanityStatus: "Active",
      username: "",
      followers: "",
      creationDay: "",
      creationMonth: "",
      creationYear: "",
      emailProvider: EMAIL_PROVIDERS[0],
      originalEmail: "Yes",
      priceBIN: "",
      priceCO: "",
      condition: "Clean",
      usedStatus: "Unused / Fresh",
      warningHistory: "",
      screenshots: [],
      hasBadges: "No",
      badges: [],
      verified: "No",
    });
  };

  if (!isDbConfigured) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Your Listings</h2>
          <p className="text-xs text-white/50 mt-0.5">Manage accounts you have submitted for verification and marketplace sale.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex h-9 px-4 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white text-black font-semibold text-xs shadow-sm hover:bg-white/90 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Add Listing</span>
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="p-10 rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl text-center flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="w-12 h-12 rounded-full border border-white/15 bg-white/10 flex items-center justify-center mb-3 text-white/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            No listings yet
          </h3>
          <p className="text-xs text-white/50 mb-5 max-w-sm">
            You haven't listed any accounts yet. Submit your social handles, gaming tags, or vanity links for escrow verification.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex h-9 px-5 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white text-black font-semibold text-xs shadow-sm hover:bg-white/90 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Create First Listing</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l, i) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] flex items-center justify-between"
            >
              <div>
                <h3 className="text-white font-semibold text-sm mb-0.5">
                  {l.platform} - {l.username}
                </h3>
                <p className="text-white/50 text-xs">
                  BIN: ${l.priceBIN} • Provider: {l.emailProvider}
                </p>
              </div>
              <div className="px-3 py-1 flex-shrink-0 ml-4 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/25">
                {l.status}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-white">Add Listing</h2>
                <button
                  onClick={() => setIsAdding(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                <div className="mb-6 p-4 rounded-xl bg-white/10 border border-white/20 text-zinc-200 text-sm">
                  <p className="font-medium mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Marketplace Fee Disclosure
                  </p>
                  <p>
                    Would you like to sell your account through D32 Proxy
                    Marketplace? We charge a <strong>30% fee</strong> on
                    successful sales.
                  </p>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                  <p className="font-medium mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Verification Requirement
                  </p>
                  <p className="mb-2">
                    To prevent fraud, you must prove ownership of this account.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Your uploaded screenshots{" "}
                      <strong>must contain "d32.store"</strong> text visible
                      somewhere on the screen (e.g. bio, notes, terminal).
                    </li>
                    <li>
                      You <strong>must send a friend request</strong> to:{" "}
                      <code className="bg-amber-500/20 px-1.5 py-0.5 rounded">
                        KernelPath
                      </code>{" "}
                      on Discord.
                    </li>
                  </ul>
                </div>

                <form
                  id="sellForm"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="z-[60]">
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                        Platform
                      </label>
                      <CustomSelect
                        value={formData.platform}
                        onChange={(val) =>
                          setFormData({ ...formData, platform: val })
                        }
                        options={PLATFORMS}
                      />
                    </div>

                    {formData.platform === "Discord" && (
                      <div className="z-[55]">
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                          Listing Type
                        </label>
                        <CustomSelect
                          value={formData.discordType}
                          onChange={(val) =>
                            setFormData({ ...formData, discordType: val })
                          }
                          options={["Username", "Vanity URL"]}
                        />
                      </div>
                    )}

                    {!(formData.platform === "Discord" && formData.discordType === "Vanity URL") && (
                      <div className="z-[50]">
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                          Username / Handle
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                          }
                          className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30"
                        />
                      </div>
                    )}

                    {formData.platform === "Discord" && formData.discordType === "Username" && (
                      <>
                        <div className="z-[45]">
                          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                            Has Badges?
                          </label>
                          <CustomSelect
                            value={formData.hasBadges}
                            onChange={(val) =>
                              setFormData({
                                ...formData,
                                hasBadges: val,
                                badges: val === "No" ? [] : formData.badges,
                              })
                            }
                            options={["Yes", "No"]}
                          />
                        </div>

                        {formData.hasBadges === "Yes" && (
                          <div className="md:col-span-2 p-5 rounded-2xl bg-[#0e0e0e] border border-white/10 space-y-3">
                            <label className="block text-sm font-semibold text-zinc-200">
                              Select Account Badges (Select multiple)
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {DISCORD_BADGES.map((badge) => {
                                const isSelected = formData.badges.includes(badge);
                                return (
                                  <button
                                    key={badge}
                                    type="button"
                                    onClick={() => {
                                      const updated = isSelected
                                        ? formData.badges.filter((b) => b !== badge)
                                        : [...formData.badges, badge];
                                      setFormData({ ...formData, badges: updated });
                                    }}
                                    className={`px-4 py-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                                      isSelected
                                        ? "bg-[#5865F2]/15 border-[#5865F2] text-white shadow-md shadow-[#5865F2]/5"
                                        : "bg-black/30 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-300"
                                    }`}
                                  >
                                    <span>{badge}</span>
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {formData.platform === "TikTok" && (
                      <div className="z-[45]">
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                          Verified Profile?
                        </label>
                        <CustomSelect
                          value={formData.verified}
                          onChange={(val) =>
                            setFormData({ ...formData, verified: val })
                          }
                          options={["Yes", "No"]}
                        />
                      </div>
                    )}

                    {formData.platform === "Discord" && formData.discordType === "Vanity URL" && (
                      <>
                        <div className="z-[40]">
                          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                            Vanity URL
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="discord.gg/..."
                            value={formData.vanityURL}
                            onChange={(e) =>
                              setFormData({ ...formData, vanityURL: e.target.value })
                            }
                            className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30"
                          />
                        </div>
                      </>
                    )}

                    {["TikTok", "Instagram", "Twitter/X"].includes(
                      formData.platform,
                    ) && (
                      <div className="z-[40]">
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                          Follower Count
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. 10.5K"
                          value={formData.followers}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              followers: e.target.value,
                            })
                          }
                          className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30"
                        />
                      </div>
                    )}

                    {!(formData.platform === "Discord" && formData.discordType === "Vanity URL") && (
                      <div className="md:col-span-2 z-[35]">
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                          Exact Creation Date
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <CustomSelect
                            value={formData.creationDay}
                            onChange={(val) =>
                              setFormData({ ...formData, creationDay: val })
                            }
                            options={DAYS}
                            placeholder="Day"
                          />
                          <CustomSelect
                            value={formData.creationMonth}
                            onChange={(val) =>
                              setFormData({ ...formData, creationMonth: val })
                            }
                            options={MONTHS}
                            placeholder="Month"
                          />
                          <CustomSelect
                            value={formData.creationYear}
                            onChange={(val) =>
                              setFormData({ ...formData, creationYear: val })
                            }
                            options={YEARS}
                            placeholder="Year"
                          />
                        </div>
                      </div>
                    )}

                    {!(formData.platform === "Discord" && formData.discordType === "Vanity URL") && (
                      <>
                        <div className="z-[30]">
                          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                            Email Provider
                          </label>
                          <CustomSelect
                            value={formData.emailProvider}
                            onChange={(val) =>
                              setFormData({ ...formData, emailProvider: val })
                            }
                            options={EMAIL_PROVIDERS}
                          />
                        </div>

                        <div className="z-[29]">
                          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                            Has Original Email (OGE)?
                          </label>
                          <CustomSelect
                            value={formData.originalEmail}
                            onChange={(val) =>
                              setFormData({ ...formData, originalEmail: val })
                            }
                            options={["Yes", "No"]}
                          />
                        </div>
                      </>
                    )}

                    <div className="z-[25]">
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                        {t("BIN Price", "BIN Price")} ({currency})
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.priceBIN}
                        onChange={(e) =>
                          setFormData({ ...formData, priceBIN: e.target.value })
                        }
                        className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="z-[24]">
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                        {t("Starting C/O", "Starting C/O")} ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.priceCO}
                        onChange={(e) =>
                          setFormData({ ...formData, priceCO: e.target.value })
                        }
                        className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30"
                      />
                    </div>

                    {!(formData.platform === "Discord" && formData.discordType === "Vanity URL") && (
                      <>
                        <div className="z-[20]">
                          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                            Account Condition
                          </label>
                          <CustomSelect
                            value={formData.condition}
                            onChange={(val) =>
                              setFormData({ ...formData, condition: val })
                            }
                            options={[
                              "Clean",
                              "Warned",
                              "Shadowbanned",
                              "Restricted",
                            ]}
                          />
                        </div>

                        <div className="z-[19]">
                          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                            Is Account Used?
                          </label>
                          <CustomSelect
                            value={formData.usedStatus}
                            onChange={(val) =>
                              setFormData({ ...formData, usedStatus: val })
                            }
                            options={[
                              "Unused / Fresh",
                              "Used Personal",
                              "Used Bot/Farm",
                            ]}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {!(formData.platform === "Discord" && formData.discordType === "Vanity URL") && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                        Warning History / Additional Notes
                      </label>
                      <textarea
                        rows={3}
                      placeholder="List any past warnings, restrictions, or important details..."
                      value={formData.warningHistory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warningHistory: e.target.value,
                        })
                      }
                      className="w-full p-4 rounded-xl bg-[#111] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 resize-none custom-scrollbar"
                    />
                  </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                      Screenshot Proof (Must contain "d32.store")
                    </label>
                    <div className="relative" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                      <input
                        type="file"
                        accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.heic,.heif,.svg,.bmp,.tiff,.avif,.jfif,.pjpeg,.pjp"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={formData.screenshots.length >= 4}
                      />
                      <div
                        className={`w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-colors ${
                          formData.screenshots.length > 0
                            ? "border-zinc-500/50 bg-white/5"
                            : "border-white/10 bg-[#111] hover:border-white/20"
                        }`}
                      >
                        <Camera
                          className={`w-8 h-8 mb-2 ${formData.screenshots.length > 0 ? "text-zinc-400" : "text-zinc-600"}`}
                        />
                        {formData.screenshots.length > 0 ? (
                          <div className="text-white font-medium">
                            {formData.screenshots.length}/4 Images Selected.
                            Paste, drag, or click to add more.
                          </div>
                        ) : (
                          <>
                            <div className="text-white font-medium mb-1">
                              Click, drag, or paste images to upload screenshots (max 4)
                            </div>
                            <div className="text-xs text-zinc-500">
                              Supports all image formats (PNG, JPG, WEBP, GIF, HEIC, AVIF, BMP, SVG)
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {formData.screenshots.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {formData.screenshots.map((file, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-xl overflow-hidden bg-[#111] border border-white/10 aspect-square group"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/60 text-[10px] text-zinc-300 truncate font-medium">
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {scanError && (
                      <p className="mt-2 text-sm text-red-500 flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {scanError}
                      </p>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/5 bg-[#080808] shrink-0">
                <button
                  form="sellForm"
                  type="submit"
                  disabled={mockScanning}
                  className="w-full py-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {mockScanning
                    ? "Scanning screenshot with OCR..."
                    : "Submit Validation"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
