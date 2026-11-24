import { CandidateRoute } from "./routingEngine";
import { getSegmentCrowd, SegmentCrowd } from "./crowdService";

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
  isPinkTicketEligible: boolean; // Zero fare for female commuters on Delhi buses
  fareCategory: "STANDARD_BUS" | "AC_BUS" | "METRO_RAIL" | "MULTIMODAL";
}

export interface RankedRoute extends CandidateRoute {
  category: "FASTEST" | "LEAST_CROWDED" | "BEST_BALANCED";
  categoryBadge: string;
  badgeColor: string; // Tailwind color classes
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
  segmentCrowds: SegmentCrowd[];
  rankingScore: number;
  recommendationExplanation: string;
  comfortRatingStars: number;
}

export async function rankCandidateRoutes(
  candidates: CandidateRoute[],
  departureHour: number,
  isWeekend: boolean = false
): Promise<RankedRoute[]> {
  if (candidates.length === 0) return [];

  // 1. Fetch crowd data for all segments of all candidate routes
  const evaluatedCandidates: {
    candidate: CandidateRoute;
    segmentCrowds: SegmentCrowd[];
    avgCrowdRatio: number;
    maxCrowdRatio: number;
    dominantStatus: "OBSERVED" | "PREDICTED" | "DEMO";
    primaryModel: string;
    bottleneckSegment: string;
  }[] = [];

  for (const c of candidates) {
    const sCrowds: SegmentCrowd[] = [];
    let weightedCrowdSum = 0;
    let totalDur = 0;
    let maxRatio = 0;
    let bottleneck = "";
    let dominantStatus: "OBSERVED" | "PREDICTED" | "DEMO" = "PREDICTED";
    let primaryModel = "RandomForestRegressor";

    for (const seg of c.segments) {
      if (seg.mode === "TRANSFER") continue;

      const sc = await getSegmentCrowd(seg.routeName, departureHour, isWeekend, seg.isAc);
      sCrowds.push(sc);

      const dur = Math.max(1, seg.durationMin);
      weightedCrowdSum += sc.crowdRatio * dur;
      totalDur += dur;

      if (sc.crowdRatio > maxRatio) {
        maxRatio = sc.crowdRatio;
        bottleneck = `${seg.fromStop} → ${seg.toStop} (${seg.routeName})`;
      }

      if (sc.status === "OBSERVED") {
        dominantStatus = "OBSERVED";
        primaryModel = sc.modelUsed;
      }
    }

    const avgRatio = totalDur > 0 ? weightedCrowdSum / totalDur : 0.4;

    evaluatedCandidates.push({
      candidate: c,
      segmentCrowds: sCrowds,
      avgCrowdRatio: Math.round(avgRatio * 1000) / 1000,
      maxCrowdRatio: Math.round(maxRatio * 1000) / 1000,
      dominantStatus,
      primaryModel,
      bottleneckSegment: bottleneck || `${c.segments[0]?.fromStop} corridor`,
    });
  }

  // 2. Identify min/max travel durations for normalization
  const durations = evaluatedCandidates.map((e) => e.candidate.totalDurationMin);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const durationSpan = Math.max(1, maxDuration - minDuration);

  // 3. Score candidates on different criteria
  const scored = evaluatedCandidates.map((item) => {
    const normTime = (item.candidate.totalDurationMin - minDuration) / durationSpan;
    const normCrowd = item.avgCrowdRatio;
    const normTransfer = item.candidate.transfersCount * 0.25;

    // Cost functions (lower is better)
    const fastestCost = normTime * 0.8 + normCrowd * 0.15 + normTransfer * 0.05;
    const leastCrowdedCost = normCrowd * 0.8 + normTime * 0.15 + normTransfer * 0.05;
    const balancedCost = normTime * 0.45 + normCrowd * 0.4 + normTransfer * 0.15;

    return {
      ...item,
      normTime,
      normCrowd,
      normTransfer,
      fastestCost,
      leastCrowdedCost,
      balancedCost,
    };
  });

  // Assign categories distinctly
  const fastestItem = [...scored].sort((a, b) => a.fastestCost - b.fastestCost)[0];

  const remainingForLeast = scored.filter((x) => x.candidate.id !== fastestItem.candidate.id);
  const leastCrowdedItem =
    remainingForLeast.length > 0
      ? [...remainingForLeast].sort((a, b) => a.leastCrowdedCost - b.leastCrowdedCost)[0]
      : fastestItem;

  const remainingForBalanced = scored.filter(
    (x) => x.candidate.id !== fastestItem.candidate.id && x.candidate.id !== leastCrowdedItem.candidate.id
  );
  const balancedItem =
    remainingForBalanced.length > 0
      ? [...remainingForBalanced].sort((a, b) => a.balancedCost - b.balancedCost)[0]
      : scored.find((x) => x.candidate.id !== fastestItem.candidate.id) || fastestItem;

  const rankedRoutes: RankedRoute[] = [];

  const createRankedObj = (
    item: typeof scored[0],
    category: "FASTEST" | "LEAST_CROWDED" | "BEST_BALANCED"
  ): RankedRoute => {
    const crowdPercentage = Math.round(item.avgCrowdRatio * 100);
    const crowdLevel: "LOW" | "MODERATE" | "HIGH" =
      item.avgCrowdRatio < 0.35 ? "LOW" : item.avgCrowdRatio < 0.65 ? "MODERATE" : "HIGH";
    const crowdCategory: "Seats Available" | "Standing Room" | "Crowded" =
      crowdLevel === "LOW" ? "Seats Available" : crowdLevel === "MODERATE" ? "Standing Room" : "Crowded";

    // 1. FARE PER HEAD CALCULATION
    const isBus = item.candidate.primaryMode === "BUS";
    const isMetro = item.candidate.primaryMode === "METRO";
    const hasAc = item.candidate.segments.some((s) => s.isAc);

    let ticketFarePerHead = 25;
    let fareCategory: FareInfo["fareCategory"] = "AC_BUS";

    if (isMetro) {
      ticketFarePerHead = 40;
      fareCategory = "METRO_RAIL";
    } else if (item.candidate.primaryMode === "MULTIMODAL") {
      ticketFarePerHead = 35;
      fareCategory = "MULTIMODAL";
    } else if (!hasAc) {
      ticketFarePerHead = 15;
      fareCategory = "STANDARD_BUS";
    }

    const fareInfo: FareInfo = {
      farePerHead: ticketFarePerHead,
      currency: "₹",
      isPinkTicketEligible: isBus || item.candidate.primaryMode === "MULTIMODAL",
      fareCategory,
    };

    // 2. BUS AVAILABILITY & NEXT VEHICLE TRACKING
    const isPeak = (departureHour >= 8 && departureHour <= 10) || (departureHour >= 17 && departureHour <= 20);
    const nextBusInMinutes =
      category === "FASTEST" ? 5 : category === "LEAST_CROWDED" ? 12 : 8;

    const sampleBusPlates = [
      "DL 1PD 4829",
      "DL 1PC 7712",
      "DL 1PB 9021",
      "DL 1PD 5421",
      "DL 1PC 3318",
    ];
    const assignedVehicle = isMetro
      ? "DMRC Train #TR-804 (8-Coach)"
      : sampleBusPlates[Math.abs(item.candidate.routeName.length * 7) % sampleBusPlates.length];

    const busType = isMetro
      ? "DMRC Air-Conditioned Metro"
      : hasAc
      ? "DTC Low-Floor AC Electric (12m)"
      : "DTC Standard Low-Floor Bus (12m)";

    const totalSeats = isMetro ? 280 : 35;
    const availableSeatsCount = Math.max(
      2,
      Math.round(totalSeats * Math.max(0.08, 1 - item.avgCrowdRatio))
    );

    const estDepMinutes = (departureHour * 60 + 15 + nextBusInMinutes) % 1440;
    const depH = Math.floor(estDepMinutes / 60);
    const depM = estDepMinutes % 60;
    const estimatedDepartureTime = `${depH.toString().padStart(2, "0")}:${depM
      .toString()
      .padStart(2, "0")}`;

    const busAvailability: BusAvailabilityInfo = {
      nextBusInMinutes,
      estimatedDepartureTime,
      frequencyMinutes: isMetro ? 4 : isPeak ? 8 : 12,
      activeBusesCount: isMetro ? 14 : isPeak ? 6 : 4,
      vehicleNumber: assignedVehicle,
      busType,
      totalSeats,
      availableSeatsCount,
    };

    let badge = "Fastest Route";
    let badgeColor = "bg-sky-50 text-[#315C76] border-[#315C76]/20";
    let explanation = "";
    let stars = 3;

    if (category === "FASTEST") {
      badge = "Fastest Route";
      badgeColor = "bg-sky-50 text-primary border-primary/30";
      explanation = `Saves travel time with an estimated duration of ${item.candidate.totalDurationMin} mins. Primary mode is ${item.candidate.primaryMode}. Note: ${item.bottleneckSegment} may experience higher passenger density.`;
      stars = crowdLevel === "LOW" ? 5 : crowdLevel === "MODERATE" ? 4 : 3;
    } else if (category === "LEAST_CROWDED") {
      badge = "Least Crowded";
      badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-300";
      explanation = `Prioritizes commuter comfort with average crowd ratio of ${crowdPercentage}%. High seat availability (${availableSeatsCount} seats open) with calm boarding conditions.`;
      stars = 5;
    } else {
      badge = "Best Balanced";
      badgeColor = "bg-purple-50 text-purple-800 border-purple-300";
      explanation = `Optimal compromise between reasonable trip duration (${item.candidate.totalDurationMin} mins) and manageable crowd exposure (${crowdPercentage}% load).`;
      stars = 4;
    }

    return {
      ...item.candidate,
      category,
      categoryBadge: badge,
      badgeColor,
      ticketFarePerHead,
      fareInfo,
      busAvailability,
      crowdMetrics: {
        avgCrowdRatio: item.avgCrowdRatio,
        crowdPercentage,
        crowdLevel,
        crowdCategory,
        status: item.dominantStatus,
        modelUsed: item.primaryModel,
        confidenceScore: item.dominantStatus === "OBSERVED" ? 0.95 : 0.90,
        bottleneckSegment: item.bottleneckSegment,
      },
      segmentCrowds: item.segmentCrowds,
      rankingScore:
        category === "FASTEST"
          ? item.fastestCost
          : category === "LEAST_CROWDED"
          ? item.leastCrowdedCost
          : item.balancedCost,
      recommendationExplanation: explanation,
      comfortRatingStars: stars,
    };
  };

  rankedRoutes.push(createRankedObj(fastestItem, "FASTEST"));

  if (leastCrowdedItem.candidate.id !== fastestItem.candidate.id) {
    rankedRoutes.push(createRankedObj(leastCrowdedItem, "LEAST_CROWDED"));
  }

  if (
    balancedItem.candidate.id !== fastestItem.candidate.id &&
    balancedItem.candidate.id !== leastCrowdedItem.candidate.id
  ) {
    rankedRoutes.push(createRankedObj(balancedItem, "BEST_BALANCED"));
  }

  return rankedRoutes;
}
