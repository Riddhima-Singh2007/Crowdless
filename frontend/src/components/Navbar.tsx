import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navigation, BarChart3, Radio, Sparkles, Armchair } from "lucide-react";
import { fetchHealth } from "../api";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [modelType, setModelType] = useState<string>("Random Forest ML");

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        if (data.status === "ok" && data.mlService && data.mlService.status === "healthy") {
          setModelType("ML Model Trained (MAE: 1.68%)");
        }
      })
      .catch(() => setModelType("Offline Mode"));
  }, []);

  const navLinks = [
    { label: "Journey Planner", path: "/planner", icon: Navigation },
    { label: "Crowd Analytics", path: "/analytics", icon: BarChart3 },
    { label: "Transport Status", path: "/network", icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-borderLight shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-accent-cyan flex items-center justify-center text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-brandText">CROWDLESS</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-primary-light to-indigo-100 text-primary border border-primary/20">
                Delhi NCR
              </span>
            </div>
            <p className="text-[11px] font-semibold text-brandText-secondary -mt-0.5">
              Move smarter. Travel calmer.
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white text-primary shadow-sm font-extrabold"
                    : "text-brandText-secondary hover:text-brandText hover:bg-white/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action pills */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{modelType}</span>
          </div>

          <Link
            to="/planner"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-indigo-900 text-white text-xs font-bold shadow-md shadow-primary/20 transition-all transform active:scale-95"
          >
            <Armchair className="w-4 h-4 text-emerald-300" />
            <span>Book Seat</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
