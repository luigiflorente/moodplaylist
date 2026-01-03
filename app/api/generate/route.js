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
      spotifyUrl: track.external_urls.spotify,
      year: track.album.release_date?.substring(0, 4) || 'N/A'
    };
  }
  return null;
}

export async function POST(request) {
  try {
    const { prompt, language = 'en' } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    const languageNames = {
      en: 'English',
      it: 'Italian',
      pl: 'Polish',
      es: 'Spanish'
    };

    const responseLang = languageNames[language] || 'English';

    const currentHour = new Date().getHours();
    let timeContext = 'daytime';
    if (currentHour >= 22 || currentHour < 6) timeContext = 'late night';
    else if (currentHour >= 18) timeContext = 'evening';
    else if (currentHour >= 12) timeContext = 'afternoon';
    else timeContext = 'morning';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
            content: `You are a music expert who DEEPLY understands the SOUL of places and moments.

User request: "${prompt}"
Current time: ${timeContext}

IMPORTANT: Respond in ${responseLang}. The location, atmosphere, and mood fields must be written in ${responseLang}.

YOUR TASK: Create the PERFECT playlist for this moment. Think like someone who LIVES this experience.

THINK ABOUT:
1. VISUAL ATMOSPHERE: What does this place/moment look like? Light, colors, architecture
2. EMOTIONAL SOUL: What feelings does this evoke? What memories?
3. WHAT YOU'D ACTUALLY HEAR: In bars, cafes, homes, car radios in this situation
4. THE VIBE: Not just geography, but the emotional truth

EXAMPLES OF GOOD THINKING:

KRAKOW AT NIGHT:
- Smoky jazz bars in Kazimierz (Tomasz Stańko, Marcin Wasilewski)
- Klezmer echoing through Jewish quarter (Kroke)
- Post-soviet melancholy (Molchat Doma, Motorama)
- Dark atmospheric music (Bohren & Der Club of Gore, Portishead)

POLISH FAMILY GATHERING:
- Classic singers everyone knows (Czesław Niemen, Marek Grechuta, Anna German)
- Beloved pop stars (Krzysztof Krawczyk, Maryla Rodowicz)
- Folk music (Mazowsze, Golec uOrkiestra)
- Songs that make grandparents emotional

NAPLES SUNSET:
- Pino Daniele, James Senese - the soul of Naples
- Nu Genea, Napoli Centrale - modern Naples sound
- Mediterranean warmth mixed with melancholy

LISBON RAIN:
- Fado: Amália Rodrigues, Mariza, Ana Moura
- Saudade feeling: Madredeus
- Melancholic international: Portishead, Chet Baker

RULES:
1. Create EXACTLY 25 tracks (we will verify on Spotify and keep only those that exist)
2. At least 60% should be from LOCAL artists of the identified place/culture
3. Choose REAL, FAMOUS songs that definitely exist on Spotify
4. Be VERY PRECISE with artist names and song titles - use exact Spotify spelling
5. Match the MOOD perfectly - every song should feel right
6. Mix eras: classics and contemporary
7. Think about the FLOW - how songs connect to each other

Respond ONLY with this JSON structure:
{
  "location": "the place/situation identified",
  "atmosphere": "2-3 sentences describing the visual and emotional atmosphere",
  "mood": "2-3 words capturing the mood",
  "playlist": [
    {
      "title": "exact song title as on Spotify",
      "artist": "exact artist name as on Spotify",
      "year": "release year"
    }
  ]
}`
          }
        ]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanContent);

    console.log('=== CLAUDE GENERATED ===');
    console.log('Location:', result.location);
    console.log('Mood:', result.mood);
    console.log('Total suggested:', result.playlist?.length);

    // Verify tracks on Spotify
    const spotifyToken = await getSpotifyToken();
    const verifiedPlaylist = [];
    let notFound = 0;

    for (const track of result.playlist || []) {
      const spotifyTrack = await searchSpotify(spotifyToken, track.artist, track.title);
      
      if (spotifyTrack) {
        verifiedPlaylist.push({
          title: spotifyTrack.title,
          artist: spotifyTrack.artist,
          year: spotifyTrack.year,
          spotifyId: spotifyTrack.spotifyId,
          spotifyUrl: spotifyTrack.spotifyUrl
        });
        console.log(`✓ Found: ${spotifyTrack.title} - ${spotifyTrack.artist}`);
      } else {
        console.log(`✗ Not found: ${track.title} - ${track.artist}`);
        notFound++;
      }

      // Stop at 15 verified tracks
      if (verifiedPlaylist.length >= 15) break;
    }

    console.log('=== VERIFICATION COMPLETE ===');
    console.log('Verified tracks:', verifiedPlaylist.length);
    console.log('Not found:', notFound);

    return Response.json({
      interpretation: {
        location: result.location,
        mood: result.mood,
        atmosphere: result.atmosphere
      },
      playlist: verifiedPlaylist
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
