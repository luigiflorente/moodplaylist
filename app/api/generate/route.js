// Funzione per aspettare
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      energy: data.energy,
      danceability: data.danceability,
      acousticness: data.acousticness,
      popularity: data.popularity
    };
  } catch (error) {
    console.error('SoundNet error:', error.message);
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

DEVI usare SOLO questi artisti per i primi 25 brani:
${artistList}

Per gli ultimi 15 brani puoi usare artisti internazionali con sound simile.

Rispondi SOLO con JSON:
{
  "suggestedTracks": [
    {"title": "titolo ESATTO Spotify", "artist": "artista ESATTO"}
  ]
}

IMPORTANTE: I primi 25 brani DEVONO essere degli artisti elencati sopra. Titoli ESATTI come su Spotify.`
          }
        ]
      })
    });

    const step2Data = await step2Response.json();
    const step2Content = step2Data.content[0].text;
    const step2Clean = step2Content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const tracksInfo = JSON.parse(step2Clean);

    console.log('Step 2 - First 5 tracks:', tracksInfo.suggestedTracks?.slice(0, 5));

    const verifiedTracks = [];
    
    for (const track of tracksInfo.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      
      await delay(1100);
      
      const trackInfo = await analyzeTrack(track.artist, track.title);
      
      if (trackInfo) {
        const isDuplicate = verifiedTracks.some(
          t => t.title.toLowerCase() === track.title.toLowerCase() && 
               t.artist.toLowerCase() === track.artist.toLowerCase()
        );
        
        if (!isDuplicate) {
          verifiedTracks.push({
            title: track.title,
            artist: track.artist,
            key: trackInfo.key,
            mode: trackInfo.mode,
            tempo: trackInfo.tempo,
            happiness: trackInfo.happiness,
            energy: trackInfo.energy
          });
        }
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
