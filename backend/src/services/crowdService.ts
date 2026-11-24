import axios from "axios";
import prisma from "../prisma";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

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

export async function getSegmentCrowd(
  routeName: string,
  hour: number,
  isWeekend: boolean = false,
  isAc: boolean = true
): Promise<SegmentCrowd> {
  // 1. Try FastAPI ML Microservice
  try {
    const res = await axios.post(`${ML_SERVICE_URL}/predict`, {
      route: routeName,
      hour,
      is_weekend: isWeekend,
      is_ac: isAc,
    }, { timeout: 1500 });

    if (res.data) {
      return {
        route: res.data.route,
        hour: res.data.hour,
        crowdRatio: res.data.crowd_ratio,
        crowdPercentage: res.data.crowd_percentage,
        crowdLevel: res.data.crowd_level,
        crowdCategory: res.data.crowd_category,
        avgOnboardLoad: res.data.avg_onboard_load,
        status: res.data.status,
        modelUsed: res.data.model_used,
        confidenceScore: res.data.confidence_score,
        recommendationNote: res.data.recommendation_note,
      };
    }
  } catch (err) {
    // Fall through to local database cache
  }

  // 2. Query SQLite crowd observations
  const obs = await prisma.crowdObservation.findFirst({
    where: {
      route: { name: routeName },
      hour,
    },
  });

  if (obs) {
    return {
      route: routeName,
      hour,
      crowdRatio: obs.crowdRatio,
      crowdPercentage: Math.round(obs.crowdRatio * 100),
      crowdLevel: obs.crowdLevel as any,
      crowdCategory: obs.crowdCategory as any,
      avgOnboardLoad: obs.avgLoad,
      status: obs.source as any,
      modelUsed: "Prisma SQLite Cache (Historical October Data)",
      confidenceScore: 0.94,
      recommendationNote: "Direct historical observation from local database.",
    };
  }

  // 3. Fallback baseline
  const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
  const ratio = isPeak ? 0.68 : 0.30;
  return {
    route: routeName,
    hour,
    crowdRatio: ratio,
    crowdPercentage: Math.round(ratio * 100),
    crowdLevel: isPeak ? "HIGH" : "LOW",
    crowdCategory: isPeak ? "Crowded" : "Seats Available",
    avgOnboardLoad: Math.round(ratio * 65),
    status: "DEMO",
    modelUsed: "Temporal Fallback Baseline",
    confidenceScore: 0.70,
    recommendationNote: "Temporal baseline estimate based on standard Delhi peak hours.",
  };
}
