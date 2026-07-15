const query = `[out:json][timeout:25];node(around:1000,-23.5,-46.6);out;`;
fetch('https://lz4.overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'CinefiloApp/1.0'
  },
  body: `data=${encodeURIComponent(query)}`
})
.then(r => r.text())
.then(t => console.log(t.slice(0, 500)))
.catch(console.error);
