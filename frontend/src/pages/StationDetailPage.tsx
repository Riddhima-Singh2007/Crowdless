import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  MapPin,
  Train,
  Bus,
  ArrowRight,
  Clock,
  ShieldCheck,
  Accessibility,
  Compass,
} from "lucide-react";
import { fetchStationDetails, fetchStationCrowd } from "../api";

export const StationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const stationName = id || "Rajiv Chowk";

  const [station, setStation] = useState<any>(null);
  const [crowdData, setCrowdData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchStationDetails(stationName), fetchStationCrowd(stationName)])
      .then(([sDetails, cDetails]) => {
        setStation(sDetails);
        setCrowdData(cDetails);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to load station information.");
      })
      .finally(() => setIsLoading(false));
  }, [stationName]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-brandText-secondary">
        Loading station details...
      </div>
    );
  }

  if (errorMsg || !station) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-rose-600">
        {errorMsg || "Station not found."}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Station Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-borderLight shadow-card flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary-light text-primary">
              {station.mode}
            </span>
            {station.metroLine && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: station.metroLine.color }}
              >
                {station.metroLine.name}
              </span>
            )}
            {station.isInterchange && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Interchange Hub
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-brandText tracking-tight">
            {station.name} {station.hindiName ? `(${station.hindiName})` : ""}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-brandText-secondary pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {station.zone || "Delhi NCR"} ({station.latitude.toFixed(4)}, {station.longitude.toFixed(4)})
            </span>
            <span className="flex items-center gap-1">
              <Accessibility className="w-3.5 h-3.5 text-emerald-600" />
              Wheelchair Accessible: {station.wheelchair ? "Yes" : "Limited"}
            </span>
            {station.code && <span>Station Code: <b>{station.code}</b></span>}
          </div>
        </div>

        {/* Quick Route Actions */}
        <div className="flex items-center gap-3">
          <Link
            to={`/planner?origin=${encodeURIComponent(station.name)}`}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Depart From Here
          </Link>
          <Link
            to={`/planner?destination=${encodeURIComponent(station.name)}`}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brandText rounded-xl text-xs font-semibold transition-all"
          >
            Arrive Here
          </Link>
        </div>
      </div>

      {/* Real-Time Crowdedness & Hourly Footfall Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Footfall Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-borderLight shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-brandText">Hourly Passenger Footfall & Boardings</h2>
              <p className="text-xs text-brandText-secondary">
                Aggregated boardings vs. alightings across 24 operational hours.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#315C76]" />
                Boardings
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A0AEC0]" />
                Alightings
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={crowdData?.hourlyTrend || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: "#718096" }} />
                <YAxis tick={{ fontSize: 11, fill: "#718096" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #E4EAF0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="boardings" name="Boardings" fill="#315C76" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alightings" name="Alightings" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Crowding KPI & Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-borderLight shadow-card space-y-4">
            <h3 className="font-bold text-sm text-brandText">Current Density Index</h3>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-primary">
                {crowdData?.currentCrowdScore || 65}%
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                {crowdData?.currentCategory || "Standing Room"}
              </span>
            </div>

            <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-brandText-secondary">Peak Hours:</span>
                <span className="font-medium text-brandText">{crowdData?.busiestHour}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brandText-secondary">Grounding:</span>
                <span className="text-primary font-medium">October 2026 ETM</span>
              </div>
            </div>
          </div>

          {/* Connected Routes */}
          <div className="bg-white p-6 rounded-3xl border border-borderLight shadow-card space-y-3">
            <h3 className="font-bold text-sm text-brandText">Connected Public Transit Routes</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {station.connectedRoutes && station.connectedRoutes.length > 0 ? (
                station.connectedRoutes.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-borderLight bg-slate-50 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {r.routeType === "METRO" ? (
                        <Train className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Bus className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span className="font-bold text-brandText">{r.routeName}</span>
                    </div>
                    <span className="text-[11px] text-brandText-secondary">
                      {r.agency}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-brandText-secondary">
                  Serviced by Delhi Metro Yellow Line and feeder DTC bus services.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
