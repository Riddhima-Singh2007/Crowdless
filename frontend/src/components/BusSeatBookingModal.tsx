import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  Download,
  Info,
  Clock,
  MapPin,
  Bus,
  Users,
} from "lucide-react";
import { RankedRoute } from "../types";

interface BusSeatBookingModalProps {
  route: RankedRoute;
  departureTime: string;
  origin: string;
  destination: string;
  onClose: () => void;
}

interface SeatInfo {
  id: string;
  number: string;
  row: number;
  col: "A" | "B" | "C" | "D" | "BACK";
  isWindow: boolean;
  isAisle: boolean;
  isLadiesReserved: boolean;
  isSpecialReserved: boolean;
  isOccupied: boolean;
  hasChargingPort: boolean;
}

export const BusSeatBookingModal: React.FC<BusSeatBookingModalProps> = ({
  route,
  departureTime,
  origin,
  destination,
  onClose,
}) => {
  const [selectedSeats, setSelectedSeats] = useState<SeatInfo[]>([]);
  const [isPinkTicketApplied, setIsPinkTicketApplied] = useState(false);
  const [isTicketConfirmed, setIsTicketConfirmed] = useState(false);
  const [ticketId] = useState(
    `DTC-${Math.floor(100000 + Math.random() * 900000)}`
  );

  // Bus Availability details from route or realistic fallback
  const farePerHead = route.ticketFarePerHead || (route.primaryMode === "METRO" ? 40 : 25);
  const busAvail = route.busAvailability || {
    nextBusInMinutes: 5,
    estimatedDepartureTime: departureTime,
    frequencyMinutes: 8,
    activeBusesCount: 6,
    vehicleNumber: "DL 1PD 4829",
    busType: "DTC Low-Floor AC Electric (12m)",
    totalSeats: 35,
    availableSeatsCount: 14,
  };

  const totalSeats = busAvail.totalSeats || 35;
  const crowdPercent = route.crowdMetrics.crowdPercentage; // e.g. 60%
  const occupiedCount = Math.min(
    totalSeats - 3,
    Math.max(4, Math.round((crowdPercent / 100) * totalSeats))
  );

  // Deterministic seat occupancy based on route ID and crowd
  const generateSeats = (): SeatInfo[] => {
    const seats: SeatInfo[] = [];
    let occCount = 0;

    for (let r = 1; r <= 7; r++) {
      const cols: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
      for (const col of cols) {
        const isLadies = r <= 2 && (col === "A" || col === "B");
        const isSpecial = r === 1 && (col === "C" || col === "D");

        const pseudoRand = (r * 7 + col.charCodeAt(0) + crowdPercent) % 10;
        const shouldOccupy = pseudoRand < (crowdPercent / 10) && occCount < occupiedCount;
        if (shouldOccupy) occCount++;

        seats.push({
          id: `seat-${r}${col}`,
          number: `${r}${col}`,
          row: r,
          col,
          isWindow: col === "A" || col === "D",
          isAisle: col === "B" || col === "C",
          isLadiesReserved: isLadies,
          isSpecialReserved: isSpecial,
          isOccupied: shouldOccupy,
          hasChargingPort: col === "A" || col === "D" || r === 1,
        });
      }
    }

    // Back lounge row (5 seats)
    for (let i = 1; i <= 7; i++) {
      const seatNum = `${28 + i}`;
      const shouldOccupy = occCount < occupiedCount;
      if (shouldOccupy) occCount++;

      seats.push({
        id: `seat-back-${i}`,
        number: seatNum,
        row: 8,
        col: "BACK",
        isWindow: i === 1 || i === 7,
        isAisle: false,
        isLadiesReserved: false,
        isSpecialReserved: false,
        isOccupied: shouldOccupy,
        hasChargingPort: false,
      });
    }

    return seats;
  };

  const [seats] = useState<SeatInfo[]>(generateSeats());
  const availableSeatsCount = seats.filter((s) => !s.isOccupied).length;

  const handleSeatClick = (seat: SeatInfo) => {
    if (seat.isOccupied) return;
    if (selectedSeats.some((s) => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      // Allow up to 4 seats
      if (selectedSeats.length >= 4) {
        alert("You can select up to 4 seats per booking.");
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalFare = isPinkTicketApplied ? 0 : farePerHead * selectedSeats.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-borderLight overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary to-primary-dark text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Bus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">
                  {isTicketConfirmed ? "Digital Boarding Pass" : "Live Bus Seat Selection"}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/20">
                  {route.routeName}
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900">
                  ₹{farePerHead}/head
                </span>
              </div>
              <p className="text-xs text-white/80">
                {origin} → {destination} • Next Bus in {busAvail.nextBusInMinutes} mins ({busAvail.vehicleNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!isTicketConfirmed ? (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Visual Cinema-Style Bus Seat Layout */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-brandText flex items-center gap-1.5">
                  <span>Interactive Floor Plan</span>
                  <span className="text-brandText-secondary font-medium">({busAvail.busType})</span>
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                  {availableSeatsCount} of {totalSeats} Seats Available
                </span>
              </div>

              {/* Color Legend */}
              <div className="flex flex-wrap items-center gap-3.5 text-[11px] p-3 bg-slate-50 rounded-2xl border border-borderLight font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-emerald-100 border-2 border-emerald-500" />
                  <span>Available (₹{farePerHead})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-primary border-2 border-primary-dark" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-slate-200 border border-slate-300" />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-pink-100 border-2 border-pink-400" />
                  <span>Ladies</span>
                </div>
              </div>

              {/* Bus Exterior Frame & Seat Grid */}
              <div className="relative mx-auto max-w-md bg-slate-100 p-6 rounded-t-[40px] rounded-b-[28px] border-4 border-slate-300 shadow-inner">
                {/* Windshield & Headlights */}
                <div className="w-full h-8 bg-sky-100/80 rounded-t-[30px] border-b-2 border-slate-300 flex items-center justify-between px-6 mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    FRONT WINDSHIELD
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
                    <span>Driver ({busAvail.vehicleNumber})</span>
                    <span className="w-4 h-4 rounded-full bg-slate-400 border border-slate-500 flex items-center justify-center text-[8px] text-white">
                      ✇
                    </span>
                  </div>
                </div>

                {/* Front Entrance Door Marker */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-2 mb-3">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    ← Boarding Door
                  </span>
                  <span className="bg-slate-200 px-2 py-0.5 rounded font-semibold">
                    Exit Door →
                  </span>
                </div>

                {/* Rows 1 to 7: 2x2 Layout with Central Walkway */}
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((rowNum) => {
                    const rowSeats = seats.filter((s) => s.row === rowNum);
                    const leftSeats = rowSeats.filter(
                      (s) => s.col === "A" || s.col === "B"
                    );
                    const rightSeats = rowSeats.filter(
                      (s) => s.col === "C" || s.col === "D"
                    );

                    return (
                      <div
                        key={rowNum}
                        className="flex items-center justify-between"
                      >
                        {/* Left Side (A, B) */}
                        <div className="flex items-center gap-2">
                          {leftSeats.map((seat) => renderSeatButton(seat))}
                        </div>

                        {/* Central Walkway / Aisle */}
                        <div className="w-12 text-center text-[9px] text-slate-400 select-none font-bold">
                          R{rowNum}
                        </div>

                        {/* Right Side (C, D) */}
                        <div className="flex items-center gap-2">
                          {rightSeats.map((seat) => renderSeatButton(seat))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Back Row: 5 Seats */}
                  <div className="pt-3 border-t border-slate-300">
                    <div className="text-[9px] text-center text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                      Rear Lounge Row
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {seats
                        .filter((s) => s.row === 8)
                        .map((seat) => renderSeatButton(seat))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Seat Details & Booking Action */}
            <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Live Bus Available Card */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-borderLight space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary-light px-2 py-0.5 rounded-full">
                      Live Vehicle Details
                    </span>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Arriving in {busAvail.nextBusInMinutes}m
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-brandText-secondary">Vehicle Number:</span>
                      <span className="font-extrabold text-brandText">{busAvail.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-brandText-secondary">Bus Specification:</span>
                      <span className="font-bold text-brandText">{busAvail.busType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-brandText-secondary">Route Frequency:</span>
                      <span className="font-bold text-primary">Every {busAvail.frequencyMinutes} mins</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-brandText-secondary font-bold">Standard Ticket Fare:</span>
                      <span className="text-base font-black text-emerald-700">₹{farePerHead} / head</span>
                    </div>
                  </div>

                  {/* Pink Ticket Concession Toggle */}
                  <label className="flex items-center gap-2 p-2.5 bg-pink-50/70 border border-pink-200 rounded-xl cursor-pointer hover:bg-pink-100/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={isPinkTicketApplied}
                      onChange={(e) => setIsPinkTicketApplied(e.target.checked)}
                      className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-pink-800">Women Commuter (Pink Pass)</span>
                      <span className="block text-[10px] text-pink-600">Zero-fare concession applied (₹0)</span>
                    </div>
                  </label>
                </div>

                {/* Selected Seats Calculation */}
                {selectedSeats.length > 0 ? (
                  <div className="p-5 bg-primary-light/60 rounded-3xl border-2 border-primary/30 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                          Selected ({selectedSeats.length} {selectedSeats.length > 1 ? "Seats" : "Seat"})
                        </span>
                        <h4 className="text-xl font-black text-brandText">
                          {selectedSeats.map((s) => s.number).join(", ")}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary">
                          ₹{totalFare}.00
                        </span>
                        <span className="text-[10px] text-brandText-secondary block font-bold">
                          {isPinkTicketApplied ? "Zero-Fare Pass" : `₹${farePerHead} × ${selectedSeats.length}`}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-brandText-secondary">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>All seats guaranteed on vehicle {busAvail.vehicleNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary font-bold">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Equipped with 5V USB Rapid Phone Charger</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1.5">
                    <Info className="w-5 h-5 mx-auto text-primary" />
                    <p className="font-bold text-brandText">No Seat Selected</p>
                    <p>Click on any green seat in the floor plan to pick your favorite spot.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-borderLight text-xs font-bold text-brandText hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={selectedSeats.length === 0}
                  onClick={() => setIsTicketConfirmed(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-primary hover:bg-primary-dark text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-primary/25 transition-all transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>
                    Book {selectedSeats.length > 0 ? `${selectedSeats.length} Seat(s) • ₹${totalFare}` : "Seats"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Digital Boarding Pass Ticket View */
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-primary/20 shadow-card overflow-hidden">
              {/* Ticket Header */}
              <div className="bg-primary p-6 text-white text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                  Confirmed Delhi Transit Pass
                </span>
                <h3 className="text-2xl font-black tracking-tight">{route.routeName}</h3>
                <p className="text-xs text-white/80">Vehicle: {busAvail.vehicleNumber} • ID: {ticketId}</p>
              </div>

              {/* Ticket Details */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-dashed border-slate-200">
                  <div>
                    <span className="text-[11px] text-brandText-secondary block font-medium">
                      Boarding Stop
                    </span>
                    <span className="text-sm font-bold text-brandText">{origin}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-brandText-secondary block font-medium">
                      Destination Stop
                    </span>
                    <span className="text-sm font-bold text-brandText">{destination}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-brandText-secondary block font-medium">
                      Departure Time
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {departureTime} (In {busAvail.nextBusInMinutes}m)
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-brandText-secondary block font-medium">
                      Seats Reserved
                    </span>
                    <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedSeats.map((s) => s.number).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-brandText-secondary block font-medium">
                      Total Fare Paid
                    </span>
                    <span className="text-base font-black text-brandText">
                      ₹{totalFare}.00 ({selectedSeats.length} commuters)
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-brandText-secondary block font-medium">
                      Ticket Type
                    </span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {isPinkTicketApplied ? "Pink Concession (Women)" : "ETM Standard QR"}
                    </span>
                  </div>
                </div>

                {/* Scannable Mock QR Code */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-borderLight">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-brandText">
                      Conductor ETM Validation
                    </span>
                    <p className="text-[11px] text-brandText-secondary">
                      Scan on conductor ETM or at Metro automatic fare gate.
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-borderLight shadow-sm">
                    <QrCode className="w-14 h-14 text-brandText" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  alert("Digital Transit Pass downloaded to your device!");
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Save Pass to Wallet</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-borderLight text-xs font-semibold text-brandText hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function renderSeatButton(seat: SeatInfo) {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    let bgClass = "bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100";
    if (seat.isOccupied) {
      bgClass = "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60";
    } else if (isSelected) {
      bgClass = "bg-primary border-primary-dark text-white shadow-glow ring-2 ring-primary/40 scale-105 font-bold";
    } else if (seat.isLadiesReserved) {
      bgClass = "bg-pink-50 border-pink-400 text-pink-700 hover:bg-pink-100";
    } else if (seat.isSpecialReserved) {
      bgClass = "bg-sky-50 border-sky-400 text-sky-700 hover:bg-sky-100";
    }

    return (
      <button
        key={seat.id}
        type="button"
        disabled={seat.isOccupied}
        onClick={() => handleSeatClick(seat)}
        className={`seat-button w-8 h-8 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all ${bgClass}`}
        title={`Seat ${seat.number}${
          seat.isOccupied
            ? " (Occupied)"
            : seat.isLadiesReserved
            ? " (Ladies Reserved)"
            : seat.isWindow
            ? " (Window)"
            : " (Aisle)"
        }`}
      >
        {seat.isOccupied ? "×" : seat.number}
      </button>
    );
  }
};
