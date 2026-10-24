/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "./store";
import { applyDocumentLanguage } from "./lib/i18n";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ParticleBackground from "./components/ParticleBackground";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ProxyMarket from "./pages/ProxyMarket";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Store from "./pages/Store";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import ErrorPage from "./pages/ErrorPage";
import Reviews from "./pages/Reviews";
import OrderSuccess from "./pages/OrderSuccess";
import TermsOfService from "./pages/TermsOfService";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import SafetyPolicies from "./pages/SafetyPolicies";
import PaymentMethods from "./pages/PaymentMethods";
import FAQ from "./pages/FAQ";
import ProtectedRoute from "./components/ProtectedRoute";

import { AlertTriangle, ExternalLink } from "lucide-react";

function PageTween({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex flex-col flex-grow"
    >
      {children}
    </motion.div>
  );
}

function AppContent() {
  const location = useLocation();
  const language = useStore((state) => state.language);
  const isDbConfigured = useStore((state) => state.isDbConfigured);
  const isDbConnected = useStore((state) => state.isDbConnected);
  const setIsDbConfigured = useStore((state) => state.setIsDbConfigured);
  const setIsDbConnected = useStore((state) => state.setIsDbConnected);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAdminSubdomain = 
    typeof window !== "undefined" && 
    (window.location.hostname === "admin.d32.store" || 
     window.location.hostname === "adm.d32.store" || 
     window.location.hostname.startsWith("admin.") || 
     window.location.hostname.startsWith("adm."));

  useEffect(() => {
    fetch("/api/db-status")
      .then((res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        if (!data) return;
        if (typeof data.configured === "boolean") {
          setIsDbConfigured(data.configured);
        }
        if (typeof data.connected === "boolean") {
          setIsDbConnected(data.connected);
        }
      })
      .catch((err) => {
        console.error("Error checking database status:", err);
      });
  }, [setIsDbConfigured, setIsDbConnected]);

  // Persistent session verification with backend
  useEffect(() => {
    if (!user?.id) return;
    const currentToken = useStore.getState().token;
    fetch(`/api/auth/me`, {
      headers: {
        "x-user-id": user.id,
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
    })
      .then((res) => {
        if (res.status === 403) {
          // Explicitly banned
          setUser(null, null);
        } else if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setUser({ ...user, ...data.user }, currentToken);
        }
      })
      .catch((err) => {
        // Network hiccup - preserve existing session
        console.warn("Session ping error:", err);
      });
  }, [user?.id]);

  const getRouteKey = (pathname: string) => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/account")) {
      return pathname.split("/")[1];
    }
    return pathname;
  };

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 font-sans selection:bg-white/20 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Pure Ambient Dark Neutral Background Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Subtle geometric grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70" />
        
        {/* Top ambient glow matching topbar */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1000px] h-[550px] bg-gradient-to-b from-white/10 via-white/5 to-transparent blur-[100px] rounded-full pointer-events-none" />
        
        {/* Mid-left celestial accent */}
        <div className="absolute top-[35%] -left-48 w-[600px] h-[600px] bg-white/[0.04] blur-[130px] rounded-full pointer-events-none" />
        
        {/* Mid-right ambient glow */}
        <div className="absolute top-[60%] -right-48 w-[600px] h-[600px] bg-white/[0.04] blur-[130px] rounded-full pointer-events-none" />
        
        {/* Bottom subtle glow */}
        <div className="absolute -bottom-48 left-1/3 w-[700px] h-[500px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />

        {/* Dynamic Interactive Moving Particles */}
        <ParticleBackground />
      </div>

      {/* Database Disconnect Banner */}
      {isDbConfigured && !isDbConnected && showBanner && !location.pathname.startsWith("/admin") && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-3 text-sm text-zinc-300 relative z-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5 md:mt-0" />
              <span>
                <strong className="text-white">PostgreSQL Connection Offline:</strong> Unable to connect to Neon PostgreSQL. Please check your connection string or settings.
              </span>
            </div>
            <div className="flex items-center gap-4 self-stretch md:self-auto justify-end">
              <a
                href="https://console.neon.tech"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Fix in Neon Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button 
                onClick={() => setShowBanner(false)}
                className="text-zinc-500 hover:text-white transition-colors text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-grow w-full flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={getRouteKey(location.pathname)}>
            <Route path="/" element={<PageTween>{isAdminSubdomain ? <ProtectedRoute adminOnly><Admin /></ProtectedRoute> : <Home />}</PageTween>} />
            <Route path="/auth" element={<PageTween><Auth /></PageTween>} />
            <Route path="/proxy" element={<PageTween><ProxyMarket /></PageTween>} />
            <Route path="/store" element={<PageTween><Store /></PageTween>} />
            <Route path="/store/:id" element={<PageTween><Product /></PageTween>} />
            <Route path="/cart" element={<PageTween><Cart /></PageTween>} />
            <Route path="/order-success" element={<PageTween><OrderSuccess /></PageTween>} />
            <Route path="/order/success" element={<PageTween><OrderSuccess /></PageTween>} />
            <Route path="/orders/success" element={<PageTween><OrderSuccess /></PageTween>} />
            <Route path="/order" element={<PageTween><OrderSuccess /></PageTween>} />
            <Route path="/reviews" element={<PageTween><Reviews /></PageTween>} />
            <Route path="/terms" element={<PageTween><TermsOfService /></PageTween>} />
            <Route path="/Terms" element={<PageTween><TermsOfService /></PageTween>} />
            <Route path="/Terms-of-service" element={<PageTween><TermsOfService /></PageTween>} />
            <Route path="/terms-of-service" element={<PageTween><TermsOfService /></PageTween>} />
            <Route path="/tos" element={<PageTween><TermsOfService /></PageTween>} />
            <Route path="/warranty" element={<PageTween><TermsOfService /></PageTween>} />
            <Route path="/community-guidelines" element={<PageTween><CommunityGuidelines /></PageTween>} />
            <Route path="/Community-guidelines" element={<PageTween><CommunityGuidelines /></PageTween>} />
            <Route path="/guidelines" element={<PageTween><CommunityGuidelines /></PageTween>} />
            <Route path="/safety-policies" element={<PageTween><SafetyPolicies /></PageTween>} />
            <Route path="/Safety-policies" element={<PageTween><SafetyPolicies /></PageTween>} />
            <Route path="/safety" element={<PageTween><SafetyPolicies /></PageTween>} />
            <Route path="/privacy" element={<PageTween><SafetyPolicies /></PageTween>} />
            <Route path="/privacy-policy" element={<PageTween><SafetyPolicies /></PageTween>} />
            <Route path="/refund" element={<PageTween><FAQ /></PageTween>} />
            <Route path="/refund-policy" element={<PageTween><FAQ /></PageTween>} />
            <Route path="/transparency" element={<PageTween><SafetyPolicies /></PageTween>} />
            <Route path="/payment-methods" element={<PageTween><PaymentMethods /></PageTween>} />
            <Route path="/Payment-methods" element={<PageTween><PaymentMethods /></PageTween>} />
            <Route path="/paymentmethods" element={<PageTween><PaymentMethods /></PageTween>} />
            <Route path="/payments" element={<PageTween><PaymentMethods /></PageTween>} />
            <Route path="/faq" element={<PageTween><FAQ /></PageTween>} />
            <Route path="/FAQ" element={<PageTween><FAQ /></PageTween>} />
            <Route path="/admin" element={<PageTween><ProtectedRoute adminOnly><Admin /></ProtectedRoute></PageTween>} />
            <Route path="/admin/*" element={<PageTween><ProtectedRoute adminOnly><Admin /></ProtectedRoute></PageTween>} />
            <Route path="/dashboard/*" element={<PageTween><ProtectedRoute><Dashboard /></ProtectedRoute></PageTween>} />
            <Route path="/account" element={<PageTween><ProtectedRoute><Dashboard /></ProtectedRoute></PageTween>} />
            <Route path="/account/*" element={<PageTween><ProtectedRoute><Dashboard /></ProtectedRoute></PageTween>} />
            <Route path="/error" element={<PageTween><ErrorPage /></PageTween>} />
            <Route path="*" element={<PageTween>{isAdminSubdomain ? <ProtectedRoute adminOnly><Admin /></ProtectedRoute> : <ErrorPage code={404} />}</PageTween>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const { language } = useStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rayId, setRayId] = useState("");

  useEffect(() => {
    // Generate an in-memory ray ID for the session
    const chars = "abcdef0123456789";
    let id = "";
    for (let i = 0; i < 16; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRayId(id);
  }, []);

  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  useEffect(() => {
    // Backup timer to ensure user can always access if Turnstile has trouble loading
    const backupTimer = setTimeout(() => {
      setIsSuccess(true);
      const accessTimer = setTimeout(() => {
        setIsVerifying(false);
      }, 1000);
      return () => clearTimeout(accessTimer);
    }, 12000);
    return () => clearTimeout(backupTimer);
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center text-white px-4 relative overflow-hidden select-none">
        {/* Dotted grid background pattern matching the design style */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

        <div className="max-w-[420px] w-full flex flex-col items-center gap-5 relative z-10">
          {/* Logo Brand Header */}
          <div className="flex items-center mb-2">
            <span className="text-3xl font-bold tracking-tight text-white font-sans">
              d32.store
            </span>
          </div>

          {/* Verification Card */}
          <div className="w-full bg-[#131316] border border-[#222227] rounded-[18px] p-8 shadow-[0_12px_45px_rgba(0,0,0,0.85)] flex flex-col gap-6">
            
            {/* Header section with vertical neutral pill */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-4.5 bg-zinc-400 rounded-full" />
                <h2 className="text-[17px] font-semibold text-white tracking-tight font-sans">
                  security check
                </h2>
              </div>
              <p className="text-[13px] text-[#81818d] font-normal pl-3 font-sans leading-none">
                verification required to continue
              </p>
            </div>

            <div className="w-full h-px bg-[#1f1f24]" />

            {/* Turnstile / Success message container */}
            <div className="flex flex-col items-center justify-center min-h-[96px] w-full py-1">
              {isSuccess ? (
                <div className="text-[15px] font-medium text-white text-center font-sans tracking-wide leading-relaxed px-2 animate-pulse">
                  Verification successful. Waiting for d32.store to respond
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full min-h-[65px]">
                  <Turnstile
                    siteKey="1x00000000000000000000AA"
                    options={{
                      theme: "dark",
                      size: "normal",
                    }}
                    onSuccess={(token) => {
                      setIsSuccess(true);
                      setTimeout(() => {
                        setIsVerifying(false);
                      }, 1200);
                    }}
                    onError={() => {
                      // Graceful automatic verification bypass if Turnstile fails to load
                      setIsSuccess(true);
                      setTimeout(() => {
                        setIsVerifying(false);
                      }, 1500);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="w-full h-px bg-[#1f1f24]" />

            {/* Footer with Ray ID */}
            <div className="text-[12px] text-[#55555c] font-mono tracking-normal leading-none text-left">
              ray id: <span className="text-[#55555c]">{rayId}</span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />
      <AppContent />
    </Router>
  );
}
