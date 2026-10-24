import React, { useState } from "react";
import { 
  User as UserIcon, 
  Key, 
  Mail, 
  Lock, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Globe,
  QrCode,
  X,
  Copy,
  Download,
  Shield,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useStore } from "../../store";
import { useTranslation } from "../../lib/i18n";
import toast from "react-hot-toast";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
];

const RESERVED_WORDS = [
  "admin", "administrator", "root", "system", "moderator", "mod",
  "support", "official", "help", "d32", "d32store", "prime", "billing",
  "security", "staff", "owner", "founder"
];

export default function AccountProfileSettings() {
  const { user, setUser, token } = useStore();
  const { t } = useTranslation();

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [customAvatar, setCustomAvatar] = useState(user?.image || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form States
  const [currentEmail] = useState(user?.email || "");
  const [showEmail, setShowEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  // Real 2FA State & Modals
  const [is2FAEnabled, setIs2FAEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<"request" | "verify" | "recovery_codes">("request");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isSending2FA, setIsSending2FA] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  if (!user) return null;

  const cleanUsername = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 32);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(cleanUsername(e.target.value));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (RESERVED_WORDS.includes(username.toLowerCase())) {
      toast.error("This username contains reserved terms and cannot be used.");
      return;
    }

    if (/\.(com|net|org|io|gg|store|xyz)$/i.test(username)) {
      toast.error("Usernames cannot end in top-level domain extensions.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newUsername: username.trim(),
          displayName: displayName.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser({
        ...user,
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        image: customAvatar || user.image
      }, token);

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile changes");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingSecurity(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update security credentials");
      }

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  // 2FA Enable Handlers
  const handleStartEnable2FA = async () => {
    setShow2FAModal(true);
    setTwoFactorStep("request");
    setTwoFactorCode("");
    setRecoveryCodes([]);
  };

  const handleRequest2FACode = async () => {
    setIsSending2FA(true);
    try {
      const currentToken = useStore.getState().token;
      const res = await fetch("/api/auth/2fa/request-enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch verification email.");
      }

      toast.success(data.message || "Verification code dispatched to your email via Resend!");
      setTwoFactorStep("verify");
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setIsSending2FA(false);
    }
  };

  const handleVerifyAndActivate2FA = async () => {
    if (twoFactorCode.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifying2FA(true);
    try {
      const currentToken = useStore.getState().token;
      const res = await fetch("/api/auth/2fa/confirm-enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({ code: twoFactorCode.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Verification failed. Please check the code.");
      }

      setIs2FAEnabled(true);
      setUser({ ...user, twoFactorEnabled: true }, token);
      setRecoveryCodes(Array.isArray(data.recoveryCodes) ? data.recoveryCodes : []);
      setTwoFactorStep("recovery_codes");
      toast.success("Two-Factor Authentication is now active on your account!");
    } catch (err: any) {
      toast.error(err.message || "Failed to activate 2FA.");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    const text = `D32 STORE 2FA BACKUP RECOVERY CODES
Account: ${user.username} (${user.email})
Generated: ${new Date().toISOString()}

Save these codes in a secure offline location. Each code can be used once to access your account if you lose access to your email.

${recoveryCodes.join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    toast.success("Recovery codes copied to clipboard!");
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    const text = `D32 STORE 2FA BACKUP RECOVERY CODES\nAccount: ${user.username} (${user.email})\nGenerated: ${new Date().toISOString()}\n\nEach code can be used once:\n\n${recoveryCodes.join("\n")}\n`;
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `d32-store-2fa-recovery-codes-${user.username}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Recovery codes downloaded (.txt)!");
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      toast.error("Please enter your account password to disable 2FA.");
      return;
    }

    setIsDisabling2FA(true);
    try {
      const currentToken = useStore.getState().token;
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Incorrect password.");
      }

      setIs2FAEnabled(false);
      setUser({ ...user, twoFactorEnabled: false }, token);
      setShowDisable2FAModal(false);
      setDisablePassword("");
      toast.success("Two-Factor Authentication has been disabled.");
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA.");
    } finally {
      setIsDisabling2FA(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Details Container (Styled like Topbar) */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] p-6 sm:p-7 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-24 bg-white/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {t("Profile Settings", "Profile Settings")}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              {t("Manage your display name, username handle, and avatar icon.", "Manage your display name, username handle, and avatar icon.")}
            </p>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
            <UserIcon className="w-4 h-4" />
          </span>
        </div>

        {/* Avatar Presets / Custom URL */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-white/70 mb-2.5">
            {t("Profile Avatar", "Profile Avatar")}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {AVATAR_PRESETS.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCustomAvatar(url)}
                className={`relative w-11 h-11 rounded-full overflow-hidden border transition-all cursor-pointer ${
                  customAvatar === url 
                    ? "border-white scale-105 shadow-[0_0_14px_rgba(255,255,255,0.4)]" 
                    : "border-white/20 opacity-70 hover:opacity-100 hover:border-white/40"
                }`}
              >
                <img src={url} alt="Preset" className="w-full h-full object-cover" />
                {customAvatar === url && (
                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                )}
              </button>
            ))}

            <div className="flex-1 min-w-[200px]">
              <input
                type="url"
                placeholder={t("Or paste avatar URL (https://...)", "Or paste avatar URL (https://...)")}
                value={customAvatar}
                onChange={(e) => setCustomAvatar(e.target.value)}
                className="w-full h-9 px-4 rounded-full bg-white/[0.05] border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Profile Inputs */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {t("Display Name", "Display Name")}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                placeholder="Your Public Name"
                className="w-full h-9 px-4 rounded-full bg-white/[0.05] border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {t("Username Handle", "Username Handle")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  maxLength={32}
                  placeholder="username"
                  className="w-full h-9 pl-8 pr-4 rounded-full bg-white/[0.05] border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex h-9 px-5 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white text-black font-semibold text-xs shadow-sm hover:bg-white/90 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{t("Save Profile", "Save Profile")}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Account Email & Password Security (Styled like Topbar) */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] p-6 sm:p-7 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-24 bg-white/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {t("Security & Credentials", "Security & Credentials")}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              {t("Change your login password and review two-factor protection.", "Change your login password and review two-factor protection.")}
            </p>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
            <Lock className="w-4 h-4" />
          </span>
        </div>

        {/* Current Email Badge with Show/Hide Toggle */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/12 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
              <Mail className="w-4 h-4 text-white/70" />
            </div>
            <div>
              <span className="text-[10px] text-white/40 block font-semibold uppercase tracking-wider">
                {t("Registered Email", "Registered Email")}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-white font-mono">
                  {showEmail ? currentEmail : (currentEmail ? currentEmail.replace(/(.{2})(.*)(@.*)/, "$1••••••$3") : "••••••••••••")}
                </span>
                <button
                  type="button"
                  onClick={() => setShowEmail(!showEmail)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
                  title={showEmail ? "Hide email address" : "Reveal email address"}
                >
                  {showEmail ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showEmail ? t("Hide", "Hide") : t("Show", "Show")}</span>
                </button>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold w-fit">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t("Verified", "Verified")}</span>
          </span>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-white/70">
                  {t("New Password", "New Password")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? t("Hide", "Hide") : t("Show", "Show")}</span>
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-9 px-4 rounded-full bg-white/[0.05] border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {t("Confirm Password", "Confirm Password")}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full h-9 px-4 rounded-full bg-white/[0.05] border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingSecurity || !newPassword}
              className="inline-flex h-9 px-5 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 hover:border-white/30 hover:bg-white/15 text-white font-semibold text-xs shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)] transition-all cursor-pointer disabled:opacity-40"
            >
              {isUpdatingSecurity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{t("Update Password", "Update Password")}</span>
            </button>
          </div>
        </form>

        {/* Two-Factor Authentication Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-emerald-400 shrink-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">{t("Two-Factor Authentication", "Two-Factor Authentication")}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  is2FAEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"
                }`}>
                  {is2FAEnabled ? t("Active", "Active") : t("Disabled", "Disabled")}
                </span>
              </div>
              <p className="text-[11px] text-white/40 mt-0.5">
                {t("Protects your account with a secure email verification code or single-use recovery code on login.", "Protects your account with a secure email verification code or single-use recovery code on login.")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (is2FAEnabled) {
                setShowDisable2FAModal(true);
              } else {
                handleStartEnable2FA();
              }
            }}
            className={`inline-flex h-9 px-4 items-center justify-center rounded-full border border-white/15 text-xs font-medium transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)] ${
              is2FAEnabled
                ? "bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300"
                : "bg-white/10 hover:border-white/30 hover:bg-white/15 text-white"
            }`}
          >
            {is2FAEnabled ? t("Disable 2FA", "Disable 2FA") : t("Enable 2FA", "Enable 2FA")}
          </button>
        </div>
      </div>

      {/* Real 2FA Enable Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-[#0a0a0d]/95 backdrop-blur-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.35)]">
            <button
              type="button"
              onClick={() => setShow2FAModal(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {twoFactorStep === "request" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border border-white/20 bg-white/10 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Enable Two-Factor Authentication</h3>
                  <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                    We will send a 6-digit verification code to your registered email to verify your identity before enabling Two-Factor Authentication.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                  <span className="text-[11px] text-white/50 block font-medium">Registered Verification Email:</span>
                  <span className="text-xs font-semibold text-white font-mono mt-0.5 block">
                    {currentEmail ? currentEmail.replace(/(.{2})(.*)(@.*)/, "$1••••••$3") : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRequest2FACode}
                  disabled={isSending2FA}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSending2FA ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Code via Resend...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </div>
            )}

            {twoFactorStep === "verify" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border border-white/20 bg-white/10 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Enter 6-Digit Code</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Check your inbox for the code sent to{" "}
                    <span className="font-semibold text-white">{currentEmail ? currentEmail.replace(/(.{2})(.*)(@.*)/, "$1••••••$3") : ""}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="000000"
                    className="w-full h-12 text-center font-mono text-xl tracking-[8px] font-bold rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                  />

                  <div className="flex justify-between items-center text-[11px] text-white/50">
                    <span>Didn't receive the email?</span>
                    <button
                      type="button"
                      onClick={handleRequest2FACode}
                      disabled={isSending2FA}
                      className="underline text-white/80 hover:text-white cursor-pointer"
                    >
                      {isSending2FA ? "Resending..." : "Resend Code"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyAndActivate2FA}
                    disabled={isVerifying2FA || twoFactorCode.length !== 6}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isVerifying2FA ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Activating 2FA...</span>
                      </>
                    ) : (
                      <span>Confirm & Activate 2FA</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {twoFactorStep === "recovery_codes" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">2FA Activated! Save Recovery Codes</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Store these single-use recovery codes in a safe place. Each code can be used once to access your account if you ever lose email access.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 font-mono text-xs text-center text-white/90">
                  {recoveryCodes.map((code, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white/[0.04] border border-white/10 tracking-wider">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyRecoveryCodes}
                    className="h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodes ? "Copied!" : "Copy Codes"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadRecoveryCodes}
                    className="h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.txt)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="w-full h-11 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 transition-all cursor-pointer shadow-md"
                >
                  I Have Saved My Recovery Codes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisable2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-[#0a0a0d]/95 backdrop-blur-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.35)]">
            <button
              type="button"
              onClick={() => {
                setShowDisable2FAModal(false);
                setDisablePassword("");
              }}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border border-rose-500/30 bg-rose-500/15 flex items-center justify-center mx-auto mb-3 text-rose-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Disable Two-Factor Authentication</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Enter your current account password to confirm disabling Two-Factor Authentication.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Account Password
                </label>
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-10 px-4 rounded-full bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/35"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisable2FAModal(false);
                    setDisablePassword("");
                  }}
                  className="h-10 rounded-full border border-white/15 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisabling2FA || !disablePassword}
                  className="h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isDisabling2FA ? "Disabling..." : "Confirm Disable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
