// Funzione per aspettare
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Funzione per ottenere token Spotify
async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return data.access_token;
}

// Funzione per cercare brano su Spotify
async function searchSpotify(token, artist, title) {
  const query = encodeURIComponent(`track:${title} artist:${artist}`);
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  if (data.tracks?.items?.length > 0) {
    const track = data.tracks.items[0];
    return {
      title: track.name,
      artist: track.artists[0].name,
      spotifyId: track.id,
      year: track.album.release_date?.substring(0, 4) || 'N/A'
    };
  }
  return null;
}

// Funzione per analizzare brano con SoundNet
async function analyzeTrack(artist, title) {
  try {
    const url = `https://track-analysis.p.rapidapi.com/pktx/analysis?song=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'track-analysis.p.rapidapi.com'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data || !data.key) return null;
    
    return {
      key: data.key,
      mode: data.mode,
      tempo: data.tempo,
      happiness: data.happiness,
      energy: data.energy
    };
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    // STEP 1: Identifica luogo e artisti locali
    const step1Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Analizza questa richiesta: "${prompt}"

COMPITO: Identifica il LUOGO menzionato e elenca gli artisti musicali LOCALI di quel luogo.

Esempi:
- Cracovia/Polonia → Zbigniew Preisner, Chopin, Górecki, Kroke, Kilar, Penderecki, Skalpel, Molchat Doma
- Napoli → Pino Daniele, James Senese, Nu Genea, Napoli Centrale
- Berlino → Tangerine Dream, Kraftwerk, Nils Frahm
- Lisbona → Amália Rodrigues, Madredeus, fado

Rispondi SOLO con JSON:
{
  "location": "il luogo identificato",
  "region": "la regione culturale (es: Est Europa, Sud Italia)",
  "mood": "il mood della richiesta (es: malinconico, energico)",
  "localArtists": ["artista1", "artista2", "artista3", ...]
}`
          }
        ]
      })
    });

    const step1Data = await step1Response.json();
    const step1Content = step1Data.content[0].text;
    const step1Clean = step1Content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const locationInfo = JSON.parse(step1Clean);

    console.log('Step 1 - Location:', locationInfo.location);
    console.log('Step 1 - Local Artists:', locationInfo.localArtists);

    // STEP 2: Chiedi brani specifici di quegli artisti
    const artistList = locationInfo.localArtists?.join(', ') || '';
    
    const step2Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Crea una playlist per: "${prompt}"

LUOGO: ${locationInfo.location}
MOOD: ${locationInfo.mood}

DEVI usare questi artisti per i primi 25 brani:
${artistList}

Per gli ultimi 15 brani puoi usare artisti internazionali con sound simile.

IMPORTANTE: Usa SOLO brani FAMOSI che SICURAMENTE esistono su Spotify. 
NO brani oscuri o titoli inventati.

Rispondi SOLO con JSON:
{
  "suggestedTracks": [
    {"title": "titolo ESATTO Spotify", "artist": "artista ESATTO Spotify"}
  ]
}`
          }
        ]
      })
    });

    const step2Data = await step2Response.json();
    const step2Content = step2Data.content[0].text;
    const step2Clean = step2Content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const tracksInfo = JSON.parse(step2Clean);

    console.log('Step 2 - First 5 tracks:', tracksInfo.suggestedTracks?.slice(0, 5));

    // Ottieni token Spotify
    const spotifyToken = await getSpotifyToken();
    
    const verifiedTracks = [];
    
    for (const track of tracksInfo.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      
      // Verifica su Spotify
      const spotifyTrack = await searchSpotify(spotifyToken, track.artist, track.title);
      
      if (!spotifyTrack) {
        console.log(`Not on Spotify: ${track.title} - ${track.artist}`);
        continue;
      }
      
      // Aspetta per rate limit SoundNet
      await delay(1100);
      
      // Ottieni parametri da SoundNet
      const audioParams = await analyzeTrack(track.artist, track.title);
      
      const isDuplicate = verifiedTracks.some(
        t => t.spotifyId === spotifyTrack.spotifyId
      );
      
      if (!isDuplicate) {
        verifiedTracks.push({
          title: spotifyTrack.title,
          artist: spotifyTrack.artist,
          spotifyId: spotifyTrack.spotifyId,
          year: spotifyTrack.year,
          key: audioParams?.key || null,
          mode: audioParams?.mode || null,
          tempo: audioParams?.tempo || null,
          happiness: audioParams?.happiness || null,
          energy: audioParams?.energy || null
        });
      }
    }

    return Response.json({
      interpretation: {
        location: locationInfo.location,
        mood: locationInfo.mood,
        region: locationInfo.region
      },
      playlist: verifiedTracks
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
