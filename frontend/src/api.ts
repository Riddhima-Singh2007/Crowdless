import { Station, RouteSearchResponse, HourlyTrendPoint } from "./types";

const API_BASE = "/api";

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchStations(query: string = ""): Promise<Station[]> {
  const url = query ? `${API_BASE}/stations?q=${encodeURIComponent(query)}` : `${API_BASE}/stations`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch stations");
  const data = await res.json();
  return data.stations;
}

export async function fetchStationDetails(idOrName: string): Promise<any> {
  const res = await fetch(`${API_BASE}/stations/${encodeURIComponent(idOrName)}`);
  if (!res.ok) throw new Error("Failed to fetch station details");
  const data = await res.json();
  return data.station;
}

export async function fetchStationCrowd(idOrName: string): Promise<any> {
  const res = await fetch(`${API_BASE}/stations/${encodeURIComponent(idOrName)}/crowd`);
  if (!res.ok) throw new Error("Failed to fetch station crowd data");
  return res.json();
}

export async function searchRoutes(params: {
  origin: string;
  destination: string;
  departureTime?: string;
  departureDate?: string;
  preferredMode?: string;
}): Promise<RouteSearchResponse> {
  const res = await fetch(`${API_BASE}/routes/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Route search failed");
  }
  return data;
}

export async function fetchCrowdTrends(): Promise<{
  trends: HourlyTrendPoint[];
  morningPeakWindow: string;
  eveningPeakWindow: string;
  leastCrowdedWindow: string;
  dataSource: string;
}> {
  const res = await fetch(`${API_BASE}/crowd/trends`);
  if (!res.ok) throw new Error("Failed to fetch crowd trends");
  return res.json();
}

export async function fetchCrowdForecast(): Promise<any> {
  const res = await fetch(`${API_BASE}/crowd/forecast`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  return res.json();
}

export async function fetchTransportStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/transport/status`);
  if (!res.ok) throw new Error("Failed to fetch transport status");
  return res.json();
}
