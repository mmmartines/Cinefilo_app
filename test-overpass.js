const query = `
  [out:json][timeout:25];
  area["name"="Sorocaba"]["admin_level"="8"]->.searchArea;
  (
    node["amenity"="cinema"](area.searchArea);
    way["amenity"="cinema"](area.searchArea);
    relation["amenity"="cinema"](area.searchArea);
  );
  out center;
`;

fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'CinefiloApp/1.0',
    'Accept': 'application/json'
  },
  body: `data=${encodeURIComponent(query)}`
})
.then(r => r.text())
.then(text => {
  console.log('Response text:', text);
})
.catch(console.error);
