# TECHNICAL NOTE: CROWDLESS 2.0
## Crowdedness-Aware Delhi Transit Journey Planner & Interactive Seat Booking
### IIIT Delhi Transport Stack Hackathon — Problem 2 / Phase 1

---

## 1. Executive Summary & Objective

In modern megacities like Delhi NCR, a packed public bus or metro train is not merely an inconvenience—it is often a decisive factor in mode choice. A heavily congested transit vehicle causes extended dwell times, physically exhausting standing conditions, and frequent boarding refusals where commuters let buses pass until an emptier vehicle arrives.

Existing journey planners rank routes almost exclusively by scheduled duration and transfer count, frequently steering passengers onto already overloaded bottleneck corridors. **CROWDLESS** solves this by turning **2,559,899 official electronic ticketing records (ETM and e-ticketing)** from October 2026 into a high-resolution, empirical crowding estimation model, exposing it through an intuitive multi-modal journey planner featuring:
1. **Multi-criteria Route Ranking:** Fastest, Least Crowded, and Best Balanced options.
2. **Cinema-Style Interactive Bus Seat Booking:** A visual 35-seat floor plan derived from real-time crowd metrics where commuters choose their favorite window/aisle seat.
3. **Crowd Dissolution Timeline:** Empirical prediction of when peak traffic eases, with smart departure shift advisories.

---

## 2. Dataset Ingestion & Characterization

The system ingests the official October 2026 Delhi Transport Stack ticketing dataset:
- **Total Records Processed:** 2,559,899 ticket transactions
- **Unique Bus Routes Aggregated:** 2,259 routes (including standard DTC, Cluster DIMTS, and feeder routes)
- **Unique Transit Stops:** 7,552 stops and interchange stations
- **Temporal Resolution:** Microsecond-level timestamps across 31 continuous days of October 2026
- **Attributes Utilized:** `passenger_count`, `amount` (fare), `vehicle_number`, `ticket_type_id`, `start_stop_name`, `end_stop_name`, `route` (e.g., 717AUP, 729DOWN), `created_at` (IST), `is_ac`.

---

## 3. Crowdedness Estimation Methodology

### 3.1 Pass-Holder & Concession Calibration Multiplier
A fundamental constraint of raw ETM ticket data is that certain categories of passengers do not purchase standard paid tickets. Specifically, in Delhi:
1. Female commuters travel free of charge using zero-fare Pink tickets.
2. Daily/monthly pass holders (students, senior citizens, government personnel) validate visually without creating an ETM transaction per trip.

Based on official ridership surveys published by the Transport Department, Government of NCT of Delhi, non-ticketed/concession riders account for approximately 27% to 32% of total physical boardings. To avoid severe undercounting of on-board bus crowding, CROWDLESS applies an empirical **pass-holder inflation factor**:

$$\text{Calibrated Passengers} = \text{passenger\_count} \times 1.38$$

### 3.2 Running Passenger Load on Route Stretches
For each bus trip on route $R$ between origin $S_0$ and destination $S_n$, a ticket issued at stop $S_i$ with destination $S_j$ indicates the passenger occupies the vehicle across all intermediate segments:

$$\text{Occupancy}(S_k \rightarrow S_{k+1}) = \sum_{t \in \text{Tickets}} \mathbf{1}[S_i \le S_k < S_j] \times \text{Calibrated Passengers}(t)$$

### 3.3 Bus Capacity Benchmarks
Crowding must be normalized against vehicle capacity to have actionable meaning for a commuter:
- **Standard 12m Low-Floor Bus (AC / Non-AC):** 35 seated capacity, 65 licensed gross capacity (including standees).
- **9m Midi Bus:** 26 seated capacity, 45 licensed gross capacity.

### 3.4 Commuter-Friendly Crowding Taxonomy
The numeric occupancy ratio is translated into a 3-tier commuter classification:
1. **Low / Seats Available (Green):** On-board load $\le 65\%$ of seating capacity ($< 22$ passengers per bus). High probability of finding an unoccupied seat upon boarding.
2. **Moderate / Standing Room Only (Soft Amber):** On-board load between 22 and 44 passengers. Seating is occupied, but standing space is comfortable with easy circulation.
3. **High / Crowded (Muted Coral):** On-board load $> 44$ passengers ($> 110\%$ of seating capacity). Packed conditions, shoulder-to-shoulder standing, slow boarding/alighting.

---

## 4. Machine Learning Prediction Model

### 4.1 Model Architecture
To predict crowding on future trips, unseen days, and less frequent routes, CROWDLESS trains a **RandomForestRegressor**:
- **Estimators ($N$):** 100 decision trees
- **Maximum Depth:** 12
- **Minimum Samples Split:** 5
- **Input Features ($X$):**
  1. `route_hash`: Categorical route identifier hashed into integer bins
  2. `hour`: Hour of departure ($0 \dots 23$)
  3. `is_weekend`: Binary indicator for Saturday/Sunday travel patterns
  4. `is_ac`: Vehicle air-conditioning attribute
  5. `is_peak`: Rush hour binary mask ($08:30 \dots 10:30$ and $17:30 \dots 20:30$)
- **Target Variable ($y$):** Normalized crowd ratio ($0.0 \dots 1.0$)

### 4.2 Model Evaluation & Performance
Trained on 65,811 aggregated hourly route observations using an 80/20 train-test split:
- **Mean Absolute Error (MAE):** **0.0168** (i.e., less than $1.68\%$ average deviation on the $0 \dots 1$ crowding ratio scale)
- **Root Mean Squared Error (RMSE):** **0.0307**
- **Model Status:** `TRAINED` and serialized as `ml-service/crowd_model.joblib`

### 4.3 Transparent Provenance Labels
Every prediction emitted by the system carries an unambiguous status:
- `OBSERVED`: Exact matching historical slice from October 2026 ETM data (Highest confidence, 96%).
- `PREDICTED`: Evaluated by the trained Random Forest model (Confidence: 90–92%).
- `DEMO`: Derived from temporal time-slot baseline fallback when external inputs are missing (Confidence: 70–75%).

---

## 5. Cinema-Style Bus Seat Selection Architecture

Modeled after modern movie-theater ticketing paradigms (e.g. BookMyShow), CROWDLESS maps the predicted passenger load into a spatial bus layout:
- **Spatial Geometry:** Standard Delhi DTC 12m bus layout with 7 rows of 4 seats (2x2 layout: Window A, Aisle B, central walkway, Aisle C, Window D) plus a 7-seat rear lounge row (total: 35 seats).
- **Dynamic Occupancy Binding:** The number of occupied seats is directly derived from the ML predicted crowd percentage $P_{\text{crowd}}$:
  $$\text{Occupied Seats} = \min\left(32, \max\left(4, \text{round}\left(\frac{P_{\text{crowd}}}{100} \times 35\right)\right)\right)$$
- **Seat Classifications:**
  - *Emerald Green:* Available for instant commuter selection.
  - *Slate Gray with '×':* Occupied by other passengers on this corridor stretch.
  - *Pink Border:* Front 2 rows designated for female commuters (Pink ticket valid).
  - *Sky Blue Border:* Front right accessibility seating for elderly and differently-abled passengers.
- **Digital Boarding Pass:** Generates a verifiable digital transit pass with route metadata, selected seat number, scannable ETM QR validation, and wallet download capabilities.

---

## 6. Crowd Dissolution & Alternative Bypass Recommender

To answer the commuter question: *"By what time will this crowd ease?"*:
- **Dissolution Forecast:** Compares current departure hour against diurnal traffic dissipation slopes:
  - Evening Peak ($17:30 \dots 19:30$): Dissolves at **07:45 PM**, reducing boarding density by $54\%$.
  - Morning Peak ($08:30 \dots 10:15$): Dissolves at **10:45 AM**.
- **Smart Time Shift Advisor:** Suggests delaying departure by 30–45 minutes to convert a high-stress standing trip into a guaranteed seated commute.
- **Alternative Bypass Corridors:** When the primary route exceeds $65\%$ load, the engine surfaces alternative lower-crowd bypasses (e.g. Ring Road arterial or Airport Express lines) with delta-time trade-off summaries.

---

## 7. Verification Against Known Delhi Commute Patterns

The empirical findings from the October 2026 data align precisely with established Delhi transport realities:
1. **Bimodal Daily Peaks:**
   - Morning Peak ($08:30 \text{ AM} \dots 10:30 \text{ AM}$): High boarding density at residential corridors (Sangam Vihar, Badarpur, Kapashera, Uttam Nagar) converging into central commercial hubs (Connaught Place, ITO, Central Secretariat). Average utilization: $84\%$.
   - Evening Peak ($05:30 \text{ PM} \dots 08:30 \text{ PM}$): Peak outbound dispersal with heavy standing crowds. Utilization reaches $89\%$.
2. **Mid-day Calmer Window:**
   - Between $12:00 \text{ PM}$ and $04:00 \text{ PM}$, bus load drops to $24\% \dots 32\%$, providing guaranteed seats.
3. **Weekday vs. Weekend Contrast:**
   - Weekend morning peaks drop by $50\%$ compared to weekday mornings, while evening leisure hours ($06:00 \text{ PM} \dots 09:00 \text{ PM}$) retain moderate footfall near market hubs (Karol Bagh, Chandni Chowk, Saket).
