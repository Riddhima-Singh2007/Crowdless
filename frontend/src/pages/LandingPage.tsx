import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  TrendingDown,
  Clock,
  Navigation,
  Compass,
  Bus,
  Train,
  Sparkles,
  Armchair,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { fetchStations, searchRoutes } from "../api";
import { Station, RankedRoute } from "../types";
import { MapLibreView } from "../components/MapLibreView";
import { BusSeatBookingModal } from "../components/BusSeatBookingModal";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [origin, setOrigin] = useState("Anand Vihar ISBT");
  const [destination, setDestination] = useState("Connaught Place / Shivaji Stadium");
  const [departureTime, setDepartureTime] = useState("18:00");
  const [previewRoute, setPreviewRoute] = useState<RankedRoute | null>(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  useEffect(() => {
    fetchStations().then(setStations).catch(console.error);

    searchRoutes({
      origin: "Anand Vihar ISBT",
      destination: "Connaught Place / Shivaji Stadium",
      departureTime: "18:00",
    })
      .then((res) => {
        if (res.recommendations.length > 0) {
          setPreviewRoute(res.recommendations[0]);
        }
      })
      .catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      `/planner?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
        destination
      )}&time=${encodeURIComponent(departureTime)}`
    );
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section with Vibrant Radial Background */}
      <section className="relative overflow-hidden pt-12 md:pt-20 bg-hero-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-primary-light via-indigo-50 to-pink-50 text-primary text-xs font-bold tracking-wide border border-primary/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Crowdless 2.0: Cinema-Style Seat Booking & Crowd Relief</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-brandText leading-[1.1]">
                A Smarter Way to <br />
                <span className="bg-gradient-to-r from-primary via-indigo-600 to-accent-cyan bg-clip-text text-transparent">
                  Move Through Delhi.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-brandText-secondary max-w-xl leading-relaxed font-normal">
                Never travel like packed sardines again. Predict when bus traffic dissolves, compare alternatives on crowd comfort, and <b className="text-primary font-bold">book your favorite window seat</b> before you step out.
              </p>

              {/* Working Journey Search Box */}
              <div className="bg-white p-6 rounded-3xl shadow-card border border-borderLight max-w-xl">
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brandText-secondary mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Origin Station
                      </label>
                      <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-borderLight rounded-xl px-3.5 py-2.5 text-brandText focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        {stations.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.mode === "METRO" ? "Metro" : s.mode === "INTERCHANGE" ? "Hub" : "Bus"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brandText-secondary mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Destination Station
                      </label>
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-borderLight rounded-xl px-3.5 py-2.5 text-brandText focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        {stations.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.mode === "METRO" ? "Metro" : s.mode === "INTERCHANGE" ? "Hub" : "Bus"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="w-1/2">
                      <label className="block text-xs font-bold text-brandText-secondary mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        Departure Time
                      </label>
                      <input
                        type="time"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-borderLight rounded-xl px-3 py-2 text-brandText focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="w-1/2 flex items-end">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all transform active:scale-95"
                      >
                        <span>Find My Route</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Quick Stat badges */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-brandText-secondary">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glowGreen" />
                  <span>2.56M ETM Tickets Grounded</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span>Interactive Cinema Seat Picker</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Traffic Dissolution Clock</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Map Preview with Seat Booking Hook */}
            <div className="lg:col-span-5">
              <div className="bg-white p-3.5 rounded-3xl shadow-card border border-borderLight space-y-3">
                <div className="h-[430px] rounded-2xl overflow-hidden">
                  <MapLibreView
                    selectedRoute={previewRoute}
                    stations={stations}
                    onOpenSeatBooking={() => setIsSeatModalOpen(true)}
                  />
                </div>
                <div className="p-2 text-xs flex items-center justify-between font-bold text-brandText-secondary">
                  <span>Interactive Map Preview (OSM Tiles)</span>
                  <button
                    onClick={() => setIsSeatModalOpen(true)}
                    className="text-primary hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Test Seat Booking</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section: 3 Recommendation Tiers & Cinema Booking */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Next-Generation Commute Intelligence
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brandText tracking-tight mt-1">
            Compare Routes on Time, Comfort & Empty Seats
          </h2>
          <p className="mt-3 text-sm text-brandText-secondary">
            Commuters can see when buses are crowded, view alternate road bypasses, and reserve their preferred seat just like a movie ticket.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Fastest */}
          <div className="bg-white p-7 rounded-3xl border border-borderLight shadow-soft hover:shadow-card transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-primary flex items-center justify-center font-bold mb-4 border border-primary/20">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-sky-100 text-[#315C76]">
              FASTEST ROUTE
            </span>
            <h3 className="text-xl font-bold text-brandText">Minimizes Total Journey Time</h3>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              Calculates the quickest mathematical path using Metro rail lines and direct bus corridors. Ideal when you have an urgent appointment.
            </p>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-brandText-secondary">Average saving:</span>
              <span className="font-extrabold text-primary">15–20 minutes</span>
            </div>
          </div>

          {/* Card 2: Least Crowded */}
          <div className="bg-white p-7 rounded-3xl border border-borderLight shadow-soft hover:shadow-card transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4 border border-emerald-200">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              LEAST CROWDED ROUTE
            </span>
            <h3 className="text-xl font-bold text-brandText">Guaranteed Seated Comfort</h3>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              Reroutes away from packed central bottlenecks (e.g. Rajiv Chowk crush hours) to AC buses and low-occupancy corridors with ample window seats.
            </p>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-brandText-secondary">Occupancy Level:</span>
              <span className="font-extrabold text-emerald-700">&lt; 35% (Seats Available)</span>
            </div>
          </div>

          {/* Card 3: Cinema Seat Booking */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-pink-50/60 p-7 rounded-3xl border-2 border-primary/20 shadow-soft hover:shadow-card transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold mb-4 shadow-md shadow-primary/30">
              <Armchair className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary text-white">
              NEW: CINEMA-STYLE SEAT MAP
            </span>
            <h3 className="text-xl font-bold text-brandText">Pick Your Bus Seat</h3>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              View the exact 35-seat floor plan of the arriving DTC bus. Select window seats, check charging ports, and get an instant digital boarding pass!
            </p>
            <div className="pt-4 border-t border-primary/10 flex items-center justify-between text-xs">
              <span className="text-brandText-secondary">Digital Pass:</span>
              <span className="font-extrabold text-primary">Instant QR ETM Ticket</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 border-y border-borderLight py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
              Scientific Pipeline
            </span>
            <h2 className="text-3xl font-extrabold text-brandText tracking-tight mt-1">
              How Crowdless Solves Delhi's Congestion
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-borderLight text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold mx-auto mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-brandText">ETM Ticket Ingestion</h4>
              <p className="text-xs text-brandText-secondary leading-relaxed">
                Processes 2.56M October tickets, mapping start stops, destinations, and timestamps.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-borderLight text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold mx-auto mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-brandText">Pass-Holder Calibration</h4>
              <p className="text-xs text-brandText-secondary leading-relaxed">
                Applies a 1.38x multiplier to account for zero-fare Pink tickets and student concessions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-borderLight text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold mx-auto mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-brandText">Random Forest ML</h4>
              <p className="text-xs text-brandText-secondary leading-relaxed">
                Evaluates passenger density with 1.68% MAE across 2,259 bus routes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-borderLight text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold mx-auto mb-3">
                4
              </div>
              <h4 className="font-bold text-sm text-brandText">Cinema Seat Booking</h4>
              <p className="text-xs text-brandText-secondary leading-relaxed">
                Commuters choose seats visually and track when the peak crowd dissolves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seat booking modal preview from landing page */}
      {isSeatModalOpen && previewRoute && (
        <BusSeatBookingModal
          route={previewRoute}
          departureTime={departureTime}
          origin={origin}
          destination={destination}
          onClose={() => setIsSeatModalOpen(false)}
        />
      )}
    </div>
  );
};
