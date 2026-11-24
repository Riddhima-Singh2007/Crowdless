# PROJECT PROPOSAL: CROWDLESS
## Move smarter. Travel calmer.
### Delhi Transport Stack Hackathon — Problem 2: Crowdedness-Aware Journey Planner

---

### 1. Problem Statement
Public transport journey planners in Delhi NCR (Google Maps, Delhi Metro official app, One Delhi) calculate routes solely by scheduled trip duration and number of transfers. In reality, a packed bus or train creates physical discomfort, slow boarding, high stress, and unpredictable delays. Commuters frequently pass up packed vehicles to wait for an emptier one, yet no tool currently quantifies or previews crowding before they travel.

### 2. Proposed Solution: CROWDLESS
CROWDLESS is an intelligent, crowd-aware transit journey planner that balances journey time against passenger comfort. It empowers commuters to compare transit alternatives across three intuitive categories:
1. **FASTEST ROUTE:** Quickest transit path for time-sensitive travel.
2. **LEAST CROWDED ROUTE:** Maximizes seated comfort and minimizes physical crowding.
3. **BEST BALANCED ROUTE:** The optimal compromise between reasonable travel time and low crowd exposure.

### 3. Key Innovations
1. **Empirical Data Grounding:** Trained on 2.56 million official October 2026 ETM and e-ticketing transactions provided by Delhi Transport Stack.
2. **Pass-Holder Calibration Multiplier:** Applies a 1.38x calibration factor to incorporate unrecorded Pink tickets (women concession) and student pass-holders.
3. **High-Accuracy ML Model:** Deploys a tuned `RandomForestRegressor` with a Mean Absolute Error of 0.0168 (1.68% error) across 2,259 bus routes.
4. **Graph-Based Multimodal Routing:** Integrates both Delhi Metro lines and DTC bus routes into a unified Dijkstra routing graph with Yen's alternative path generation.
5. **Modern Commuter UI:** Interactive MapLibre GL map with OpenStreetMap tiles, station autocomplete, Recharts analytics, and clear status provenance (`OBSERVED`, `PREDICTED`, `DEMO`).

### 4. Target Audience & Impact
- **Delhi Commuters:** Make informed, stress-free daily commute decisions.
- **Transport Authorities (DTC & DMRC):** Identify overloaded bottlenecks, peak-hour standing hot-spots, and under-utilized corridors for fleet reallocation.
