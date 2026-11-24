import React from "react";
import { ShieldCheck, Database, Award } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-borderLight mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-brandText tracking-tight">CROWDLESS</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary-light text-primary font-semibold">
                Transport Stack Hackathon
              </span>
            </div>
            <p className="mt-2 text-sm text-brandText-secondary max-w-sm">
              Delhi-focused public transport journey planner that ranks routes based on journey time, passenger crowd
              intensity, and transit comfort. Grounded in 2.56M official October 2026 ETM and e-ticketing records.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-brandText-secondary">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-primary" />
                Delhi Transport Stack
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Random Forest ML Engine
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                IIIT Delhi
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brandText-secondary mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-sm text-brandText">
              <li>
                <a href="/planner" className="hover:text-primary transition-colors">
                  Journey Planner
                </a>
              </li>
              <li>
                <a href="/analytics" className="hover:text-primary transition-colors">
                  Crowd Analytics
                </a>
              </li>
              <li>
                <a href="/network" className="hover:text-primary transition-colors">
                  Delhi Transport Status
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brandText-secondary mb-3">
              Methodology
            </h4>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              Crowd predictions use Random Forest regression on historical ETM ticketing distributions, calibrated
              with pass-holder concession multipliers (1.38x) to compute real passenger occupancy.
            </p>
            <div className="mt-3 text-[11px] text-slate-400">
              © 2026 CROWDLESS. Built for Delhi Commuters & Transport Planners.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
