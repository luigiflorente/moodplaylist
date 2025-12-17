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

// Funzione per cercare brani su Spotify
async function searchSpotifyTrack(token, artist, title) {
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
      year: track.album.release_date?.substring(0, 4) || 'N/A',
      spotifyId: track.id,
      isrc: track.external_ids?.isrc || null
    };
  }
  return null;
}

// Funzione per cercare brani di un artista
async function searchArtistTopTracks(token, artist) {
  const artistQuery = encodeURIComponent(artist);
  const artistResponse = await fetch(
    `https://api.spotify.com/v1/search?q=${artistQuery}&type=artist&limit=1`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const artistData = await artistResponse.json();
  if (!artistData.artists?.items?.length) return null;
  
  const artistId = artistData.artists.items[0].id;
  
  const topTracksResponse = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=IT`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const topTracksData = await topTracksResponse.json();
  if (!topTracksData.tracks?.length) return null;
  
  const randomTrack = topTracksData.tracks[Math.floor(Math.random() * Math.min(5, topTracksData.tracks.length))];
  return {
    title: randomTrack.name,
    artist: randomTrack.artists[0].name,
    year: randomTrack.album.release_date?.substring(0, 4) || 'N/A',
    spotifyId: randomTrack.id,
    isrc: randomTrack.external_ids?.isrc || null
  };
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    const systemPrompt = `Sei un esperto musicale. Segui SOLO queste 3 regole:

REGOLA 1: MOOD DELLA CITTÀ
Definisci se la città è: allegra, malinconica, energica, riflessiva, caotica, etc.

Esempi:
- CRACOVIA: malinconica
- NAPOLI: energica, passionale
- BERLINO: fredda, sperimentale
- TOKYO: malinconica, ordinata
- ROMA: ironica, decadente
- BUENOS AIRES: nostalgica, passionale

REGOLA 2: 3 GENERI DELLA CITTÀ
Scegli 3 generi musicali che rappresentano quella città.

Esempi:
CRACOVIA:
1. Jazz europeo moderno (Esbjörn Svensson Trio, Marcin Wasilewski Trio, Tomasz Stańko)
2. Classica contemporanea polacca (Górecki, Preisner, Penderecki)
3. Elettronica/trip-hop polacca (Skalpel, Leszek Możdżer)

NAPOLI:
1. Blues napoletano (Pino Daniele, James Senese, Napoli Centrale)
2. Nu jazz/funk mediterraneo (Nu Genea)
3. Cantautorato intenso (Lucio Dalla, Edoardo Bennato)

REGOLA 3: BRANI
- Se città MALINCONICA → SOLO brani in tonalità MINORE
- Se città ALLEGRA/ENERGICA → SOLO brani in tonalità MAGGIORE
- 70% brani classici (anni 60-90) + 30% recenti (2000-oggi)
- SOLO brani degli artisti dei 3 generi definiti
- Brani REALI che esistono su Spotify

NIENT'ALTRO. SOLO QUESTE 3 REGOLE.

Rispondi SOLO con JSON:
{
  "cityMood": "malinconica/allegra/energica/etc",
  "cityGenres": [
    {"name": "genere1", "artists": ["artista1", "artista2"]},
    {"name": "genere2", "artists": ["artista1", "artista2"]},
    {"name": "genere3", "artists": ["artista1", "artista2"]}
  ],
  "mode": "minor" o "major",
  "suggestedTracks": [
    {
      "title": "titolo ESATTO Spotify",
      "artist": "artista ESATTO Spotify",
      "key": "tonalità del brano (es: Am, Dm, Em per minori - C, G, D per maggiori)",
      "year": anno
    }
  ] (30 brani)
}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `"${prompt}"\n\n3 regole:\n1. Mood della città\n2. 3 generi\n3. Brani in tonalità corretta (minore se malinconica, maggiore se allegra)\n\nSolo JSON.`
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Anthropic API error:', errorText);
      return Response.json({ error: 'Errore API Claude' }, { status: 500 });
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content[0].text;
    const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    const spotifyToken = await getSpotifyToken();
    const verifiedTracks = [];
    const failedArtists = [];
    
    for (const track of analysis.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      
      const verified = await searchSpotifyTrack(spotifyToken, track.artist, track.title);
      if (verified) {
        const isDuplicate = verifiedTracks.some(t => t.spotifyId === verified.spotifyId);
        if (!isDuplicate) {
          verifiedTracks.push({ ...verified, key: track.key });
        }
      } else {
        if (!failedArtists.includes(track.artist)) {
          failedArtists.push(track.artist);
        }
      }
    }
    
    if (verifiedTracks.length < 17 && failedArtists.length > 0) {
      for (const artist of failedArtists) {
        if (verifiedTracks.length >= 17) break;
        
        const topTrack = await searchArtistTopTracks(spotifyToken, artist);
        if (topTrack) {
          const isDuplicate = verifiedTracks.some(t => t.spotifyId === topTrack.spotifyId);
          if (!isDuplicate) {
            verifiedTracks.push({ ...topTrack });
          }
        }
      }
    }

    return Response.json({
      cityMood: analysis.cityMood,
      cityGenres: analysis.cityGenres,
      mode: analysis.mode,
      playlist: verifiedTracks
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
