function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

function matchesParameters(trackInfo, params, strictLevel) {
  if (!params || Object.keys(params).length === 0) return true;
  
  if (strictLevel >= 3 && params.mode && trackInfo.mode) {
    if (trackInfo.mode.toLowerCase() !== params.mode.toLowerCase()) {
      return false;
    }
  }
  
  if (strictLevel >= 2) {
    if (params.happinessMax !== null && params.happinessMax !== undefined) {
      if (trackInfo.happiness > params.happinessMax) return false;
    }
    if (params.happinessMin !== null && params.happinessMin !== undefined) {
      if (trackInfo.happiness < params.happinessMin) return false;
    }
  }
  
  if (strictLevel >= 1) {
    if (params.energyMax !== null && params.energyMax !== undefined) {
      if (trackInfo.energy > params.energyMax) return false;
    }
    if (params.energyMin !== null && params.energyMin !== undefined) {
      if (trackInfo.energy < params.energyMin) return false;
    }
  }
  
  return true;
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    const currentHour = new Date().getHours();
    let timeContext = 'daytime';
    if (currentHour >= 22 || currentHour < 6) timeContext = 'late night';
    else if (currentHour >= 18) timeContext = 'evening';
    else if (currentHour >= 12) timeContext = 'afternoon';
    else timeContext = 'morning';

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
            content: `You are a music expert who DEEPLY understands the SOUL of places, not just their geography.

Analyze this request: "${prompt}"
Current time context: ${timeContext}

YOUR TASK: Think like someone who LIVES this experience. Don't just list artists from that country - think about what music you would ACTUALLY HEAR in that place.

FOR EACH PLACE, CONSIDER:
1. VISUAL ATMOSPHERE: Architecture, light, colors, decay or beauty
2. HISTORY & SOUL: What happened here? What emotions does it carry?
3. WHAT YOU HEAR: In bars, cafes, streets, car radios, family homes
4. THE FEELING: Not geography, but emotion

EXAMPLES OF EXPERIENTIAL THINKING:

KRAKOW at night is NOT just "Polish classical music". It's:
- Smoky jazz bars in Kazimierz (Tomasz Stańko, Marcin Wasilewski)
- Klezmer echoing through Jewish quarter (Kroke)
- Post-soviet melancholy (Molchat Doma, Motorama)
- Dark jazz for cold nights (Bohren & Der Club of Gore)
- The weight of history (Górecki, Preisner - but also Portishead, Radiohead)

POLISH FAMILY GATHERING is NOT art music. It's:
- Classic Polish singers everyone knows (Czesław Niemen, Marek Grechuta, Anna German)
- Folk ensembles (Mazowsze, Śląsk)
- Beloved pop stars (Krzysztof Krawczyk, Maryla Rodowicz)
- Songs that cross generations

NAPLES is NOT just "Italian pop". It's:
- Blues and soul (Pino Daniele, James Senese)
- Street energy, chaos, passion
- Nu Genea, Napoli Centrale, Enzo Avitabile

LISBON is NOT just "Fado". It's:
- Saudade - longing for something lost
- Amália Rodrigues, Madredeus, Ana Moura, Mariza

Think: "What would ACTUALLY play in this situation?"

IMPORTANT - PARAMETERS USE VALUES FROM 0 TO 100:
- happiness: 0 = very sad, 50 = neutral, 100 = very happy
- energy: 0 = very calm, 50 = moderate, 100 = very energetic

PARAMETER RULES:
- For MELANCHOLIC/SAD moods: mode "minor", happinessMax (e.g. 50)
- For HAPPY/WARM moods: mode "major", happinessMin (e.g. 40)
- For CALM moods: energyMax (e.g. 50)
- For ENERGETIC moods: energyMin (e.g. 50)
- Traditional/folk music from Eastern Europe is usually MINOR even when warm/nostalgic

Respond ONLY with JSON:
{
  "location": "the place identified (or 'unspecified' if none)",
  "atmosphere": "describe the visual/emotional atmosphere in 2-3 sentences",
  "mood": "the mood in 2-3 words",
  "soundscape": "what music you'd hear in this specific situation",
  "artists": ["mix of local AND international artists that FIT - 20-30 artists"],
  "parameters": {
    "mode": "minor" or "major" or null,
    "happinessMax": number 0-100 or null,
    "happinessMin": number 0-100 or null,
    "energyMax": number 0-100 or null,
    "energyMin": number 0-100 or null
  }
}`
          }
        ]
      })
    });

    const step1Data = await step1Response.json();
    const step1Content = step1Data.content[0].text;
    const step1Clean = step1Content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const contextInfo = JSON.parse(step1Clean);

    console.log('=== STEP 1: EXPERIENTIAL ANALYSIS ===');
    console.log('Location:', contextInfo.location);
    console.log('Atmosphere:', contextInfo.atmosphere);
    console.log('Mood:', contextInfo.mood);
    console.log('Soundscape:', contextInfo.soundscape);
    console.log('Artists:', contextInfo.artists);
    console.log('Parameters:', contextInfo.parameters);

    const artistList = contextInfo.artists?.join(', ') || '';
    
    const step2Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: `Create a playlist for this experience: "${prompt}"

ATMOSPHERE: ${contextInfo.atmosphere}
MOOD: ${contextInfo.mood}
SOUNDSCAPE: ${contextInfo.soundscape}

Use these artists and similar ones that fit the vibe:
${artistList}

RULES:
1. Suggest 100 tracks total
2. At least 60% should be from LOCAL artists of the identified location/culture
3. Use FAMOUS, WELL-KNOWN tracks that definitely exist on Spotify
4. Write artist names and song titles as accurately as possible
5. Mix different eras and styles that fit the mood
6. Think about what would ACTUALLY play in this situation

Respond ONLY with JSON:
{
  "suggestedTracks": [
    {"title": "song title", "artist": "artist name"}
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

    console.log('=== STEP 2: TRACKS ===');
    console.log('Total suggested:', tracksInfo.suggestedTracks?.length);

    const spotifyToken = await getSpotifyToken();
    
    const params = contextInfo.parameters || {};
    
    const allAnalyzedTracks = [];
    let checkedCount = 0;
    let notOnSpotify = 0;
    let soundNetFailed = 0;
    
    for (const track of tracksInfo.suggestedTracks || []) {
      if (allAnalyzedTracks.length >= 50) break;
      if (checkedCount >= 100) break;
      
      checkedCount++;
      
      const spotifyTrack = await searchSpotify(spotifyToken, track.artist, track.title);
      
      if (!spotifyTrack) {
        console.log(`Not on Spotify: ${track.title} - ${track.artist}`);
        notOnSpotify++;
        continue;
      }
      
      await delay(1100);
      
      const audioParams = await analyzeTrack(track.artist, track.title);
      
      if (!audioParams) {
        console.log(`SoundNet failed: ${track.title}`);
        soundNetFailed++;
        continue;
      }
      
      const isDuplicate = allAnalyzedTracks.some(
        t => t.spotifyId === spotifyTrack.spotifyId
      );
      
      if (!isDuplicate) {
        allAnalyzedTracks.push({
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
        console.log(`Analyzed: ${spotifyTrack.title} - ${spotifyTrack.artist} (happiness: ${audioParams.happiness}, mode: ${audioParams.mode})`);
      }
    }

    console.log('=== FILTERING WITH FALLBACK ===');
    console.log('Total analyzed tracks:', allAnalyzedTracks.length);
    console.log('Not on Spotify:', notOnSpotify);
    console.log('SoundNet failed:', soundNetFailed);

    let verifiedTracks = [];
    let strictLevel = 3;
    
    while (strictLevel >= 0 && verifiedTracks.length < 12) {
      verifiedTracks = allAnalyzedTracks.filter(track => 
        matchesParameters(track, params, strictLevel)
      );
      
      console.log(`Strict level ${strictLevel}: ${verifiedTracks.length} tracks pass`);
      
      if (verifiedTracks.length < 12) {
        strictLevel--;
        if (strictLevel === 2) console.log('Relaxing: removing mode filter');
        if (strictLevel === 1) console.log('Relaxing: removing happiness filter');
        if (strictLevel === 0) console.log('Relaxing: removing all filters');
      }
    }

    verifiedTracks = verifiedTracks.slice(0, 17);

    console.log('=== FINAL RESULT ===');
    console.log('Total tracks:', verifiedTracks.length);
    console.log('Final strict level:', strictLevel);

    return Response.json({
      interpretation: {
        location: contextInfo.location,
        mood: contextInfo.mood,
        atmosphere: contextInfo.atmosphere,
        soundscape: contextInfo.soundscape
      },
      parameters: params,
      playlist: verifiedTracks
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
