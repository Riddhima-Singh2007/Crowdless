export interface Station {
  id: string;
  name: string;
  hindiName?: string;
  code?: string;
  latitude: number;
  longitude: number;
  mode: "METRO" | "BUS_TERMINAL" | "INTERCHANGE";
  isInterchange: boolean;
  zone?: string;
  wheelchair: boolean;
  metroLine?: {
    name: string;
    code: string;
    color: string;
  } | null;
}

export interface Segment {
  routeName: string;
  mode: "BUS" | "METRO" | "TRANSFER";
  isAc: boolean;
  fromStop: string;
  toStop: string;
  durationMin: number;
  distanceKm: number;
  intermediateStops: string[];
}

export interface SegmentCrowd {
  route: string;
  hour: number;
  crowdRatio: number;
  crowdPercentage: number;
  crowdLevel: "LOW" | "MODERATE" | "HIGH";
  crowdCategory: "Seats Available" | "Standing Room" | "Crowded";
  avgOnboardLoad: number;
  status: "OBSERVED" | "PREDICTED" | "DEMO";
  modelUsed: string;
  confidenceScore: number;
  recommendationNote: string;
}

export interface BusAvailabilityInfo {
  nextBusInMinutes: number;
  estimatedDepartureTime: string;
  frequencyMinutes: number;
  activeBusesCount: number;
  vehicleNumber: string;
  busType: string;
  totalSeats: number;
  availableSeatsCount: number;
}

export interface FareInfo {
  farePerHead: number;
  currency: string;
  isPinkTicketEligible: boolean;
  fareCategory: "STANDARD_BUS" | "AC_BUS" | "METRO_RAIL" | "MULTIMODAL";
}

export interface RankedRoute {
  id: string;
  routeName: string;
  primaryMode: "BUS" | "METRO" | "MULTIMODAL";
  totalDurationMin: number;
  totalDistanceKm: number;
  transfersCount: number;
  walkingDistanceMeters: number;
  category: "FASTEST" | "LEAST_CROWDED" | "BEST_BALANCED";
  categoryBadge: string;
  badgeColor: string;
  ticketFarePerHead: number;
  fareInfo: FareInfo;
  busAvailability: BusAvailabilityInfo;
  crowdMetrics: {
    avgCrowdRatio: number;
    crowdPercentage: number;
    crowdLevel: "LOW" | "MODERATE" | "HIGH";
    crowdCategory: "Seats Available" | "Standing Room" | "Crowded";
    status: "OBSERVED" | "PREDICTED" | "DEMO";
    modelUsed: string;
    confidenceScore: number;
    bottleneckSegment?: string;
  };
  stops: {
    name: string;
    latitude: number;
    longitude: number;
    timeOffsetMin: number;
  }[];
  segments: Segment[];
  segmentCrowds: SegmentCrowd[];
  rankingScore: number;
  recommendationExplanation: string;
  comfortRatingStars: number;
  geometry: [number, number][]; // [lat, lng]
}

export interface RouteSearchResponse {
  query: {
    origin: string;
    destination: string;
    departureHour: number;
    departureTime: string;
    isWeekend: boolean;
    preferredMode: string;
  };
  totalOptions: number;
  recommendations: RankedRoute[];
}

export interface HourlyTrendPoint {
  hour: number;
  timeLabel: string;
  weekdayCrowdIndex: number;
  weekendCrowdIndex: number;
  weekdayStandingProbability: number;
  weekendStandingProbability: number;
  isPeak: boolean;
}
