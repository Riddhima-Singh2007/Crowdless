import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
} from "lucide-react";
import { fetchCrowdTrends, fetchCrowdForecast } from "../api";
import { HourlyTrendPoint } from "../types";

export const AnalyticsPage: React.FC = () => {
  const [trends, setTrends] = useState<HourlyTrendPoint[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([fetchCrowdTrends(), fetchCrowdForecast()])
      .then(([trendsData, forecastData]) => {
        setTrends(trendsData.trends);
        setForecast(forecastData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary-light text-primary">
            Delhi Transport Stack
          </span>
          <span className="text-xs text-brandText-secondary">• Grounded in 2.56M October 2026 ETM Tickets</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brandText tracking-tight">
          Crowd Analytics & Peak Forecast
        </h1>
        <p className="text-sm text-brandText-secondary mt-1">
          Hourly passenger load distributions, peak congestion windows, and Random Forest regressor metrics.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-borderLight shadow-soft">
          <div className="flex items-center justify-between text-brandText-secondary mb-2">
            <span className="text-xs font-semibold">Morning Peak Window</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-brandText">08:30 AM – 10:30 AM</div>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">84% Average Capacity Utilization</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-borderLight shadow-soft">
          <div className="flex items-center justify-between text-brandText-secondary mb-2">
            <span className="text-xs font-semibold">Evening Rush Window</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-brandText">05:30 PM – 08:30 PM</div>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">89% Peak Density (Standing Room Only)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-borderLight shadow-soft">
          <div className="flex items-center justify-between text-brandText-secondary mb-2">
            <span className="text-xs font-semibold">Calmest Travel Slot</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">12:00 PM – 04:00 PM</div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">&gt; 78% Seat Availability Guaranteed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-borderLight shadow-soft">
          <div className="flex items-center justify-between text-brandText-secondary mb-2">
            <span className="text-xs font-semibold">Model Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-800">MAE: 1.68%</div>
          <p className="text-[11px] text-brandText-secondary mt-1">RandomForestRegressor (100 Trees)</p>
        </div>
      </div>

      {/* Main 24-Hour Crowd Intensity Area Chart */}
      <div className="bg-white p-6 rounded-3xl border border-borderLight shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-brandText">
              24-Hour Passenger Density Curve (Weekday vs. Weekend)
            </h2>
            <p className="text-xs text-brandText-secondary mt-0.5">
              Derived from aggregation of conductor ETM transactions calibrated with 1.38x pass-holder multiplier.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#315C76]" />
              <span>Weekday Load Index</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#E53E3E]" />
              <span>Weekend Load Index</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weekdayColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#315C76" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#315C76" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="weekendColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E53E3E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: "#718096" }} />
              <YAxis tick={{ fontSize: 11, fill: "#718096" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  border: "1px solid #E4EAF0",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="weekdayCrowdIndex"
                name="Weekday Load Index (%)"
                stroke="#315C76"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#weekdayColor)"
              />
              <Area
                type="monotone"
                dataKey="weekendCrowdIndex"
                name="Weekend Load Index (%)"
                stroke="#E53E3E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#weekendColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Corridor Level Predictive Status */}
      {forecast && (
        <div className="bg-white p-6 rounded-3xl border border-borderLight shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-brandText">Key Delhi Corridors: Real-Time Crowding Status</h2>
              <p className="text-xs text-brandText-secondary mt-0.5">
                Model: {forecast.model} • Horizon: {forecast.predictionHorizon}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              Active Monitoring
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {forecast.corridors.map((c: any, i: number) => {
              const isHigh = c.currentLoad.includes("HIGH");
              const isMod = c.currentLoad.includes("MODERATE");

              return (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-borderLight bg-slate-50/50 hover:bg-white transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm text-brandText">{c.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isHigh
                          ? "bg-rose-100 text-rose-800"
                          : isMod
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {c.currentLoad}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-brandText-secondary">Next Hour Forecast:</span>
                    <span className="font-semibold text-primary">{c.forecastNextHour}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Trend:</span>
                    <span
                      className={`font-semibold ${
                        c.trend === "RISING" ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {c.trend}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Transparency & Technical Grounding */}
      <div className="bg-primary-light/50 border border-primary/20 p-6 rounded-3xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm text-brandText">Machine Learning Grounding & Methodology Note</h3>
        </div>
        <p className="text-xs text-brandText leading-relaxed">
          The CROWDLESS prediction engine is trained directly on the Delhi Transport Stack October 2026 ETM and
          e-ticketing dataset comprising 2,559,899 ticket transactions across 2,259 bus routes. Pass-holders and pink
          ticket concessions (uncounted on basic ETM tickets) are calibrated with an empirical 1.38x multiplier
          derived from Delhi Transport Department annual ridership censuses.
        </p>
      </div>
    </div>
  );
};
