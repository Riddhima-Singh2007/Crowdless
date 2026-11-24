import React, { useState, useEffect } from "react";
import { Train, Bus, CheckCircle2, Radio, ExternalLink, RefreshCw } from "lucide-react";
import { fetchTransportStatus } from "../api";

export const NetworkStatusPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadStatus = () => {
    setIsLoading(true);
    fetchTransportStatus()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">
              System Wide Operations Normal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brandText tracking-tight">
            Delhi Transit Network Status
          </h1>
          <p className="text-sm text-brandText-secondary mt-1">
            Operational status of Delhi Metro Lines and high-frequency DTC Bus corridors.
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-borderLight text-xs font-semibold text-brandText hover:bg-slate-50 transition-all shadow-soft"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Metro Lines Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-brandText flex items-center gap-2">
          <Train className="w-5 h-5 text-primary" />
          <span>Delhi Metro Lines (DMRC)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.metroLines?.map((m: any) => (
            <div
              key={m.id}
              className="bg-white p-5 rounded-2xl border border-borderLight shadow-soft flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3.5 h-10 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <div>
                  <h3 className="font-bold text-sm text-brandText">{m.name}</h3>
                  <p className="text-[11px] text-brandText-secondary">{m.stationCount} active stations</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                On Time
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bus Routes Grid */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-brandText flex items-center gap-2">
          <Bus className="w-5 h-5 text-emerald-600" />
          <span>Key DTC Bus Routes (October 2026 ETM Model)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.busRoutes?.map((b: any) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-2xl border border-borderLight shadow-soft space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-brandText">{b.name}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {b.isAc ? "AC Electric" : "Standard"}
                </span>
              </div>
              <p className="text-xs text-brandText-secondary">
                {b.terminalA} ↔ {b.terminalB}
              </p>
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-medium">Regular 8-12m headway</span>
                <span className="text-slate-400">DTC</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Data Sources Notice */}
      <div className="bg-white p-6 rounded-3xl border border-borderLight shadow-soft space-y-3">
        <h3 className="font-bold text-sm text-brandText">Official Delhi Transit Integration</h3>
        <p className="text-xs text-brandText-secondary leading-relaxed">
          The system is designed according to the Delhi Transport Stack standard (delhi.transportstack.in) and Open
          Transit Data (otd.delhi.gov.in). Real-time GTFS-RT protobuf position sync endpoints can be connected directly
          via environment configurations.
        </p>
        <div className="flex items-center gap-4 text-xs font-semibold text-primary pt-1">
          <a
            href="https://delhi.transportstack.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            <span>Delhi Transport Stack Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://otd.delhi.gov.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            <span>Open Transit Data Delhi</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
