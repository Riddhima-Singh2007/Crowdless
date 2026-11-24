import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ArrowUpDown,
  Search,
  Clock,
  Navigation,
  Train,
  Bus,
  Footprints,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Calendar,
  Armchair,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Users,
  Radio,
} from "lucide-react";
import { fetchStations, searchRoutes } from "../api";
import { Station, RankedRoute } from "../types";
import { MapLibreView } from "../components/MapLibreView";
import { BusSeatBookingModal } from "../components/BusSeatBookingModal";
import { CrowdDissolutionAdvisor } from "../components/CrowdDissolutionAdvisor";

export const JourneyPlannerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [stations, setStations] = useState<Station[]>([]);
  const [origin, setOrigin] = useState(searchParams.get("origin") || "Anand Vihar ISBT");
  const [destination, setDestination] = useState(
    searchParams.get("destination") || "Connaught Place / Shivaji Stadium"
  );
  const [departureTime, setDepartureTime] = useState(searchParams.get("time") || "18:00");
  const [departureDate, setDepartureDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [preferredMode, setPreferredMode] = useState<string>("ALL");
  const [passengerCount, setPassengerCount] = useState<number>(1);

  const [routes, setRoutes] = useState<RankedRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({});

  // Seat booking modal state
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [seatBookingRoute, setSeatBookingRoute] = useState<RankedRoute | null>(null);

  useEffect(() => {
    fetchStations().then(setStations).catch(console.error);

    // Initial search if origin & destination provided
    if (origin && destination) {
      handleSearch();
    }
  }, []);

  const handleSearch = async (overrideTime?: string) => {
    const timeToUse = overrideTime || departureTime;

    if (!origin || !destination) {
      setErrorMsg("Please select both Origin and Destination stations.");
      return;
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setErrorMsg("Origin and Destination cannot be the same station.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await searchRoutes({
        origin,
        destination,
        departureTime: timeToUse,
        departureDate,
        preferredMode,
      });

      setRoutes(res.recommendations);
      setSelectedRouteIndex(0);
      setSearchParams({ origin, destination, time: timeToUse });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to find routes between selected stations.");
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleTimeShift = (newTime: string) => {
    setDepartureTime(newTime);
    handleSearch(newTime);
  };

  const openSeatBookingForRoute = (routeToBook: RankedRoute, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSeatBookingRoute(routeToBook);
    setIsSeatModalOpen(true);
  };

  const toggleSegmentExpand = (key: string) => {
    setExpandedSegments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedRoute = routes[selectedRouteIndex] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-light text-primary text-xs font-bold tracking-wide border border-primary/20 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Live Bus Availability & Ticket Fare Per Head Tracking</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brandText tracking-tight">
          Delhi Journey Planner & Ticket Booking
        </h1>
        <p className="text-sm text-brandText-secondary mt-1 max-w-2xl">
          Check live bus arrival times, fare per passenger, corridor crowd density, and reserve your guaranteed seat in real time.
        </p>
      </div>

      {/* Main Search Interface */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-borderLight space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Origin */}
          <div className="lg:col-span-4 relative">
            <label className="block text-xs font-bold text-brandText-secondary mb-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glowGreen" />
              Starting Location / Station
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full text-sm font-semibold bg-slate-50 border border-borderLight rounded-2xl px-4 py-3 text-brandText focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">Select origin...</option>
              {stations.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.mode === "METRO" ? "Metro" : s.mode === "INTERCHANGE" ? "Hub" : "Bus Terminal"})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="lg:col-span-1 flex justify-center pt-5">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-full border border-borderLight hover:bg-slate-100 text-brandText-secondary hover:text-primary transition-all active:scale-90 shadow-sm"
              title="Swap stations"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="lg:col-span-4 relative">
            <label className="block text-xs font-bold text-brandText-secondary mb-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Destination Location / Station
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-sm font-semibold bg-slate-50 border border-borderLight rounded-2xl px-4 py-3 text-brandText focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">Select destination...</option>
              {stations.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.mode === "METRO" ? "Metro" : s.mode === "INTERCHANGE" ? "Hub" : "Bus Terminal"})
                </option>
              ))}
            </select>
          </div>

          {/* Search CTA */}
          <div className="lg:col-span-3 pt-5">
            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-primary hover:bg-primary-dark text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Computing Live Buses & Fares...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Available Buses</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters Bar: Date, Time presets, Passenger count, Mode preference */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Departure Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="bg-slate-50 border border-borderLight rounded-xl px-3 py-1.5 text-xs font-semibold text-brandText focus:outline-none"
              />
            </div>

            {/* Departure Time */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="bg-slate-50 border border-borderLight rounded-xl px-3 py-1.5 text-xs font-semibold text-brandText focus:outline-none"
              />
            </div>

            {/* Passenger Count Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-borderLight">
              <Users className="w-3.5 h-3.5 text-primary ml-1.5" />
              <span className="text-brandText-secondary font-medium">Commuters:</span>
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPassengerCount(num)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    passengerCount === num
                      ? "bg-primary text-white shadow-xs"
                      : "text-brandText hover:bg-slate-200"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Quick Peak / Off-peak presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-brandText-secondary font-medium">Presets:</span>
              <button
                type="button"
                onClick={() => handleTimeShift("09:00")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  departureTime === "09:00"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-brandText"
                }`}
              >
                09:00 AM (Peak Rush)
              </button>
              <button
                type="button"
                onClick={() => handleTimeShift("14:00")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  departureTime === "14:00"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-brandText"
                }`}
              >
                02:00 PM (Calmer / Seats)
              </button>
              <button
                type="button"
                onClick={() => handleTimeShift("18:00")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  departureTime === "18:00"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-brandText"
                }`}
              >
                06:00 PM (Evening Rush)
              </button>
            </div>
          </div>

          {/* Mode Preference */}
          <div className="flex items-center gap-2">
            <span className="text-brandText-secondary font-medium">Mode:</span>
            <div className="inline-flex rounded-xl border border-borderLight p-1 bg-slate-50">
              <button
                onClick={() => setPreferredMode("ALL")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  preferredMode === "ALL"
                    ? "bg-white text-primary shadow-xs font-bold"
                    : "text-brandText-secondary"
                }`}
              >
                All Modes
              </button>
              <button
                onClick={() => setPreferredMode("METRO")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  preferredMode === "METRO"
                    ? "bg-white text-primary shadow-xs font-bold"
                    : "text-brandText-secondary"
                }`}
              >
                Metro Rail
              </button>
              <button
                onClick={() => setPreferredMode("BUS")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  preferredMode === "BUS"
                    ? "bg-white text-primary shadow-xs font-bold"
                    : "text-brandText-secondary"
                }`}
              >
                DTC Bus
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Results Section */}
      {routes.length > 0 && (
        <div className="space-y-8">
          {/* Crowd Dissolution & Alternative Route Recommender */}
          {selectedRoute && (
            <CrowdDissolutionAdvisor
              departureTime={departureTime}
              selectedRoute={selectedRoute}
              candidateRoutes={routes}
              onSelectAlternative={(altRoute) => {
                const targetIdx = routes.findIndex((r) => r.id === altRoute.id);
                if (targetIdx !== -1) setSelectedRouteIndex(targetIdx);
              }}
              onTimeShift={handleTimeShift}
            />
          )}

          {/* Routes List & Map View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Route Cards */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-brandText">
                  Available Transit Options ({routes.length} Available)
                </h2>
                <span className="text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-full border border-primary/20">
                  Fare calculated for {passengerCount} {passengerCount > 1 ? "Commuters" : "Commuter"}
                </span>
              </div>

              {/* 3 Distinct Recommendation Cards */}
              <div className="space-y-4">
                {routes.map((route, idx) => {
                  const isSelected = selectedRouteIndex === idx;
                  const isLow = route.crowdMetrics.crowdLevel === "LOW";
                  const isModerate = route.crowdMetrics.crowdLevel === "MODERATE";
                  const isHigh = route.crowdMetrics.crowdLevel === "HIGH";

                  const farePerHead = route.ticketFarePerHead || (route.primaryMode === "METRO" ? 40 : 25);
                  const totalCalculatedFare = farePerHead * passengerCount;
                  const busAvail = route.busAvailability || {
                    nextBusInMinutes: 6,
                    vehicleNumber: "DL 1PD 4829",
                    busType: "DTC Low-Floor AC Electric",
                    availableSeatsCount: 14,
                    frequencyMinutes: 8,
                  };

                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRouteIndex(idx)}
                      className={`cursor-pointer bg-white p-6 rounded-3xl border transition-all ${
                        isSelected
                          ? "border-primary shadow-card ring-2 ring-primary/20 scale-[1.01]"
                          : "border-borderLight hover:border-slate-300 shadow-soft"
                      }`}
                    >
                      {/* Top Bar of Card */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-extrabold px-3 py-1 rounded-full border ${route.badgeColor}`}
                          >
                            {route.categoryBadge}
                          </span>
                          <span className="text-xs font-bold text-brandText-secondary">
                            • {route.primaryMode}
                          </span>
                        </div>

                        {/* Crowd Badge */}
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isLow
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : isModerate
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isLow
                                ? "bg-emerald-500 shadow-glowGreen"
                                : isModerate
                                ? "bg-amber-500"
                                : "bg-rose-500 animate-ping"
                            }`}
                          />
                          <span>{route.crowdMetrics.crowdCategory}</span>
                          <span className="text-[11px] opacity-75">
                            ({route.crowdMetrics.crowdPercentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Prominent Live Bus Available & Ticket Per Head Banner */}
                      <div className="p-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-emerald-50/40 rounded-2xl border border-borderLight flex flex-wrap items-center justify-between gap-3 mb-4">
                        {/* Bus Availability & Headway */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold shadow-sm">
                            <Bus className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-brandText">
                                Next Bus in {busAvail.nextBusInMinutes} mins
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                {busAvail.vehicleNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-brandText-secondary">
                              {busAvail.busType} • Frequency: every {busAvail.frequencyMinutes}m •{" "}
                              <b className="text-emerald-700">{busAvail.availableSeatsCount} seats open</b>
                            </p>
                          </div>
                        </div>

                        {/* Ticket Fare Per Head */}
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xl font-black text-emerald-700">
                              ₹{farePerHead}
                            </span>
                            <span className="text-xs font-bold text-brandText-secondary">
                              / head
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500">
                            {passengerCount > 1
                              ? `Total: ₹${totalCalculatedFare} (${passengerCount} commuters)`
                              : "Pink Ticket: ₹0 for Women"}
                          </div>
                        </div>
                      </div>

                      {/* Route Name, Duration, and Book Seat Button */}
                      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-black text-brandText tracking-tight">
                            {route.routeName}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-brandText-secondary mt-1">
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3.5 h-3.5 text-primary" />
                              {route.totalDistanceKm} km
                            </span>
                            <span className="flex items-center gap-1">
                              <Footprints className="w-3.5 h-3.5 text-slate-500" />
                              {route.transfersCount === 0
                                ? "Direct (0 transfers)"
                                : `${route.transfersCount} transfer`}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100">
                              {route.crowdMetrics.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-3xl font-black text-primary">
                              {route.totalDurationMin}
                            </span>
                            <span className="text-xs font-bold text-brandText-secondary ml-1">
                              min
                            </span>
                          </div>

                          {/* Cinema-Style Seat Booking Button */}
                          <button
                            type="button"
                            onClick={(e) => openSeatBookingForRoute(route, e)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                          >
                            <Armchair className="w-4 h-4" />
                            <span>Select Seat</span>
                          </button>
                        </div>
                      </div>

                      {/* Recommendation Explanation */}
                      <div className="text-xs text-brandText leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-3">
                        {route.recommendationExplanation}
                      </div>

                      {/* Segment breakdown when selected */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-brandText uppercase tracking-wider">
                              Transit Legs & Vehicle Details
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => openSeatBookingForRoute(route, e)}
                              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <span>Open Cinema Seat Map</span>
                              <span>→</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {route.segments.map((seg, sIdx) => {
                              const segKey = `${route.id}-seg-${sIdx}`;
                              const isExpanded = !!expandedSegments[segKey];
                              const sCrowd = route.segmentCrowds[sIdx];

                              return (
                                <div
                                  key={segKey}
                                  className="bg-white border border-borderLight rounded-2xl p-3.5 text-xs space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {seg.mode === "METRO" ? (
                                        <Train className="w-4 h-4 text-blue-600" />
                                      ) : (
                                        <Bus className="w-4 h-4 text-emerald-600" />
                                      )}
                                      <span className="font-bold text-brandText">
                                        {seg.routeName} {seg.isAc ? "(AC Low-Floor)" : ""}
                                      </span>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-brandText-secondary">
                                        {seg.fromStop} → {seg.toStop}
                                      </span>
                                    </div>
                                    <span className="font-bold text-primary">
                                      {seg.durationMin} min
                                    </span>
                                  </div>

                                  {sCrowd && (
                                    <div className="flex items-center justify-between text-[11px] text-brandText-secondary pt-2 border-t border-slate-50">
                                      <span>
                                        Corridor Density: <b>{sCrowd.crowdCategory}</b> (~{sCrowd.crowdPercentage}% bus load)
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        Fare: <b>₹{farePerHead}/head</b> • Pass Valid
                                      </span>
                                    </div>
                                  )}

                                  {/* Intermediate Stops Accordion */}
                                  {seg.intermediateStops && seg.intermediateStops.length > 2 && (
                                    <div className="mt-1">
                                      <button
                                        type="button"
                                        onClick={() => toggleSegmentExpand(segKey)}
                                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                                      >
                                        <span>
                                          {isExpanded ? "Hide" : "Show"}{" "}
                                          {seg.intermediateStops.length - 2} intermediate stops
                                        </span>
                                        {isExpanded ? (
                                          <ChevronUp className="w-3 h-3" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3" />
                                        )}
                                      </button>
                                      {isExpanded && (
                                        <ul className="mt-2 pl-4 border-l-2 border-primary-light space-y-1 text-[11px] text-brandText-secondary">
                                          {seg.intermediateStops.slice(1, -1).map((st, i) => (
                                            <li key={i}>{st}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Synchronized Interactive Map with Alternative Bypass Depiction */}
            <div className="lg:col-span-5 sticky top-24 space-y-4">
              <div className="bg-white p-3.5 rounded-3xl shadow-card border border-borderLight space-y-3">
                <div className="h-[480px] rounded-2xl overflow-hidden">
                  <MapLibreView
                    selectedRoute={selectedRoute}
                    alternativeRoutes={routes}
                    stations={stations}
                    onSelectRoute={(rt) => {
                      const idx = routes.findIndex((r) => r.id === rt.id);
                      if (idx !== -1) setSelectedRouteIndex(idx);
                    }}
                    onOpenSeatBooking={() =>
                      selectedRoute && openSeatBookingForRoute(selectedRoute)
                    }
                  />
                </div>

                <div className="p-3 text-xs space-y-2 border-t border-slate-100">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-brandText-secondary">Inspecting Route:</span>
                    <span className="text-primary">{selectedRoute?.routeName || "None"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Next Bus / Train:</span>
                    <span className="font-bold text-emerald-700">
                      In {selectedRoute?.busAvailability?.nextBusInMinutes || 5} mins (
                      {selectedRoute?.busAvailability?.vehicleNumber || "DL 1PD 4829"})
                    </span>
                  </div>

                  {selectedRoute && (
                    <button
                      type="button"
                      onClick={() => openSeatBookingForRoute(selectedRoute)}
                      className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-indigo-900 text-white rounded-2xl text-xs font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Armchair className="w-4 h-4 text-emerald-300" />
                      <span>
                        Book Seat on {selectedRoute.routeName} (₹{selectedRoute.ticketFarePerHead || 25}/head)
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cinema-Style Bus Seat Booking Modal */}
      {isSeatModalOpen && seatBookingRoute && (
        <BusSeatBookingModal
          route={seatBookingRoute}
          departureTime={departureTime}
          origin={origin}
          destination={destination}
          onClose={() => setIsSeatModalOpen(false)}
        />
      )}
    </div>
  );
};
