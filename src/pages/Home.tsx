import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeftRight, 
  Store, 
  Shield, 
  Clock, 
  Headphones, 
  Star, 
  Zap, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  CreditCard, 
  Globe 
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';

export default function Home() {
  const { t } = useTranslation();

  const quickCategories = [
    { name: 'KYC Verified Accounts', path: '/store?brand=KYC', icon: ShieldCheck, badge: 'High Demand' },
    { name: 'Clean Residential Proxies', path: '/proxy', icon: Globe, badge: 'Instant Ping' },
    { name: 'Aged Discord & Nitro', path: '/store?brand=Discord', icon: Sparkles, badge: 'Hot Deals' },
    { name: 'Digital Gaming Keys', path: '/store?brand=Rockstar', icon: Zap, badge: 'Instant Key' },
  ];

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-6 md:pt-24 md:pb-10 flex flex-col items-center text-center">
        {/* Subtle Ambient Radial Light Flare */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/[0.06] rounded-full blur-3xl pointer-events-none -z-10" />

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-5 leading-[1.1] max-w-4xl"
        >
          Usernames, Tools & More —{" "}
          <span className="text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]">
            Simple & Secure
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-[12px] font-medium tracking-[0.28em] text-white/45 uppercase max-w-2xl mt-1 mb-8 leading-relaxed flex items-center justify-center flex-wrap gap-3 sm:gap-4 select-none"
        >
          <span className="text-[12px] text-white/50">TRUSTED SELLER</span>
          <span className="text-white/30 text-[10px]">•</span>
          <span className="text-[12px] text-white/50">INSTANT DELIVERY</span>
          <span className="text-white/30 text-[10px]">•</span>
          <span className="text-[12px] text-white/50">PREMIUM SERVICE</span>
        </motion.p>
        
        {/* Primary Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center"
        >
          <Link 
            to="/store" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
          >
            <Store className="w-4 h-4 text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            {t("Explore Store", "Explore Store")}
          </Link>
          <Link 
            to="/proxy" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] group"
          >
            <ArrowLeftRight className="w-4 h-4 text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            {t("Proxy Market", "Proxy Market")}
          </Link>
        </motion.div>

        {/* ========================================================================= */}
        {/* LIVE STORE STATUS & TRUST SIGNALS BAR                                     */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="w-full max-w-3xl mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60 text-center sm:text-left"
        >
          {/* Live indicator */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white/80 font-medium tracking-wide">
              Live Stock & Automated Fulfillment Active
            </span>
          </div>

          {/* Key Trust Signals */}
          <div className="flex items-center gap-3 text-[11px] text-white/50 flex-wrap justify-center">
            <span className="flex items-center gap-1 text-white/70">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Store</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-white/70">
              <Lock className="w-3.5 h-3.5 text-white/70" />
              <span>256-Bit SSL</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-white/70">
              <CreditCard className="w-3.5 h-3.5 text-white/70" />
              <span>Ziina & Wallet</span>
            </span>
          </div>
        </motion.div>

        {/* Quick Category Jump Pills Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="w-full max-w-4xl mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5"
        >
          {quickCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={cat.path}
                className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-white/25 transition-all flex flex-col items-start gap-1.5 backdrop-blur-xl group cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] text-left"
              >
                <div className="w-full flex items-center justify-between">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/15 text-white/80 group-hover:text-white transition-colors">
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-white/40 uppercase tracking-wider group-hover:text-white/70 transition-colors">
                    {cat.badge}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-white group-hover:text-white line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TRUST METRICS BAR                                                      */}
      {/* ========================================================================= */}
      <section className="py-6 sm:py-8 px-4 sm:px-6 border border-white/15 rounded-3xl bg-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white mb-1">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Reliability</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">99.9%</p>
          <p className="text-xs text-white/50">Uptime & active delivery</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white mb-1">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Speed</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">&lt; 1 min</p>
          <p className="text-xs text-white/50">Average fulfillment time</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white mb-1">
            <Headphones className="w-4 h-4 text-white" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Support</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">24/7</p>
          <p className="text-xs text-white/50">Live agent assistance</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white mb-1">
            <Star className="w-4 h-4 fill-white text-white" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Trust</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">4.9 / 5.0</p>
          <p className="text-xs text-white/50">Verified buyer ratings</p>
        </div>
      </section>
    </div>
  );
}
