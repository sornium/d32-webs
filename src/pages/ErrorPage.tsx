import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function ErrorPage({ code, message }: { code?: number, message?: string }) {
  const location = useLocation();
  const state = location.state as { code?: number, message?: string } | null;
  
  const errorCode = code || state?.code || 404;
  
  const defaultMessages: Record<number, string> = {
    400: "Bad Request. The server could not understand the request.",
    401: "Unauthorized. Please log in to access this resource.",
    403: "Forbidden. You don't have permission to access this area.",
    404: "Not Found. The page you are looking for does not exist.",
    405: "Method Not Allowed.",
    408: "Request Timeout.",
    429: "Too Many Requests. Please slow down and try again later.",
    500: "Internal Server Error. Something went wrong on our end.",
    502: "Bad Gateway.",
    503: "Service Unavailable. We are currently undergoing maintenance.",
    504: "Gateway Timeout."
  };

  const errorMessage = message || state?.message || defaultMessages[errorCode] || "An unexpected error occurred.";

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-[#111] border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-2 tabular-nums tracking-tight">
            {errorCode}
          </h1>
          
          <h2 className="text-xl font-medium text-red-400 mb-4 uppercase tracking-wider text-sm">
            {errorCode === 404 ? 'Page Not Found' : 'Error Occurred'}
          </h2>
          
          <p className="text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
            {errorMessage}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Go Back
            </button>
            <Link 
              to="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
