import prisma from "../prisma";

export interface Edge {
  from: string;
  to: string;
  travelTimeMin: number;
  distanceKm: number;
  mode: "BUS" | "METRO" | "TRANSFER";
  routeId: string;
  routeName: string;
  isAc: boolean;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
}

export interface CandidateRoute {
  id: string;
  routeName: string;
  primaryMode: "BUS" | "METRO" | "MULTIMODAL";
  totalDurationMin: number;
  totalDistanceKm: number;
  transfersCount: number;
  walkingDistanceMeters: number;
  stops: {
    name: string;
    latitude: number;
    longitude: number;
    timeOffsetMin: number;
  }[];
  segments: {
    routeName: string;
    mode: "BUS" | "METRO" | "TRANSFER";
    isAc: boolean;
    fromStop: string;
    toStop: string;
    durationMin: number;
    distanceKm: number;
    intermediateStops: string[];
  }[];
  geometry: [number, number][]; // [lat, lng] array for MapLibre
}

class TransitGraph {
  private adjacency: Map<string, Edge[]> = new Map();
  private stopCoordinates: Map<string, { lat: number; lng: number }> = new Map();

  public addEdge(edge: Edge) {
    if (!this.adjacency.has(edge.from)) {
      this.adjacency.set(edge.from, []);
    }
    this.adjacency.get(edge.from)!.push(edge);
  }

  public setCoordinate(name: string, lat: number, lng: number) {
    this.stopCoordinates.set(name, { lat, lng });
  }

  public getCoordinate(name: string): { lat: number; lng: number } | undefined {
    return this.stopCoordinates.get(name);
  }

  public getNeighbors(node: string): Edge[] {
    return this.adjacency.get(node) || [];
  }

  public getNodes(): string[] {
    return Array.from(this.adjacency.keys());
  }
}

let cachedGraph: TransitGraph | null = null;

export async function buildTransitGraph(): Promise<TransitGraph> {
  if (cachedGraph) return cachedGraph;

  const graph = new TransitGraph();

  // 1. Load all stations and set coordinates
  const stations = await prisma.station.findMany();
  for (const s of stations) {
    graph.setCoordinate(s.name, s.latitude, s.longitude);
  }

  // 2. Load all routes with stops
  const routes = await prisma.route.findMany({
    include: {
      stops: {
        orderBy: { stopSequence: "asc" },
      },
    },
  });

  for (const r of routes) {
    const stops = r.stops;
    for (let i = 0; i < stops.length - 1; i++) {
      const curr = stops[i];
      const next = stops[i + 1];

      if (curr.latitude && curr.longitude) {
        graph.setCoordinate(curr.stopName, curr.latitude, curr.longitude);
      }
      if (next.latitude && next.longitude) {
        graph.setCoordinate(next.stopName, next.latitude, next.longitude);
      }

      const segmentTime = Math.max(2, next.travelTimeMin - curr.travelTimeMin);
      const segmentDist = Math.max(0.5, next.distanceFromStartKm - curr.distanceFromStartKm);

      const edgeForward: Edge = {
        from: curr.stopName,
        to: next.stopName,
        travelTimeMin: segmentTime,
        distanceKm: segmentDist,
        mode: r.routeType as "BUS" | "METRO",
        routeId: r.id,
        routeName: r.name,
        isAc: r.isAc,
        fromLat: curr.latitude || 28.6139,
        fromLng: curr.longitude || 77.2090,
        toLat: next.latitude || 28.6139,
        toLng: next.longitude || 77.2090,
      };

      const edgeBackward: Edge = {
        from: next.stopName,
        to: curr.stopName,
        travelTimeMin: segmentTime,
        distanceKm: segmentDist,
        mode: r.routeType as "BUS" | "METRO",
        routeId: r.id,
        routeName: r.name,
        isAc: r.isAc,
        fromLat: next.latitude || 28.6139,
        fromLng: next.longitude || 77.2090,
        toLat: curr.latitude || 28.6139,
        toLng: curr.longitude || 77.2090,
      };

      graph.addEdge(edgeForward);
      graph.addEdge(edgeBackward);
    }
  }

  // 3. Add interchange walking edges between nearby hubs (within 400m)
  const interchangeNodes = stations.filter((s) => s.isInterchange);
  for (let i = 0; i < interchangeNodes.length; i++) {
    for (let j = i + 1; j < interchangeNodes.length; j++) {
      const a = interchangeNodes[i];
      const b = interchangeNodes[j];
      const distKm = getHaversineDist(a.latitude, a.longitude, b.latitude, b.longitude);
      if (distKm <= 0.6) {
        const walkTime = Math.round(distKm * 12) + 2; // ~5km/h walking + platform transfer
        graph.addEdge({
          from: a.name,
          to: b.name,
          travelTimeMin: walkTime,
          distanceKm: distKm,
          mode: "TRANSFER",
          routeId: "WALK_TRANSFER",
          routeName: "Platform Transfer",
          isAc: false,
          fromLat: a.latitude,
          fromLng: a.longitude,
          toLat: b.latitude,
          toLng: b.longitude,
        });
        graph.addEdge({
          from: b.name,
          to: a.name,
          travelTimeMin: walkTime,
          distanceKm: distKm,
          mode: "TRANSFER",
          routeId: "WALK_TRANSFER",
          routeName: "Platform Transfer",
          isAc: false,
          fromLat: b.latitude,
          fromLng: b.longitude,
          toLat: a.latitude,
          toLng: a.longitude,
        });
      }
    }
  }

  cachedGraph = graph;
  return graph;
}

function getHaversineDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Dijkstra search with edge penalty masks to generate alternative candidate routes
 */
export async function findCandidateRoutes(
  origin: string,
  destination: string,
  maxCandidates: number = 3
): Promise<CandidateRoute[]> {
  const graph = await buildTransitGraph();

  const candidates: CandidateRoute[] = [];
  const edgePenaltyMap: Map<string, number> = new Map();

  for (let c = 0; c < maxCandidates; c++) {
    const pathEdges = dijkstra(graph, origin, destination, edgePenaltyMap);
    if (!pathEdges || pathEdges.length === 0) break;

    // Convert edges to CandidateRoute
    const routeCandidate = buildCandidateFromEdges(graph, pathEdges, c);
    candidates.push(routeCandidate);

    // Penalize the edges of this path to force alternative diversity for the next candidate
    for (const edge of pathEdges) {
      const edgeKey = `${edge.from}->${edge.to}`;
      const currentPenalty = edgePenaltyMap.get(edgeKey) || 0;
      edgePenaltyMap.set(edgeKey, currentPenalty + 15); // +15 mins virtual penalty
    }
  }

  return candidates;
}

function dijkstra(
  graph: TransitGraph,
  origin: string,
  destination: string,
  penaltyMap: Map<string, number>
): Edge[] | null {
  const distances: Map<string, number> = new Map();
  const previousEdge: Map<string, Edge> = new Map();
  const visited: Set<string> = new Set();

  distances.set(origin, 0);

  // Simple priority queue using array
  const pq: { node: string; cost: number }[] = [{ node: origin, cost: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.cost - b.cost);
    const { node: u, cost: currentCost } = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === destination) {
      // Reconstruct path
      const path: Edge[] = [];
      let curr = destination;
      while (curr !== origin && previousEdge.has(curr)) {
        const edge = previousEdge.get(curr)!;
        path.unshift(edge);
        curr = edge.from;
      }
      return path;
    }

    const neighbors = graph.getNeighbors(u);
    for (const edge of neighbors) {
      const v = edge.to;
      if (visited.has(v)) continue;

      const edgeKey = `${edge.from}->${edge.to}`;
      const penalty = penaltyMap.get(edgeKey) || 0;
      const weight = edge.travelTimeMin + penalty;
      const newDist = currentCost + weight;

      if (!distances.has(v) || newDist < distances.get(v)!) {
        distances.set(v, newDist);
        previousEdge.set(v, edge);
        pq.push({ node: v, cost: newDist });
      }
    }
  }

  return null;
}

function buildCandidateFromEdges(
  graph: TransitGraph,
  edges: Edge[],
  index: number
): CandidateRoute {
  let totalDuration = 0;
  let totalDistance = 0;
  let transfers = 0;
  let lastRouteName = "";
  const segments: CandidateRoute["segments"] = [];
  const stopsList: CandidateRoute["stops"] = [];
  const geometry: [number, number][] = [];

  // Add initial origin stop
  const firstCoord = graph.getCoordinate(edges[0].from) || { lat: 28.6139, lng: 77.2090 };
  stopsList.push({
    name: edges[0].from,
    latitude: firstCoord.lat,
    longitude: firstCoord.lng,
    timeOffsetMin: 0,
  });
  geometry.push([firstCoord.lat, firstCoord.lng]);

  let currentSegment: any = null;

  for (const edge of edges) {
    totalDuration += edge.travelTimeMin;
    totalDistance += edge.distanceKm;

    if (lastRouteName && lastRouteName !== edge.routeName) {
      transfers++;
    }
    lastRouteName = edge.routeName;

    // Build or group segments
    if (!currentSegment || currentSegment.routeName !== edge.routeName) {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = {
        routeName: edge.routeName,
        mode: edge.mode,
        isAc: edge.isAc,
        fromStop: edge.from,
        toStop: edge.to,
        durationMin: edge.travelTimeMin,
        distanceKm: Math.round(edge.distanceKm * 10) / 10,
        intermediateStops: [edge.from, edge.to],
      };
    } else {
      currentSegment.toStop = edge.to;
      currentSegment.durationMin += edge.travelTimeMin;
      currentSegment.distanceKm = Math.round((currentSegment.distanceKm + edge.distanceKm) * 10) / 10;
      currentSegment.intermediateStops.push(edge.to);
    }

    const toCoord = graph.getCoordinate(edge.to) || {
      lat: edge.toLat || 28.6139,
      lng: edge.toLng || 77.2090,
    };
    stopsList.push({
      name: edge.to,
      latitude: toCoord.lat,
      longitude: toCoord.lng,
      timeOffsetMin: totalDuration,
    });
    geometry.push([toCoord.lat, toCoord.lng]);
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  const hasMetro = edges.some((e) => e.mode === "METRO");
  const hasBus = edges.some((e) => e.mode === "BUS");
  const primaryMode = hasMetro && hasBus ? "MULTIMODAL" : hasMetro ? "METRO" : "BUS";

  const firstRoute = segments[0]?.routeName || "Transit Option";
  const secondRoute = segments[1]?.routeName ? ` + ${segments[1].routeName}` : "";

  return {
    id: `route-opt-${index + 1}-${Date.now()}`,
    routeName: `${firstRoute}${secondRoute}`,
    primaryMode,
    totalDurationMin: totalDuration,
    totalDistanceKm: Math.round(totalDistance * 10) / 10,
    transfersCount: transfers,
    walkingDistanceMeters: transfers * 300,
    stops: stopsList,
    segments,
    geometry,
  };
}
