import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const DATASETS_DIR = path.resolve(__dirname, "../../datasets");

async function main() {
  console.log("Seeding CROWDLESS Database with Real Delhi Transport Data...");

  // Clean existing records in correct foreign-key order
  await prisma.crowdObservation.deleteMany({});
  await prisma.routeStop.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.historicalFootfall.deleteMany({});
  await prisma.station.deleteMany({});
  await prisma.busStop.deleteMany({});
  await prisma.metroLine.deleteMany({});

  // 1. Create Metro Lines
  const metroLines = [
    { name: "Yellow Line", code: "YELLOW", color: "#EAB308" },
    { name: "Blue Line", code: "BLUE", color: "#2563EB" },
    { name: "Red Line", code: "RED", color: "#DC2626" },
    { name: "Violet Line", code: "VIOLET", color: "#7C3AED" },
    { name: "Airport Express", code: "AIRPORT", color: "#F97316" },
    { name: "Pink Line", code: "PINK", color: "#EC4899" },
    { name: "Magenta Line", code: "MAGENTA", color: "#A855F7" },
  ];

  const lineMap: Record<string, string> = {};
  for (const line of metroLines) {
    const created = await prisma.metroLine.create({ data: line });
    lineMap[line.code] = created.id;
  }
  console.log(`Created ${metroLines.length} Metro Lines.`);

  // 2. Key Delhi Transit Stations & Bus Interchanges
  const stationsData = [
    {
      name: "Rajiv Chowk",
      hindiName: "राजीव चौक",
      code: "RC",
      latitude: 28.6328,
      longitude: 77.2197,
      mode: "INTERCHANGE",
      metroLineCode: "YELLOW",
      isInterchange: true,
      zone: "Central Delhi",
    },
    {
      name: "Kashmere Gate",
      hindiName: "कश्मीरी गेट",
      code: "KG",
      latitude: 28.6675,
      longitude: 77.2285,
      mode: "INTERCHANGE",
      metroLineCode: "YELLOW",
      isInterchange: true,
      zone: "North Delhi",
    },
    {
      name: "Central Secretariat",
      hindiName: "केंद्रीय सचिवालय",
      code: "CS",
      latitude: 28.6147,
      longitude: 77.2119,
      mode: "INTERCHANGE",
      metroLineCode: "YELLOW",
      isInterchange: true,
      zone: "Central Delhi",
    },
    {
      name: "Hauz Khas",
      hindiName: "हौज़ ख़ास",
      code: "HK",
      latitude: 28.5432,
      longitude: 77.2065,
      mode: "INTERCHANGE",
      metroLineCode: "YELLOW",
      isInterchange: true,
      zone: "South Delhi",
    },
    {
      name: "New Delhi Railway Station",
      hindiName: "नई दिल्ली",
      code: "NDLS",
      latitude: 28.6431,
      longitude: 77.2223,
      mode: "INTERCHANGE",
      metroLineCode: "YELLOW",
      isInterchange: true,
      zone: "Central Delhi",
    },
    {
      name: "Dhaula Kuan",
      hindiName: "धौला कुआँ",
      code: "DK",
      latitude: 28.5921,
      longitude: 77.1616,
      mode: "INTERCHANGE",
      metroLineCode: "AIRPORT",
      isInterchange: true,
      zone: "South West Delhi",
    },
    {
      name: "Anand Vihar ISBT",
      hindiName: "आनंद विहार",
      code: "AV",
      latitude: 28.6502,
      longitude: 77.3152,
      mode: "INTERCHANGE",
      metroLineCode: "BLUE",
      isInterchange: true,
      zone: "East Delhi",
    },
    {
      name: "Connaught Place / Shivaji Stadium",
      hindiName: "शिवाजी स्टेडियम",
      code: "CP",
      latitude: 28.6297,
      longitude: 77.2144,
      mode: "INTERCHANGE",
      metroLineCode: "AIRPORT",
      isInterchange: true,
      zone: "Central Delhi",
    },
    {
      name: "Saket Metro Station",
      hindiName: "साकेत",
      code: "SAK",
      latitude: 28.5209,
      longitude: 77.2014,
      mode: "METRO",
      metroLineCode: "YELLOW",
      isInterchange: false,
      zone: "South Delhi",
    },
    {
      name: "Karol Bagh",
      hindiName: "करोल बाग़",
      code: "KB",
      latitude: 28.6519,
      longitude: 77.1906,
      mode: "METRO",
      metroLineCode: "BLUE",
      isInterchange: false,
      zone: "Central Delhi",
    },
    {
      name: "Chandni Chowk",
      hindiName: "चाँदनी चौक",
      code: "CC",
      latitude: 28.6578,
      longitude: 77.2301,
      mode: "METRO",
      metroLineCode: "YELLOW",
      isInterchange: false,
      zone: "North Delhi",
    },
    {
      name: "AIIMS",
      hindiName: "एम्स",
      code: "AIIMS",
      latitude: 28.5684,
      longitude: 77.2081,
      mode: "METRO",
      metroLineCode: "YELLOW",
      isInterchange: false,
      zone: "South Delhi",
    },
    {
      name: "INA / Dilli Haat",
      hindiName: "आईएनए",
      code: "INA",
      latitude: 28.5744,
      longitude: 77.2104,
      mode: "INTERCHANGE",
      metroLineCode: "YELLOW",
      isInterchange: true,
      zone: "South Delhi",
    },
    {
      name: "Nehru Place",
      hindiName: "नेहरू प्लेस",
      code: "NP",
      latitude: 28.5492,
      longitude: 77.2514,
      mode: "INTERCHANGE",
      metroLineCode: "VIOLET",
      isInterchange: true,
      zone: "South East Delhi",
    },
    {
      name: "Badarpur Border",
      hindiName: "बदरपुर बॉर्डर",
      code: "BDP",
      latitude: 28.4912,
      longitude: 77.3032,
      mode: "INTERCHANGE",
      metroLineCode: "VIOLET",
      isInterchange: true,
      zone: "South East Delhi",
    },
    {
      name: "Noida Sector 18",
      hindiName: "नोएडा सेक्टर 18",
      code: "N18",
      latitude: 28.5708,
      longitude: 77.3261,
      mode: "METRO",
      metroLineCode: "BLUE",
      isInterchange: false,
      zone: "Noida",
    },
    {
      name: "Botanical Garden",
      hindiName: "बॉटनिकल गार्डन",
      code: "BG",
      latitude: 28.5641,
      longitude: 77.3342,
      mode: "INTERCHANGE",
      metroLineCode: "BLUE",
      isInterchange: true,
      zone: "Noida",
    },
    {
      name: "Lajpat Nagar",
      hindiName: "लाजपत नगर",
      code: "LPN",
      latitude: 28.5700,
      longitude: 77.2376,
      mode: "INTERCHANGE",
      metroLineCode: "VIOLET",
      isInterchange: true,
      zone: "South Delhi",
    },
    {
      name: "Hamdard Nagar / Sangam Vihar",
      hindiName: "हमदर्द नगर",
      code: "HMD",
      latitude: 28.5146,
      longitude: 77.2482,
      mode: "BUS_TERMINAL",
      metroLineCode: null,
      isInterchange: false,
      zone: "South Delhi",
    },
    {
      name: "Mehrauli Terminal",
      hindiName: "महरौली टर्मिनल",
      code: "MHL",
      latitude: 28.5244,
      longitude: 77.1855,
      mode: "BUS_TERMINAL",
      metroLineCode: null,
      isInterchange: false,
      zone: "South Delhi",
    },
    {
      name: "Mahipal Pur",
      hindiName: "महिपालपुर",
      code: "MHP",
      latitude: 28.5437,
      longitude: 77.1264,
      mode: "BUS_TERMINAL",
      metroLineCode: null,
      isInterchange: false,
      zone: "South West Delhi",
    },
    {
      name: "Kapashera Border",
      hindiName: "कपासहेड़ा बॉर्डर",
      code: "KPS",
      latitude: 28.5152,
      longitude: 77.0851,
      mode: "BUS_TERMINAL",
      metroLineCode: null,
      isInterchange: false,
      zone: "South West Delhi",
    },
    {
      name: "West Patel Nagar",
      hindiName: "वेस्ट पटेल नगर",
      code: "WPN",
      latitude: 28.6543,
      longitude: 77.1643,
      mode: "METRO",
      metroLineCode: "BLUE",
      isInterchange: false,
      zone: "West Delhi",
    },
    {
      name: "Mori Gate Terminal",
      hindiName: "मोरी गेट",
      code: "MGT",
      latitude: 28.6653,
      longitude: 77.2255,
      mode: "BUS_TERMINAL",
      metroLineCode: null,
      isInterchange: false,
      zone: "North Delhi",
    },
    {
      name: "Ambedkar Nagar Depot",
      hindiName: "अम्बेडकर नगर",
      code: "AND",
      latitude: 28.5218,
      longitude: 77.2325,
      mode: "BUS_TERMINAL",
      metroLineCode: null,
      isInterchange: false,
      zone: "South Delhi",
    },
  ];

  for (const s of stationsData) {
    await prisma.station.create({
      data: {
        name: s.name,
        hindiName: s.hindiName,
        code: s.code,
        latitude: s.latitude,
        longitude: s.longitude,
        mode: s.mode,
        metroLineId: s.metroLineCode ? lineMap[s.metroLineCode] : null,
        isInterchange: s.isInterchange,
        zone: s.zone,
      },
    });
  }
  console.log(`Created ${stationsData.length} Transit Stations.`);

  // 3. Define Multimodal Routes (Both Delhi Metro & High-Capacity DTC Buses)
  const routesData = [
    // METRO ROUTES
    {
      name: "Yellow Line Express",
      routeType: "METRO",
      agency: "DMRC",
      isAc: true,
      startStopName: "Kashmere Gate",
      endStopName: "Saket Metro Station",
      totalStops: 8,
      avgTravelTimeMin: 34,
      stops: [
        { name: "Kashmere Gate", lat: 28.6675, lng: 77.2285, dist: 0.0, time: 0 },
        { name: "Chandni Chowk", lat: 28.6578, lng: 77.2301, dist: 1.4, time: 3 },
        { name: "New Delhi Railway Station", lat: 28.6431, lng: 77.2223, dist: 3.2, time: 7 },
        { name: "Rajiv Chowk", lat: 28.6328, lng: 77.2197, dist: 4.8, time: 11 },
        { name: "Central Secretariat", lat: 28.6147, lng: 77.2119, dist: 6.9, time: 16 },
        { name: "INA / Dilli Haat", lat: 28.5744, lng: 77.2104, dist: 11.2, time: 24 },
        { name: "AIIMS", lat: 28.5684, lng: 77.2081, dist: 12.1, time: 26 },
        { name: "Hauz Khas", lat: 28.5432, lng: 77.2065, dist: 15.0, time: 30 },
        { name: "Saket Metro Station", lat: 28.5209, lng: 77.2014, dist: 18.2, time: 34 },
      ],
    },
    {
      name: "Blue Line Main",
      routeType: "METRO",
      agency: "DMRC",
      isAc: true,
      startStopName: "Anand Vihar ISBT",
      endStopName: "West Patel Nagar",
      totalStops: 5,
      avgTravelTimeMin: 36,
      stops: [
        { name: "Anand Vihar ISBT", lat: 28.6502, lng: 77.3152, dist: 0.0, time: 0 },
        { name: "Rajiv Chowk", lat: 28.6328, lng: 77.2197, dist: 11.5, time: 22 },
        { name: "Karol Bagh", lat: 28.6519, lng: 77.1906, dist: 14.8, time: 29 },
        { name: "West Patel Nagar", lat: 28.6543, lng: 77.1643, dist: 17.5, time: 36 },
      ],
    },
    {
      name: "Airport Express Line",
      routeType: "METRO",
      agency: "DMRC",
      isAc: true,
      startStopName: "New Delhi Railway Station",
      endStopName: "Dhaula Kuan",
      totalStops: 3,
      avgTravelTimeMin: 14,
      stops: [
        { name: "New Delhi Railway Station", lat: 28.6431, lng: 77.2223, dist: 0.0, time: 0 },
        { name: "Connaught Place / Shivaji Stadium", lat: 28.6297, lng: 77.2144, dist: 2.1, time: 4 },
        { name: "Dhaula Kuan", lat: 28.5921, lng: 77.1616, dist: 9.8, time: 14 },
      ],
    },
    {
      name: "Violet Line South",
      routeType: "METRO",
      agency: "DMRC",
      isAc: true,
      startStopName: "Kashmere Gate",
      endStopName: "Badarpur Border",
      totalStops: 6,
      avgTravelTimeMin: 42,
      stops: [
        { name: "Kashmere Gate", lat: 28.6675, lng: 77.2285, dist: 0.0, time: 0 },
        { name: "Central Secretariat", lat: 28.6147, lng: 77.2119, dist: 6.8, time: 15 },
        { name: "Lajpat Nagar", lat: 28.5700, lng: 77.2376, dist: 12.0, time: 25 },
        { name: "Nehru Place", lat: 28.5492, lng: 77.2514, dist: 15.2, time: 32 },
        { name: "Badarpur Border", lat: 28.4912, lng: 77.3032, dist: 24.5, time: 42 },
      ],
    },

    // DTC BUS ROUTES (Derived directly from real October 2026 Delhi ticket data)
    {
      name: "717AUP",
      routeType: "BUS",
      agency: "DTC",
      isAc: true,
      startStopName: "Hamdard Nagar / Sangam Vihar",
      endStopName: "Connaught Place / Shivaji Stadium",
      totalStops: 6,
      avgTravelTimeMin: 52,
      stops: [
        { name: "Hamdard Nagar / Sangam Vihar", lat: 28.5146, lng: 77.2482, dist: 0.0, time: 0 },
        { name: "Saket Metro Station", lat: 28.5209, lng: 77.2014, dist: 4.8, time: 12 },
        { name: "Hauz Khas", lat: 28.5432, lng: 77.2065, dist: 7.9, time: 22 },
        { name: "AIIMS", lat: 28.5684, lng: 77.2081, dist: 11.2, time: 32 },
        { name: "Central Secretariat", lat: 28.6147, lng: 77.2119, dist: 16.5, time: 44 },
        { name: "Connaught Place / Shivaji Stadium", lat: 28.6297, lng: 77.2144, dist: 19.0, time: 52 },
      ],
    },
    {
      name: "729UP",
      routeType: "BUS",
      agency: "DTC",
      isAc: true,
      startStopName: "Kapashera Border",
      endStopName: "Mori Gate Terminal",
      totalStops: 6,
      avgTravelTimeMin: 68,
      stops: [
        { name: "Kapashera Border", lat: 28.5152, lng: 77.0851, dist: 0.0, time: 0 },
        { name: "Mahipal Pur", lat: 28.5437, lng: 77.1264, dist: 5.6, time: 15 },
        { name: "Dhaula Kuan", lat: 28.5921, lng: 77.1616, dist: 12.4, time: 32 },
        { name: "Karol Bagh", lat: 28.6519, lng: 77.1906, dist: 20.1, time: 50 },
        { name: "New Delhi Railway Station", lat: 28.6431, lng: 77.2223, dist: 23.5, time: 59 },
        { name: "Mori Gate Terminal", lat: 28.6653, lng: 77.2255, dist: 26.8, time: 68 },
      ],
    },
    {
      name: "534UP",
      routeType: "BUS",
      agency: "DTC",
      isAc: false,
      startStopName: "Anand Vihar ISBT",
      endStopName: "Connaught Place / Shivaji Stadium",
      totalStops: 4,
      avgTravelTimeMin: 48,
      stops: [
        { name: "Anand Vihar ISBT", lat: 28.6502, lng: 77.3152, dist: 0.0, time: 0 },
        { name: "New Delhi Railway Station", lat: 28.6431, lng: 77.2223, dist: 11.2, time: 32 },
        { name: "Rajiv Chowk", lat: 28.6328, lng: 77.2197, dist: 13.0, time: 40 },
        { name: "Connaught Place / Shivaji Stadium", lat: 28.6297, lng: 77.2144, dist: 14.5, time: 48 },
      ],
    },
    {
      name: "511AUP",
      routeType: "BUS",
      agency: "DTC",
      isAc: true,
      startStopName: "Badarpur Border",
      endStopName: "Dhaula Kuan",
      totalStops: 5,
      avgTravelTimeMin: 58,
      stops: [
        { name: "Badarpur Border", lat: 28.4912, lng: 77.3032, dist: 0.0, time: 0 },
        { name: "Nehru Place", lat: 28.5492, lng: 77.2514, dist: 9.3, time: 22 },
        { name: "Lajpat Nagar", lat: 28.5700, lng: 77.2376, dist: 12.5, time: 30 },
        { name: "AIIMS", lat: 28.5684, lng: 77.2081, dist: 16.0, time: 40 },
        { name: "Dhaula Kuan", lat: 28.5921, lng: 77.1616, dist: 23.5, time: 58 },
      ],
    },
    {
      name: "85UP",
      routeType: "BUS",
      agency: "DTC",
      isAc: false,
      startStopName: "West Patel Nagar",
      endStopName: "Anand Vihar ISBT",
      totalStops: 5,
      avgTravelTimeMin: 54,
      stops: [
        { name: "West Patel Nagar", lat: 28.6543, lng: 77.1643, dist: 0.0, time: 0 },
        { name: "Karol Bagh", lat: 28.6519, lng: 77.1906, dist: 2.7, time: 8 },
        { name: "Rajiv Chowk", lat: 28.6328, lng: 77.2197, dist: 6.0, time: 20 },
        { name: "New Delhi Railway Station", lat: 28.6431, lng: 77.2223, dist: 7.5, time: 26 },
        { name: "Anand Vihar ISBT", lat: 28.6502, lng: 77.3152, dist: 19.2, time: 54 },
      ],
    },
  ];

  // Load real route summaries if available
  let routeSummaries: any = {};
  const summaryPath = path.join(DATASETS_DIR, "route_crowd_summary.json");
  if (fs.existsSync(summaryPath)) {
    try {
      routeSummaries = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
      console.log(`Loaded ${Object.keys(routeSummaries).length} real route summaries from October data.`);
    } catch (e) {
      console.warn("Could not parse route summary file:", e);
    }
  }

  for (const r of routesData) {
    const createdRoute = await prisma.route.create({
      data: {
        name: r.name,
        routeType: r.routeType,
        agency: r.agency,
        isAc: r.isAc,
        startStopName: r.startStopName,
        endStopName: r.endStopName,
        totalStops: r.totalStops,
        avgTravelTimeMin: r.avgTravelTimeMin,
      },
    });

    // Create route stops
    for (let i = 0; i < r.stops.length; i++) {
      const s = r.stops[i];
      await prisma.routeStop.create({
        data: {
          routeId: createdRoute.id,
          stopName: s.name,
          stopSequence: i + 1,
          latitude: s.lat,
          longitude: s.lng,
          distanceFromStartKm: s.dist,
          travelTimeMin: s.time,
        },
      });
    }

    // Populate 24-hour Crowd Observations
    const rSummary = routeSummaries[r.name];
    for (let hour = 0; hour < 24; hour++) {
      const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
      let crowdRatio = isPeak ? 0.72 : 0.28;
      let avgLoad = Math.round(crowdRatio * 65);
      let crowdCategory = crowdRatio > 0.65 ? "Crowded" : crowdRatio > 0.35 ? "Standing Room" : "Seats Available";
      let source = "DEMO";

      if (rSummary && rSummary.hourly && rSummary.hourly[hour]) {
        crowdRatio = rSummary.hourly[hour].crowd_ratio;
        avgLoad = rSummary.hourly[hour].avg_load;
        crowdCategory = rSummary.hourly[hour].crowd_category;
        source = "OBSERVED";
      } else if (r.routeType === "METRO") {
        crowdRatio = isPeak ? 0.78 : 0.35;
        avgLoad = isPeak ? 210 : 85;
        crowdCategory = isPeak ? "Crowded" : "Seats Available";
        source = "PREDICTED";
      }

      const crowdLevel = crowdRatio > 0.65 ? "HIGH" : crowdRatio > 0.35 ? "MODERATE" : "LOW";

      await prisma.crowdObservation.create({
        data: {
          routeId: createdRoute.id,
          hour,
          isWeekend: false,
          isAc: r.isAc,
          avgLoad,
          crowdRatio,
          crowdCategory,
          crowdLevel,
          source,
        },
      });
    }
  }

  // 4. Historical Footfall for Stations
  for (const s of stationsData.slice(0, 15)) {
    for (let h = 6; h <= 23; h++) {
      const isPeak = (h >= 8 && h <= 10) || (h >= 17 && h <= 20);
      const mult = isPeak ? 2.8 : 0.9;
      const baseBoardings = s.isInterchange ? 450 : 180;
      await prisma.historicalFootfall.create({
        data: {
          stationName: s.name,
          hour: h,
          isWeekend: false,
          boardings: Math.round(baseBoardings * mult + (Math.random() * 30)),
          alightings: Math.round(baseBoardings * mult * 0.95 + (Math.random() * 25)),
          peakStatus: isPeak ? "PEAK" : "OFF_PEAK",
        },
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
