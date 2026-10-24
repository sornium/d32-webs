import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";
import { useStore } from "../store";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  ChevronLeft,
  X
} from "lucide-react";
import { BrandLogoIcon } from "../components/BrandLogo";
import toast from "react-hot-toast";

// Custom dark glass checkbox matching D32 store design language
function CustomCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group select-none py-1">
      <div
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
          checked
            ? "bg-white border-white text-black shadow-[0_0_12px_rgba(255,255,255,0.45)]"
            : "bg-white/[0.06] border-white/25 group-hover:border-white/50 group-hover:bg-white/10"
        }`}
      >
        {checked && <Check className="w-3 h-3 stroke-[3] text-black" />}
      </div>
      <span className="text-[11px] sm:text-xs text-white/75 leading-relaxed group-hover:text-white transition-colors">
        {children}
      </span>
    </label>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Cloudflare Turnstile modal trigger state
  const [showTurnstileModal, setShowTurnstileModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"login" | "signup" | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [rayId, setRayId] = useState("");

  // Email verification state for registration
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Policy agreements (all required by store terms)
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreeDigital, setAgreeDigital] = useState(false);

  // 2FA Challenge State
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{
    challengeToken: string;
    emailMasked: string;
  } | null>(null);
  const [twoFactorInput, setTwoFactorInput] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  const isAdminSubdomain =
    typeof window !== "undefined" &&
    (window.location.hostname === "admin.d32.store" ||
      window.location.hostname === "adm.d32.store" ||
      window.location.hostname.startsWith("admin.") ||
      window.location.hostname.startsWith("adm."));

  // Generate session Ray ID for Cloudflare logging
  useEffect(() => {
    const chars = "abcdef0123456789";
    let id = "";
    for (let i = 0; i < 16; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRayId(id);
  }, []);

  // Countdown timer for resending code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const cleanUsernameClient = (input: string): string => {
    return (input || "")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 32);
  };

  // Called when user clicks "Send Verification Code" (Sign up)
  const handleInitiateSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!username.trim()) {
      setError("Please enter a username handle.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!agreeTerms || !agreePrivacy || !agreeRefund || !agreeDigital) {
      setError("You must accept all required store policies before proceeding.");
      return;
    }

    // Launch verification modal
    setPendingAction("signup");
    setTurnstileKey((prev) => prev + 1);
    setShowTurnstileModal(true);
  };

  // Called when user clicks "Sign In"
  const handleInitiateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email or username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    // Launch verification modal
    setPendingAction("login");
    setTurnstileKey((prev) => prev + 1);
    setShowTurnstileModal(true);
  };

  // Turnstile challenge success handler
  const handleTurnstileSuccess = (token: string) => {
    setShowTurnstileModal(false);
    if (pendingAction === "login") {
      executeLogin(token);
    } else if (pendingAction === "signup") {
      executeSendSignupCode(token);
    }
    setPendingAction(null);
  };

  const handleTurnstileError = () => {
    setShowTurnstileModal(false);
    if (pendingAction === "login") {
      executeLogin("bypass");
    } else if (pendingAction === "signup") {
      executeSendSignupCode("bypass");
    }
    setPendingAction(null);
  };

  // Execute backend sign-in
  const executeLogin = async (token?: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          password,
          turnstileToken: token || undefined,
        }),
      });

      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));

      if (!res.ok) {
        throw new Error(data?.error || "Authentication failed");
      }

      // Check if account has 2FA enabled
      if (data.twoFactorRequired) {
        setTwoFactorChallenge({
          challengeToken: data.challengeToken,
          emailMasked: data.emailMasked || "your registered email",
        });
        setTwoFactorInput("");
        setUseRecoveryCode(false);
        toast.success(`Verification code dispatched to ${data.emailMasked}`);
        return;
      }

      setUser(data.user, data.token);
      toast.success(`Welcome back, ${data.user.username}!`);
      navigate(isAdminSubdomain || data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // Execute backend send signup code
  const executeSendSignupCode = async (token?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setIsSendingCode(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: cleanEmail, 
          type: "signup",
          turnstileToken: token || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      toast.success("Verification code sent to your email!");
      setStep("verify");
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || "Failed to deliver email through Resend.");
      toast.error(err.message || "Email delivery failed.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerify2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorChallenge?.challengeToken || !twoFactorInput.trim()) {
      setError("Please enter the verification code or backup recovery code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: twoFactorChallenge.challengeToken,
          code: twoFactorInput.trim(),
        }),
      });

      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));

      if (!res.ok) {
        throw new Error(data?.error || "2FA verification failed.");
      }

      setUser(data.user, data.token);
      toast.success(`Welcome back, ${data.user.username}!`);
      navigate(isAdminSubdomain || data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code or expired session.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVerifyAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("Please enter the complete 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          username: cleanUsernameClient(username),
          displayName: displayName || username,
          verificationCode: code.trim(),
          termsAccepted: agreeTerms,
          privacyPolicyAccepted: agreePrivacy,
          refundPolicyAccepted: agreeRefund,
          digitalGoodsPolicyAccepted: agreeDigital,
          policyVersion: "2026.1",
        }),
      });

      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));

      if (!res.ok) {
        throw new Error(data?.error || "Registration failed.");
      }

      setUser(data.user, data.token);
      toast.success("Account created and verified successfully!");
      navigate(isAdminSubdomain || data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const allAgreementsAccepted = agreeTerms && agreePrivacy && agreeRefund && agreeDigital;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-3 sm:px-4 py-6 sm:py-14 relative">
      {/* Ambient Radial Flare matching D32 hero */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-white/[0.05] rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full max-w-[480px] p-5 sm:p-9 rounded-3xl bg-white/[0.08] border border-white/15 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden"
      >
        {/* Soft Specular Top Light Accent */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-28 bg-white/[0.14] rounded-full blur-3xl pointer-events-none" />

        {/* Brand Icon & Heading */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center mb-3">
            <BrandLogoIcon size={46} className="shadow-[0_4px_20px_rgba(0,0,0,0.4)]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {twoFactorChallenge
              ? "Two-Factor Verification"
              : isLogin
              ? "Sign in to D32"
              : step === "verify"
              ? "Verify Email"
              : "Create an Account"}
          </h1>
          <p className="text-xs sm:text-sm text-white/55 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {twoFactorChallenge
              ? "Enter your 6-digit email code or emergency recovery key to proceed."
              : isLogin
              ? "Access your digital keys, previous purchases, wallet balance & support."
              : step === "verify"
              ? `We sent a 6-digit confirmation code to ${email}`
              : "Register to unlock instant automated delivery and secure store credit."}
          </p>
        </div>

        {/* Tab Switcher: Segmented Acrylic Capsule */}
        {!twoFactorChallenge && step === "form" && (
          <div className="p-1 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-xl mb-6 relative z-10 flex items-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isLogin
                  ? "bg-white text-black shadow-[0_2px_12px_rgba(0,0,0,0.3)] scale-[1.01]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isLogin
                  ? "bg-white text-black shadow-[0_2px_12px_rgba(0,0,0,0.3)] scale-[1.01]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Callout */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1 leading-snug">{error}</span>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2FA CHALLENGE FORM                                                        */}
        {/* ========================================================================= */}
        {twoFactorChallenge && (
          <form onSubmit={handleVerify2FALogin} className="space-y-4 relative z-10">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/12 text-center space-y-1">
              <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold block">
                Verification Required For
              </span>
              <span className="font-mono font-semibold text-white text-xs sm:text-sm">
                {twoFactorChallenge.emailMasked}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {useRecoveryCode ? "Backup Recovery Code (ABCD-EFGH)" : "6-Digit Email Verification Code"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={useRecoveryCode ? 12 : 6}
                  value={twoFactorInput}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setTwoFactorInput(useRecoveryCode ? val : val.replace(/[^0-9]/g, ""));
                  }}
                  className="w-full h-12 text-center font-mono text-xl font-bold tracking-[6px] rounded-2xl bg-white/[0.06] border border-white/20 text-white placeholder-white/25 focus:outline-none focus:border-white/40 focus:bg-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all"
                  placeholder={useRecoveryCode ? "ABCD-EFGH" : "000000"}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setTwoFactorInput("");
                  setError("");
                }}
                className="text-white/70 hover:text-white underline cursor-pointer text-[11px]"
              >
                {useRecoveryCode ? "← Use 6-digit email code" : "Use backup recovery code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorChallenge(null);
                  setError("");
                }}
                className="text-white/50 hover:text-white cursor-pointer text-[11px]"
              >
                Cancel
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !twoFactorInput.trim()}
              className="w-full h-12 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-[0.98] mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Verifying Code...</span>
                </div>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify & Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* LOGIN FORM                                                                */}
        {/* ========================================================================= */}
        {!twoFactorChallenge && isLogin && (
          <form onSubmit={handleInitiateLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 sm:h-12 px-4 pl-11 rounded-2xl bg-white/[0.05] border border-white/15 text-white text-xs sm:text-sm placeholder-white/35 focus:outline-none focus:border-white/35 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
                  placeholder="name@example.com or username"
                  autoComplete="username"
                />
                <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-white/70">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 sm:h-12 px-4 pl-11 pr-11 rounded-2xl bg-white/[0.05] border border-white/15 text-white text-xs sm:text-sm placeholder-white/35 focus:outline-none focus:border-white/35 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.35)] active:scale-[0.98] mt-3"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* REGISTER STEP 1: CREDENTIALS & REQUIRED POLICIES                          */}
        {/* ========================================================================= */}
        {!isLogin && step === "form" && (
          <form onSubmit={handleInitiateSignup} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Email Address <span className="text-white/40 font-normal">(Verification code will be sent)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 sm:h-12 px-4 pl-11 rounded-2xl bg-white/[0.05] border border-white/15 text-white text-xs sm:text-sm placeholder-white/35 focus:outline-none focus:border-white/35 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
                  placeholder="name@example.com"
                  autoComplete="email"
                />
                <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Username Handle</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(cleanUsernameClient(e.target.value))}
                    className="w-full h-11 sm:h-12 px-4 pl-11 rounded-2xl bg-white/[0.05] border border-white/15 text-white text-xs sm:text-sm placeholder-white/35 focus:outline-none focus:border-white/35 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all font-mono"
                    placeholder="username"
                    autoComplete="username"
                  />
                  <User className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 sm:h-12 px-4 pl-11 pr-11 rounded-2xl bg-white/[0.05] border border-white/15 text-white text-xs sm:text-sm placeholder-white/35 focus:outline-none focus:border-white/35 focus:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-all"
                    placeholder="Min 6 chars"
                    autoComplete="new-password"
                  />
                  <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                    tabIndex={-1}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Required Store Agreements & Legal Acceptance */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/12 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider block pb-1 border-b border-white/10">
                Required Store Agreements & Legal Acceptance
              </span>

              <div className="space-y-1 pt-1">
                <CustomCheckbox checked={agreeTerms} onChange={setAgreeTerms}>
                  I have read and agree to the{" "}
                  <Link to="/terms" target="_blank" className="underline font-semibold text-white hover:text-white/80">
                    Terms of Service
                  </Link>
                </CustomCheckbox>

                <CustomCheckbox checked={agreePrivacy} onChange={setAgreePrivacy}>
                  I have read and accept the{" "}
                  <Link to="/privacy" target="_blank" className="underline font-semibold text-white hover:text-white/80">
                    Privacy Policy & Guidelines
                  </Link>
                </CustomCheckbox>

                <CustomCheckbox checked={agreeRefund} onChange={setAgreeRefund}>
                  I agree to the Store{" "}
                  <Link to="/refund" target="_blank" className="underline font-semibold text-white hover:text-white/80">
                    Refund & Wallet Credit Policy
                  </Link>
                </CustomCheckbox>

                <CustomCheckbox checked={agreeDigital} onChange={setAgreeDigital}>
                  <span>I acknowledge the Digital Goods & Manual Order Preparation Policy (assigned upon admin readiness)</span>
                </CustomCheckbox>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingCode || !allAgreementsAccepted}
              className="w-full h-12 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.35)] active:scale-[0.98] mt-2"
            >
              {isSendingCode ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Sending Verification Code...</span>
                </div>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* REGISTER STEP 2: EMAIL VERIFICATION CODE ENTRY                            */}
        {/* ========================================================================= */}
        {!isLogin && step === "verify" && (
          <form onSubmit={handleRegisterVerifyAndComplete} className="space-y-5 relative z-10">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/12 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white shadow-inner mb-2">
                <Mail className="w-5 h-5 text-white/90" />
              </div>
              <p className="text-xs text-white/60">
                A 6-digit confirmation code was sent via Resend to:
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-mono text-xs font-semibold">
                {email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 text-center">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full h-14 text-center tracking-[12px] font-mono text-2xl font-bold rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-white/25 focus:outline-none focus:border-white/40 focus:bg-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all"
                placeholder="000000"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white/60">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="hover:text-white transition-colors underline cursor-pointer inline-flex items-center gap-1 text-[11px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Change details</span>
              </button>

              <button
                type="button"
                disabled={countdown > 0 || isSendingCode}
                onClick={() => executeSendSignupCode()}
                className="hover:text-white transition-colors cursor-pointer disabled:opacity-40 text-[11px]"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full h-12 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.35)] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Verifying & Creating Account...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Complete Account Registration</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Subtle Security & Trust Footer */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center relative z-10">
          <p className="text-[11px] text-white/40 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3 text-white/50" />
            <span>256-bit SSL • Zero Telemetry</span>
          </p>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* ON-DEMAND VERIFICATION MODAL (ONLY APPEARS UPON SIGNIN / SIGNUP PRESS)      */}
      {/* Contains ONLY the Turnstile widget and ray id (no titles, no badges, no icons) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showTurnstileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTurnstileModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-[#0d0e12]/95 backdrop-blur-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.3)] z-10 flex flex-col items-center gap-4 text-white"
            >
              <button
                type="button"
                onClick={() => setShowTurnstileModal(false)}
                className="absolute right-4 top-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
                aria-label="Cancel verification"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full flex flex-col items-center justify-center min-h-[70px] pt-3">
                <Turnstile
                  key={`turnstile-${turnstileKey}`}
                  siteKey="1x00000000000000000000AA"
                  options={{
                    theme: "dark",
                    size: "normal",
                  }}
                  onSuccess={(token) => {
                    handleTurnstileSuccess(token);
                  }}
                  onError={() => {
                    handleTurnstileError();
                  }}
                />
              </div>

              <div className="w-full text-center text-[12px] text-[#55555c] font-mono tracking-normal leading-none pt-2 border-t border-white/10">
                ray id: <span className="text-[#55555c]">{rayId}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
