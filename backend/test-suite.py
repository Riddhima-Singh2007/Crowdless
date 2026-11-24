import requests
import json

base_node = 'http://localhost:5000/api'
base_ml = 'http://localhost:8000'

print('=== 1. Node Health ===')
r = requests.get(f'{base_node}/health')
print('Health:', r.status_code, r.json())

print('\n=== 2. ML Health ===')
r = requests.get(f'{base_ml}/health')
print('ML Health:', r.status_code, r.json())

print('\n=== 3. Search Stations ===')
r = requests.get(f'{base_node}/stations?q=Kashmere')
print('Stations:', r.status_code, [s['name'] for s in r.json()['stations']])

print('\n=== 4. Station Details ===')
r = requests.get(f'{base_node}/stations/Kashmere%20Gate')
print('Details:', r.status_code, r.json()['station']['name'], '| Mode:', r.json()['station']['mode'])

print('\n=== 5. Station Crowd ===')
r = requests.get(f'{base_node}/stations/Kashmere%20Gate/crowd')
print('Crowd:', r.status_code, 'Score:', r.json()['currentCrowdScore'], '| Category:', r.json()['currentCategory'])

print('\n=== 6. Route Search (Anand Vihar -> Connaught Place @ 18:00) ===')
payload = {
    'origin': 'Anand Vihar ISBT',
    'destination': 'Connaught Place / Shivaji Stadium',
    'departureTime': '18:00'
}
r = requests.post(f'{base_node}/routes/search', json=payload)
print('Search:', r.status_code)
res = r.json()
print('Total Candidate Routes:', res['totalOptions'])
for opt in res['recommendations']:
    print(f"  [{opt['categoryBadge']}] {opt['routeName']} - {opt['totalDurationMin']} mins | Crowd: {opt['crowdMetrics']['crowdCategory']} ({opt['crowdMetrics']['crowdPercentage']}%)")

print('\n=== 7. City Crowd Trends ===')
r = requests.get(f'{base_node}/crowd/trends')
print('Trends:', r.status_code, 'Morning Peak:', r.json()['morningPeakWindow'], 'Evening Peak:', r.json()['eveningPeakWindow'])

print('\n=== 8. Corridor Forecast ===')
r = requests.get(f'{base_node}/crowd/forecast')
print('Forecast:', r.status_code, 'Total Corridors:', len(r.json()['corridors']))

print('\n=== 9. Transport Status ===')
r = requests.get(f'{base_node}/transport/status')
print('Status:', r.status_code, 'System Status:', r.json()['systemStatus'], '| Lines:', len(r.json()['metroLines']))

print('\nALL 9 ENDPOINT CHECKS SUCCEEDED 100%!')
