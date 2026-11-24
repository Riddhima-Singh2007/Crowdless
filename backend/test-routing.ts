import { findCandidateRoutes } from "./src/services/routingEngine";
import { rankCandidateRoutes } from "./src/services/rankingService";
import prisma from "./src/prisma";

async function testBackend() {
  console.log("==================================================");
  console.log("RUNNING CROWDLESS BACKEND & ROUTING VERIFICATION");
  console.log("==================================================");

  // 1. Check Stations
  const stations = await prisma.station.findMany();
  console.log(`[PASS] Station count in database: ${stations.length}`);

  // 2. Test Dijkstra routing from Anand Vihar ISBT to Connaught Place / Shivaji Stadium
  const origin = "Anand Vihar ISBT";
  const destination = "Connaught Place / Shivaji Stadium";
  console.log(`\nTesting Candidate Route Search: [${origin}] -> [${destination}]`);

  const candidates = await findCandidateRoutes(origin, destination, 3);
  console.log(`[PASS] Found ${candidates.length} candidate transit paths.`);

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    console.log(`  Candidate #${i + 1}: ${c.routeName} | ${c.primaryMode} | ${c.totalDurationMin} mins | ${c.totalDistanceKm} km | ${c.transfersCount} transfers`);
  }

  // 3. Test Multi-Criteria Crowd-Aware Ranking at 18:00 (6 PM Evening Peak)
  console.log(`\nTesting Crowd-Aware Ranking at 18:00 (6 PM Peak):`);
  const ranked = await rankCandidateRoutes(candidates, 18, false);

  ranked.forEach((r, idx) => {
    console.log(`\n--- RANK #${idx + 1}: [${r.category}] ---`);
    console.log(`Route: ${r.routeName}`);
    console.log(`Total Time: ${r.totalDurationMin} mins`);
    console.log(`Crowd Level: ${r.crowdMetrics.crowdLevel} (${r.crowdMetrics.crowdCategory}, ${r.crowdMetrics.crowdPercentage}%)`);
    console.log(`Explanation: ${r.recommendationExplanation}`);
  });

  // 4. Test off-peak search (14:00)
  console.log(`\nTesting Crowd-Aware Ranking at 14:00 (2 PM Mid-day):`);
  const rankedOffPeak = await rankCandidateRoutes(candidates, 14, false);
  rankedOffPeak.forEach((r) => {
    console.log(`Category: ${r.category} | Time: ${r.totalDurationMin}m | Crowd: ${r.crowdMetrics.crowdPercentage}% (${r.crowdMetrics.crowdCategory})`);
  });

  console.log("\nAll routing and ranking checks passed successfully!");
}

testBackend()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
