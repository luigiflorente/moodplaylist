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

function matchesParameters(trackInfo, params) {
  if (!params || Object.keys(params).length === 0) return true;
  
  if (params.mode && trackInfo.mode) {
    if (trackInfo.mode.toLowerCase() !== params.mode.toLowerCase()) {
      return false;
    }
  }
  
  if (params.happinessMax !== null && params.happinessMax !== undefined) {
    if (trackInfo.happiness > params.happinessMax) return false;
  }
  if (params.happinessMin !== null && params.happinessMin !== undefined) {
    if (trackInfo.happiness < params.happinessMin) return false;
  }
  
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
3. WHAT YOU HEAR: In bars, cafes, streets, car radios
4. THE FEELING: Not geography, but emotion

EXAMPLES OF EXPERIENTIAL THINKING:

KRAKOW at night is NOT just "Polish classical music". It's:
- Smoky jazz bars in Kazimierz (Tomasz Stańko, Marcin Wasilewski)
- Klezmer echoing through Jewish quarter (Kroke, The Klezmatics)
- Decadent beauty, peeling walls, amber streetlights
- Post-soviet melancholy (Molchat Doma, Motorama)
- Dark jazz for cold nights (Bohren & Der Club of Gore)
- The weight of history (Górecki, Preisner - but also Portishead, Radiohead)

NAPLES is NOT just "Italian pop". It's:
- Blues and soul (Pino Daniele, James Senese)
- Street energy, chaos, passion
- Mediterranean melancholy meets joy
- Nu Genea, Napoli Centrale, but also Manu Chao, Buena Vista Social Club

LISBON is NOT just "Fado". It's:
- Saudade - longing for something lost
- Trams, hills, faded tiles, Atlantic mist
- Amália Rodrigues, but also Portishead, Chet Baker, Billie Holiday

Think: "What would play in a bar in this place that would feel PERFECT?"

IMPORTANT - PARAMETERS USE VALUES FROM 0 TO 100:
- happiness: 0 = very sad, 50 = neutral, 100 = very happy
- energy: 0 = very calm, 50 = moderate, 100 = very energetic

PARAMETER RULES:
- For MELANCHOLIC/SAD moods: use happinessMax (e.g. 50), but DO NOT use happinessMin - let the saddest songs through!
- For HAPPY/ENERGETIC moods: use happinessMin (e.g. 40), no happinessMax needed
- For CALM moods: use energyMax (e.g. 50)
- For ENERGETIC moods: use energyMin (e.g. 50)
- Mode "minor" = sad/melancholic, "major" = happy/bright

Example parameters:
- Melancholic night: mode "minor", happinessMax 50, energyMax 70 (NO happinessMin!)
- Happy sunny day: mode "major", happinessMin 40, energyMin 40
- Calm contemplative: mode "minor", happinessMax 60, energyMax 50

Respond ONLY with JSON:
{
  "location": "the place identified (or 'unspecified' if none)",
  "atmosphere": "describe the visual/emotional atmosphere in 2-3 sentences",
  "mood": "the mood in 2-3 words",
  "soundscape": "what music you'd hear in bars/streets in this place",
  "artists": ["mix of local AND international artists that FIT this atmosphere - 15-20 artists"],
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
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Create a playlist for this experience: "${prompt}"

ATMOSPHERE: ${contextInfo.atmosphere}
MOOD: ${contextInfo.mood}
SOUNDSCAPE: ${contextInfo.soundscape}

Use these artists (mix of local and international that FIT the vibe):
${artistList}

CRITICAL: At least 50% of tracks must be from LOCAL artists of the identified location!

VERIFIED TRACKS DATABASE - USE THESE EXACT TITLES:

POLISH ARTISTS:
- Tomasz Stańko: "Suspended Variation VI", "Tale", "Etiuda Baletowa", "Litania", "Sleep Safe and Warm", "Dark Eyes"
- Marcin Wasilewski Trio: "January", "Night Train to You", "Sudovian Dance", "Glimmer of Hope", "Three Reflections", "Austin"
- Kroke: "Ajde Jano", "The Secrets of the Life Tree", "Out of Sight", "Time", "Eden", "Quartet"
- Zbigniew Preisner: "Lacrimosa", "Van den Budenmayer: Concerto en mi mineur", "Requiem for My Friend", "Song for the Unification of Europe"
- Henryk Górecki: "Symphony No. 3, Op. 36: II. Lento e largo"
- Wojciech Kilar: "Exodus", "Polonez", "Bram Stoker's Dracula"
- Krzysztof Penderecki: "Threnody for the Victims of Hiroshima", "Polymorphia"
- Leszek Możdżer: "Komeda", "Preludium"
- Skalpel: "1958", "Break In", "Sculpture"

EASTERN EUROPEAN:
- Molchat Doma: "Sudno (Boris Ryzhy)", "Volny", "Toska", "Discoteque", "Na Dne"
- Motorama: "Heavy Wave", "Alps", "Ghost", "Calendar"

NAPLES/SOUTHERN ITALY:
- Pino Daniele: "Napule è", "Quando", "Je so' pazzo", "Nero a metà", "Yes I Know My Way"
- James Senese: "Je te vurria vasà"
- Nu Genea: "Marechià", "Bar Mediterraneo", "Nuova Napoli"
- Napoli Centrale: "Campagna", "Ngazzate Nire"
- Enzo Avitabile: "Soul Express", "Black Tarantella"

LISBON/PORTUGAL:
- Amália Rodrigues: "Estranha Forma de Vida", "Com Que Voz", "Povo Que Lavas No Rio"
- Madredeus: "O Pastor", "Ainda", "O Mar"
- Ana Moura: "Desfado", "Leva-me aos Fados"
- Mísia: "Paixão", "Ruas"
- Mariza: "Chuva", "Há Festa na Mouraria"

INTERNATIONAL (use for mood matching):
- Portishead: "Glory Box", "Sour Times", "Wandering Star", "Roads", "The Rip"
- Radiohead: "Everything In Its Right Place", "Exit Music (For a Film)", "How to Disappear Completely", "Pyramid Song", "No Surprises"
- Massive Attack: "Teardrop", "Angel", "Unfinished Sympathy", "Protection"
- Bohren & Der Club of Gore: "Constant Fear", "Prowler", "Midnight Black Earth", "On Demon Wings"
- Nils Frahm: "Says", "Re", "All Melody", "My Friend the Forest"
- Max Richter: "On the Nature of Daylight", "Spring 1", "Written on the Sky", "Dream 3"
- Agnes Obel: "Riverside", "Familiar", "The Curse", "Aventine"
- Bonobo: "Black Sands", "Kong", "Kerala", "Cirrus"
- GoGo Penguin: "Raven", "Hopopono", "Murmuration", "Garden Dog Barbecue"
- Kiasmos: "Blurred", "Thrown", "Gaunt"
- Ólafur Arnalds: "Near Light", "Saman", "Nyepi"
- Thom Yorke: "Suspirium", "Unmade", "Dawn Chorus"

RULES:
1. Use ONLY tracks from the database above - do not invent titles!
2. At least 50% must be LOCAL artists from the identified location
3. Suggest 50 tracks total
4. Write artist and title EXACTLY as shown above

Respond ONLY with JSON:
{
  "suggestedTracks": [
    {"title": "EXACT title from database", "artist": "EXACT artist name"}
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
    const verifiedTracks = [];
    let checkedCount = 0;
    
    for (const track of tracksInfo.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      if (checkedCount >= 50) break;
      
      checkedCount++;
      
      const spotifyTrack = await searchSpotify(spotifyToken, track.artist, track.title);
      
      if (!spotifyTrack) {
        console.log(`Not on Spotify: ${track.title} - ${track.artist}`);
        continue;
      }
      
      await delay(1100);
      
      const audioParams = await analyzeTrack(track.artist, track.title);
      
      if (!audioParams) {
        console.log(`SoundNet failed: ${track.title}`);
        continue;
      }
      
      if (!matchesParameters(audioParams, params)) {
        console.log(`Filtered out: ${track.title} (happiness: ${audioParams.happiness}, mode: ${audioParams.mode})`);
        continue;
      }
      
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
        console.log(`Added: ${spotifyTrack.title} - ${spotifyTrack.artist} (happiness: ${audioParams.happiness}, mode: ${audioParams.mode})`);
      }
    }

    console.log('=== FINAL RESULT ===');
    console.log('Total tracks:', verifiedTracks.length);

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
