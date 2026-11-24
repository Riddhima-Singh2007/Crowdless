# CROWDLESS: Hackathon Demonstration Script
## 2-Minute Video & Live Pitch Walkthrough

---

### [0:00 - 0:25] The Problem & Introduction
- **Visual:** Open browser to `http://localhost:5000` showing CROWDLESS Landing Page.
- **Narrator:** "Every commuter in Delhi knows that how crowded a bus or metro is matters just as much as how long the trip takes. Yet, current apps only sort routes by time—forcing people into packed, unbearable vehicles. We built CROWDLESS: Move smarter, travel calmer."
- **Action:** Scroll through the hero section highlighting the tagline and live metrics: "2.56M ETM tickets analyzed, trained Random Forest model with 1.68% MAE."

---

### [0:25 - 0:55] Live Journey Search Demo (Anand Vihar to Connaught Place)
- **Visual:** Navigate to the Journey Planner (`/planner`).
- **Narrator:** "Let's test the official hackathon benchmark: Traveling from Anand Vihar ISBT to Connaught Place / Shivaji Stadium at 6:00 PM on a weekday evening peak."
- **Action:**
  1. Select Origin: "Anand Vihar ISBT".
  2. Select Destination: "Connaught Place / Shivaji Stadium".
  3. Select Departure Time: "18:00" (or click the Evening Peak preset).
  4. Click "Find My Route".
- **Narrator:** "Within milliseconds, our graph routing engine calculates candidate paths and ranks them into three distinct choices."

---

### [0:55 - 1:30] Comparing the Three Recommendations & Map
- **Visual:** Focus on the 3 recommendation cards and the synchronized MapLibre map on the right.
- **Narrator:**
  - "Option 1: **Fastest Route** takes 30 minutes via Blue Line Main and Route 534UP. It gets you there quickest, but our model flags standing room only at 60% load on the central corridor."
  - "Option 2: **Least Crowded Route** takes 32 minutes—just two minutes more—via Route 85UP and Airport Express Line, but average crowd drops to only 17%! That guarantees a seated, calm commute."
  - "Option 3: **Best Balanced Route** balances 35 minutes trip time with low transfer friction."
- **Action:** Click between Candidate #1 and Candidate #2. Notice the map dynamically shifts focus, recoloring the route line from amber to green. Expand a segment to show the intermediate stop breakdown and ML model status (`OBSERVED`).

---

### [1:30 - 1:50] Crowd Analytics Dashboard
- **Visual:** Click "Crowd Analytics" in the top navbar (`/analytics`).
- **Narrator:** "For transport planners and researchers, CROWDLESS offers full transparency. Here is our 24-hour passenger density curve comparing weekdays against weekends, highlighting the dual peaks at 8:30 AM and 5:30 PM, and the calm mid-day lull where seat availability exceeds 78%."
- **Action:** Hover over the Recharts area chart showing weekday vs weekend curve points.

---

### [1:50 - 2:00] Conclusion & Wrap-Up
- **Visual:** Click "Transport Status" (`/network`) showing active Delhi Metro lines and DTC routes.
- **Narrator:** "CROWDLESS transforms raw ticketing data into commuter well-being and data-driven transit planning. Built for the Delhi Transport Stack Hackathon. Thank you!"
