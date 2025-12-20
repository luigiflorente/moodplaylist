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
      energy: data.energy,
      danceability: data.danceability,
      acousticness: data.acousticness,
      popularity: data.popularity
    };
  } catch (error) {
    return null;
  }
}

// Funzione per verificare se il brano corrisponde ai parametri
function matchesParameters(trackInfo, params) {
  // Se non ci sono parametri, accetta tutto
  if (!params || Object.keys(params).length === 0) return true;
  
  // Filtro mode (minor/major)
  if (params.mode && trackInfo.mode) {
    if (trackInfo.mode.toLowerCase() !== params.mode.toLowerCase()) {
      return false;
    }
  }
  
  // Filtro happiness
  if (params.happinessMax !== null && params.happinessMax !== undefined) {
    if (trackInfo.happiness > params.happinessMax) return false;
  }
  if (params.happinessMin !== null && params.happinessMin !== undefined) {
    if (trackInfo.happiness < params.happinessMin) return false;
  }
  
  // Filtro energy
  if (params.energyMax !== null && params.energyMax !== undefined) {
    if (trackInfo.energy > params.energyMax) return false;
  }
  if (params.energyMin !== null && params.energyMin !== undefined) {
    if (trackInfo.energy < params.energyMin) return false;
  }
  
  return true;
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    // STEP 1: Identifica luogo, artisti locali e parametri mood
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
            content: `Analyze this request: "${prompt}"

TASK: Identify the PLACE mentioned and list LOCAL music artists from that place. Also define the MOOD PARAMETERS.

Examples of local artists:
- Krakow/Poland/Eastern Europe → Zbigniew Preisner, Chopin, Górecki, Kroke, Kilar, Penderecki, Skalpel, Molchat Doma
- Naples/Southern Italy → Pino Daniele, James Senese, Nu Genea, Napoli Centrale
- Berlin/Germany → Tangerine Dream, Kraftwerk, Nils Frahm, Apparat
- Lisbon/Portugal → Amália Rodrigues, Madredeus, Ana Moura
- Buenos Aires/Argentina → Astor Piazzolla, Gotan Project

MOOD PARAMETERS - choose based on the atmosphere:
- Night/melancholic/rain/introspective → mode: "minor", happinessMax: 50, energyMax: 70
- Sunset/nostalgic/calm → mode: "minor", happinessMax: 60, energyMax: 60
- Morning/peaceful/contemplative → mode: null, happinessMax: 60, energyMax: 50
- Party/energy/dance → mode: "major", happinessMin: 50, energyMin: 50
- Happy/sunny/celebration → mode: "major", happinessMin: 40, energyMin: 40

Respond ONLY with JSON:
{
  "location": "the identified place",
  "region": "the cultural region (e.g., Eastern Europe, Southern Italy)",
  "mood": "the mood in 2-3 words",
  "localArtists": ["artist1", "artist2", "artist3", ...],
  "parameters": {
    "mode": "minor" or "major" or null,
    "happinessMax": number or null,
    "happinessMin": number or null,
    "energyMax": number or null,
    "energyMin": number or null
  }
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
    console.log('Step 1 - Mood:', locationInfo.mood);
    console.log('Step 1 - Parameters:', locationInfo.parameters);
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
            content: `Create a playlist for: "${prompt}"

LOCATION: ${locationInfo.location}
MOOD: ${locationInfo.mood}

You MUST use these artists for the first 25 tracks:
${artistList}

For the last 15 tracks you can use international artists with similar sound.

IMPORTANT: 
- Use ONLY FAMOUS tracks that DEFINITELY exist on Spotify
- Write titles and artists EXACTLY as they appear on Spotify
- NO obscure tracks or invented titles

Respond ONLY with JSON:
{
  "suggestedTracks": [
    {"title": "EXACT Spotify title", "artist": "EXACT Spotify artist"}
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

    console.log('Step 2 - Total suggested:', tracksInfo.suggestedTracks?.length);

    // Ottieni token Spotify
    const spotifyToken = await getSpotifyToken();
    
    const params = locationInfo.parameters || {};
    const verifiedTracks = [];
    let checkedCount = 0;
    
    for (const track of tracksInfo.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      if (checkedCount >= 40) break; // Limite massimo di brani da controllare
      
      checkedCount++;
      
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
      
      if (!audioParams) {
        console.log(`SoundNet failed: ${track.title}`);
        continue;
      }
      
      // Verifica se corrisponde ai parametri mood
      if (!matchesParameters(audioParams, params)) {
        console.log(`Filtered out: ${track.title} (happiness: ${audioParams.happiness}, mode: ${audioParams.mode})`);
        continue;
      }
      
      // Controlla duplicati
      const isDuplicate = verifiedTracks.some(
        t => t.spotifyId === spotifyTrack.spotifyId
      );
      
      if (!isDuplicate) {
        verifiedTracks.push({
          title: spotifyTrack.title,
          artist: spotifyTrack.artist,
          spotifyId: spotifyTrack.spotifyId,
          year: spotifyTrack.year,
          key: audioParams.key,
          mode: audioParams.mode,
          tempo: audioParams.tempo,
          happiness: audioParams.happiness,
          energy: audioParams.energy
        });
        console.log(`Added: ${spotifyTrack.title} (happiness: ${audioParams.happiness}, mode: ${audioParams.mode})`);
      }
    }

    console.log('Final playlist:', verifiedTracks.length, 'tracks');

    return Response.json({
      interpretation: {
        location: locationInfo.location,
        mood: locationInfo.mood,
        region: locationInfo.region
      },
      parameters: params,
      playlist: verifiedTracks
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
