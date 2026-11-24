import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { RankedRoute, Station } from "../types";
import { Zap, AlertTriangle, CheckCircle2, ArrowRightLeft, Layers } from "lucide-react";

interface MapLibreViewProps {
  selectedRoute?: RankedRoute | null;
  alternativeRoutes?: RankedRoute[];
  stations?: Station[];
  onSelectStation?: (stationName: string) => void;
  onSelectRoute?: (route: RankedRoute) => void;
  onOpenSeatBooking?: () => void;
  className?: string;
}

export const MapLibreView: React.FC<MapLibreViewProps> = ({
  selectedRoute,
  alternativeRoutes = [],
  stations = [],
  onSelectStation,
  onSelectRoute,
  onOpenSeatBooking,
  className = "w-full h-full min-h-[440px]",
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupsRef = useRef<maplibregl.Popup[]>([]);
  const [showAlternatives, setShowAlternatives] = useState<boolean>(true);

  // Delhi center coordinates
  const DELHI_CENTER: [number, number] = [77.2197, 28.6328]; // [lng, lat]

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // OpenStreetMap Raster Tile Style
    const osmStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: [
            "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "osm-layer",
          type: "raster",
          source: "osm-tiles",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: osmStyle,
      center: DELHI_CENTER,
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map features whenever selectedRoute, alternativeRoutes, or showAlternatives changes
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers & popups
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    popupsRef.current.forEach((p) => p.remove());
    popupsRef.current = [];

    const mapInstance = map.current;

    // Safe helper to clean up old layers and sources
    const cleanLayers = () => {
      // Remove segment layers
      for (let i = 0; i < 20; i++) {
        if (mapInstance.getLayer(`main-seg-halo-${i}`)) mapInstance.removeLayer(`main-seg-halo-${i}`);
        if (mapInstance.getLayer(`main-seg-line-${i}`)) mapInstance.removeLayer(`main-seg-line-${i}`);
        if (mapInstance.getSource(`main-seg-source-${i}`)) mapInstance.removeSource(`main-seg-source-${i}`);
      }
      // Remove alternative layers
      for (let a = 0; a < 5; a++) {
        if (mapInstance.getLayer(`alt-halo-${a}`)) mapInstance.removeLayer(`alt-halo-${a}`);
        if (mapInstance.getLayer(`alt-line-${a}`)) mapInstance.removeLayer(`alt-line-${a}`);
        if (mapInstance.getSource(`alt-source-${a}`)) mapInstance.removeSource(`alt-source-${a}`);
      }
      if (mapInstance.getLayer("route-line-halo")) mapInstance.removeLayer("route-line-halo");
      if (mapInstance.getLayer("route-line")) mapInstance.removeLayer("route-line");
      if (mapInstance.getSource("route-source")) mapInstance.removeSource("route-source");
    };

    const renderRoutesAndCrowd = () => {
      cleanLayers();

      const allCoordinatesToFit: [number, number][] = [];

      // 1. RENDER ALTERNATIVE ROUTES ON MAP (Dashed line with crowd colors)
      if (showAlternatives && alternativeRoutes.length > 0) {
        alternativeRoutes.forEach((altRoute, aIdx) => {
          if (selectedRoute && altRoute.id === selectedRoute.id) return; // skip selected

          if (altRoute.geometry && altRoute.geometry.length >= 2) {
            const altCoords = altRoute.geometry.map(([lat, lng]) => [lng, lat]);
            altCoords.forEach((c) => allCoordinatesToFit.push(c as [number, number]));

            // Color based on alternative route's crowd level
            const isAltLow = altRoute.crowdMetrics.crowdLevel === "LOW";
            const isAltMod = altRoute.crowdMetrics.crowdLevel === "MODERATE";
            const altColor = isAltLow ? "#10B981" : isAltMod ? "#F59E0B" : "#EF4444";

            const sourceId = `alt-source-${aIdx}`;
            mapInstance.addSource(sourceId, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {
                  routeName: altRoute.routeName,
                  crowd: altRoute.crowdMetrics.crowdCategory,
                },
                geometry: {
                  type: "LineString",
                  coordinates: altCoords,
                },
              },
            });

            // Alternative route halo
            mapInstance.addLayer({
              id: `alt-halo-${aIdx}`,
              type: "line",
              source: sourceId,
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#FFFFFF",
                "line-width": 6,
                "line-opacity": 0.6,
              },
            });

            // Alternative route dashed line
            mapInstance.addLayer({
              id: `alt-line-${aIdx}`,
              type: "line",
              source: sourceId,
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": altColor,
                "line-width": 4,
                "line-dasharray": [3, 2],
                "line-opacity": 0.85,
              },
            });

            // Add interactive midpoint label on alternative route
            const midIndex = Math.floor(altCoords.length / 2);
            const midCoord = altCoords[midIndex];

            const altMarkerEl = document.createElement("div");
            altMarkerEl.className = "cursor-pointer transition-transform hover:scale-110";
            altMarkerEl.innerHTML = `
              <div class="px-2.5 py-1 rounded-full ${
                isAltLow
                  ? "bg-emerald-600 text-white border-2 border-white shadow-lg"
                  : "bg-slate-700 text-white border-2 border-white shadow-md"
              } text-[10px] font-bold flex items-center gap-1">
                <span>${altRoute.categoryBadge}: ${altRoute.crowdMetrics.crowdPercentage}% Crowd</span>
              </div>
            `;
            altMarkerEl.addEventListener("click", () => {
              if (onSelectRoute) onSelectRoute(altRoute);
            });

            const altMarker = new maplibregl.Marker({ element: altMarkerEl })
              .setLngLat(midCoord as [number, number])
              .addTo(mapInstance);
            markersRef.current.push(altMarker);
          }
        });
      }

      // 2. RENDER SELECTED MAIN ROUTE WITH STRETCH-BY-STRETCH CROWD HEATMAP
      if (selectedRoute && selectedRoute.stops && selectedRoute.stops.length >= 2) {
        const stops = selectedRoute.stops;

        // Draw individual segments colored by stretch crowdedness
        for (let i = 0; i < stops.length - 1; i++) {
          const fromSt = stops[i];
          const toSt = stops[i + 1];
          const segCoords: [number, number][] = [
            [fromSt.longitude, fromSt.latitude],
            [toSt.longitude, toSt.latitude],
          ];

          segCoords.forEach((c) => allCoordinatesToFit.push(c));

          // Determine stretch crowd level:
          // If route is overall HIGH, bottleneck is typically middle/front
          let segCrowdLevel = selectedRoute.crowdMetrics.crowdLevel;
          if (selectedRoute.segmentCrowds && selectedRoute.segmentCrowds[i]) {
            segCrowdLevel = selectedRoute.segmentCrowds[i].crowdLevel;
          }

          let segColor = "#10B981"; // Low (Seats Available) = Green
          let segWidth = 6;

          if (segCrowdLevel === "HIGH") {
            segColor = "#EF4444"; // High (Crush load) = Red
            segWidth = 8;
          } else if (segCrowdLevel === "MODERATE") {
            segColor = "#F59E0B"; // Moderate (Standing) = Amber
            segWidth = 6;
          }

          const segSourceId = `main-seg-source-${i}`;
          mapInstance.addSource(segSourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: { from: fromSt.name, to: toSt.name },
              geometry: {
                type: "LineString",
                coordinates: segCoords,
              },
            },
          });

          // Halo layer for strong contrast
          mapInstance.addLayer({
            id: `main-seg-halo-${i}`,
            type: "line",
            source: segSourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#FFFFFF",
              "line-width": segWidth + 4,
              "line-opacity": 0.9,
            },
          });

          // Main colored segment line
          mapInstance.addLayer({
            id: `main-seg-line-${i}`,
            type: "line",
            source: segSourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": segColor,
              "line-width": segWidth,
              "line-opacity": 1.0,
            },
          });
        }

        // Add Station Markers with Crowd Rings
        stops.forEach((st, idx) => {
          const isOrigin = idx === 0;
          const isDestination = idx === stops.length - 1;

          const el = document.createElement("div");
          el.className = "cursor-pointer transition-transform duration-200 hover:scale-125";

          if (isOrigin) {
            el.innerHTML = `
              <div class="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white shadow-2xl border-3 border-white font-extrabold text-xs ring-4 ring-emerald-500/30">
                A
              </div>
            `;
          } else if (isDestination) {
            el.innerHTML = `
              <div class="flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 text-white shadow-2xl border-3 border-white font-extrabold text-xs ring-4 ring-rose-500/30">
                B
              </div>
            `;
          } else {
            // Intermediate station: crowd indicator circle
            const isHeavyCrowd = selectedRoute.crowdMetrics.crowdLevel === "HIGH";
            el.innerHTML = `
              <div class="relative flex items-center justify-center">
                <span class="w-4 h-4 rounded-full ${
                  isHeavyCrowd ? "bg-rose-500" : "bg-primary"
                } border-2 border-white shadow-md"></span>
                ${
                  isHeavyCrowd
                    ? '<span class="absolute w-6 h-6 rounded-full bg-rose-400/40 animate-ping"></span>'
                    : ""
                }
              </div>
            `;
          }

          const popupContent = `
            <div class="text-xs p-1">
              <p class="font-extrabold text-sm text-[#0F172A]">${st.name}</p>
              ${
                isOrigin
                  ? '<span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">Origin Boarding</span>'
                  : ""
              }
              ${
                isDestination
                  ? '<span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">Destination Alighting</span>'
                  : ""
              }
              <div class="mt-2 text-[11px] text-slate-500 space-y-0.5">
                <div>Elapsed Duration: <b>${st.timeOffsetMin} mins</b></div>
                <div>Coordinates: ${st.latitude.toFixed(4)}, ${st.longitude.toFixed(4)}</div>
              </div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 15 }).setHTML(popupContent);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([st.longitude, st.latitude])
            .setPopup(popup)
            .addTo(mapInstance);

          el.addEventListener("click", () => {
            if (onSelectStation) onSelectStation(st.name);
          });

          markersRef.current.push(marker);
        });

        // 3. Add Bottleneck Callout on Main Route if crowded
        if (
          selectedRoute.crowdMetrics.crowdLevel === "HIGH" ||
          selectedRoute.crowdMetrics.crowdLevel === "MODERATE"
        ) {
          const midStIdx = Math.floor(stops.length / 2);
          const midSt = stops[midStIdx];

          const calloutEl = document.createElement("div");
          calloutEl.className = "pointer-events-none";
          calloutEl.innerHTML = `
            <div class="px-2.5 py-1 rounded-xl ${
              selectedRoute.crowdMetrics.crowdLevel === "HIGH"
                ? "bg-rose-600 text-white shadow-xl ring-2 ring-rose-300"
                : "bg-amber-500 text-white shadow-lg"
            } text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
              <span>⚠️ ${
                selectedRoute.crowdMetrics.crowdLevel === "HIGH"
                  ? "Crush Crowd Stretch"
                  : "Standing Room Stretch"
              }</span>
            </div>
          `;

          const calloutMarker = new maplibregl.Marker({ element: calloutEl })
            .setLngLat([midSt.longitude, midSt.latitude])
            .addTo(mapInstance);
          markersRef.current.push(calloutMarker);
        }
      } else if (stations.length > 0) {
        // Fallback: render first 25 stations if no route selected
        stations.slice(0, 25).forEach((st) => {
          const el = document.createElement("div");
          el.className = "w-3 h-3 rounded-full bg-slate-400 border border-white shadow-xs cursor-pointer";
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([st.longitude, st.latitude])
            .addTo(mapInstance);
          markersRef.current.push(marker);
        });
      }

      // Fit bounds to include all displayed routes
      if (allCoordinatesToFit.length >= 2) {
        const bounds = new maplibregl.LngLatBounds();
        allCoordinatesToFit.forEach((coord) => bounds.extend(coord));
        mapInstance.fitBounds(bounds, {
          padding: { top: 70, bottom: 70, left: 70, right: 70 },
          maxZoom: 14,
          duration: 900,
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      renderRoutesAndCrowd();
    } else {
      mapInstance.once("load", renderRoutesAndCrowd);
    }
  }, [selectedRoute, alternativeRoutes, showAlternatives, stations]);

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-borderLight shadow-card ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[440px]" />

      {/* Top Floating Overlay: Active Route & Alternative Comparison */}
      {selectedRoute && (
        <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-borderLight text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                selectedRoute.crowdMetrics.crowdLevel === "LOW"
                  ? "bg-emerald-500 shadow-glowGreen"
                  : selectedRoute.crowdMetrics.crowdLevel === "MODERATE"
                  ? "bg-amber-500"
                  : "bg-rose-500 animate-pulse"
              }`}
            />
            <div>
              <div className="font-extrabold text-brandText flex items-center gap-1.5">
                <span>{selectedRoute.routeName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedRoute.crowdMetrics.crowdLevel === "LOW"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedRoute.crowdMetrics.crowdLevel === "MODERATE"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {selectedRoute.crowdMetrics.crowdCategory} ({selectedRoute.crowdMetrics.crowdPercentage}%)
                </span>
              </div>
              <p className="text-brandText-secondary text-[11px]">
                {selectedRoute.totalDurationMin} mins • Primary Mode: {selectedRoute.primaryMode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle show alternatives on map */}
            {alternativeRoutes.length > 1 && (
              <button
                type="button"
                onClick={() => setShowAlternatives((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
                  showAlternatives
                    ? "bg-indigo-50 border-primary text-primary"
                    : "bg-slate-50 border-borderLight text-slate-500"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{showAlternatives ? "Bypass Visible" : "Show Bypass"}</span>
              </button>
            )}

            {onOpenSeatBooking && (
              <button
                type="button"
                onClick={onOpenSeatBooking}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Book Seat</span>
                <span className="text-amber-300">★</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Crowd Heatmap Legend & Route Comparison Callout */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-borderLight shadow-lg text-[11px] space-y-2 max-w-sm">
        <div className="flex items-center justify-between font-extrabold text-brandText border-b border-slate-100 pb-1.5">
          <span>Route Crowding Depiction</span>
          <span className="text-[10px] text-primary">Live ETM Grounded</span>
        </div>

        {/* Stretch Legend */}
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span>Seats Avail (&lt;35%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500" />
            <span>Standing (35-65%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 animate-pulse" />
            <span>Crush Load (&gt;65%)</span>
          </div>
        </div>

        {/* Alternative Route Legend */}
        {showAlternatives && alternativeRoutes.length > 1 && (
          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-2 text-[10px] text-brandText-secondary">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500" />
            <span>Dashed lines indicate <b>Alternative Low-Crowd Bypasses</b> (Click on map to switch)</span>
          </div>
        )}
      </div>
    </div>
  );
};
