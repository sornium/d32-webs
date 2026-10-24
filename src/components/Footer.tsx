import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function Footer() {
  return (
    <footer className="border-t border-white/15 mt-24 bg-black/40 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-lg font-bold tracking-tight text-white">
                d32<span className="text-white/70 font-medium">.store</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              The premier digital marketplace for games, premium subscriptions, and high-performance proxies with instant delivery.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/store" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/proxy" className="hover:text-white transition-colors">Premium Proxies</Link></li>
              <li><Link to="/store" className="hover:text-white transition-colors">Subscriptions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support & Help</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/FAQ" className="hover:text-white transition-colors">FAQ & Help</Link></li>
              <li><Link to="/payment-methods" className="hover:text-white transition-colors">Payment Methods</Link></li>
              <li><Link to="/dashboard?tab=tickets" className="hover:text-white transition-colors">Submit Ticket</Link></li>
              <li><Link to="/reviews" className="hover:text-white transition-colors">Customer Reviews</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal & Safety</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/Terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/Community-guidelines" className="hover:text-white transition-colors">Community Guidelines</Link></li>
              <li><Link to="/Safety-policies" className="hover:text-white transition-colors">Safety Policies & Stack</Link></li>
              <li><Link to="/payment-methods" className="hover:text-white transition-colors">Accepted Gateways</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} D32.Store. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              Secure Checkout via Ziina, Crypto & Apple Pay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
