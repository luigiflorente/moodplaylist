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

// Funzione per cercare brani di un artista con mood simile
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

    const systemPrompt = `Sei un esperto musicologo e curatore di playlist con una conoscenza enciclopedica della musica mondiale. Il tuo compito è interpretare contesti, atmosfere e momenti descritti dall'utente e tradurli in parametri musicali precisi.

Analizza profondamente:
- Il LUOGO (geografia, cultura musicale locale, soundscape tipico)
- Il MOMENTO (ora del giorno, stagione implicita, ritmo della situazione)  
- L'ATMOSFERA (emotiva, sensoriale, sociale)
- Le PERSONE coinvolte (solo? con qualcuno? che dinamica?)
- Il MOVIMENTO (statico, in viaggio, velocità)

Rispondi SOLO con un JSON valido, nessun altro testo. Il JSON deve avere questa struttura esatta:
{
  "interpretation": {
    "mood": "descrizione del mood in italiano (max 6 parole)",
    "energy": "descrizione dell'energia (max 5 parole)", 
    "texture": "texture sonora appropriata (max 5 parole)",
    "setting": "il contesto fisico/sociale (max 5 parole)",
    "movement": "statico/dinamico e come (max 4 parole)"
  },
  "parameters": {
    "valence": numero da 0.0 a 1.0 (positività emotiva),
    "energy": numero da 0.0 a 1.0 (intensità),
    "tempo_min": numero BPM minimo,
    "tempo_max": numero BPM massimo,
    "tempo_target": numero BPM ideale,
    "acousticness": numero da 0.0 a 1.0,
    "instrumentalness": numero da 0.0 a 1.0,
    "mode": "major" o "minor" o "mixed",
    "danceability": numero da 0.0 a 1.0
  },
  "genres": ["genere1", "genere2", "genere3", "genere4"] (4 generi specifici),
  "suggestedTracks": [
    {
      "title": "titolo brano ESATTO come su Spotify",
      "artist": "nome artista ESATTO come su Spotify",
      "reason": "perché questo brano (max 8 parole)"
    }
  ] (esattamente 20 brani)
}

REGOLE CRITICHE PER I BRANI:
1. SOLO brani che sei CERTO AL 100% esistano su Spotify
2. Usa i TITOLI ESATTI come appaiono su Spotify (es: "Bohemian Rhapsody" non "Bohemian rhapsody")
3. Usa i NOMI ARTISTI ESATTI (es: "The Beatles" non "Beatles")
4. PREFERISCI:
   - Singoli famosi e hit riconosciute
   - Brani con milioni di stream
   - Canzoni iconiche degli artisti
5. EVITA:
   - Album tracks oscure
   - B-sides
   - Remix a meno che non siano più famosi dell'originale
   - Brani live (a meno che non siano l'unica versione famosa)
6. Per artisti LOCALI del luogo menzionato:
   - Scegli SOLO i loro brani più famosi
   - Devono essere artisti con presenza su Spotify
   - Esempio Italia: Pino Daniele, Lucio Dalla, Franco Battiato (non artisti underground)
   - Esempio Polonia: Dawid Podsiadło, Myslovitz, Czesław Niemen (non artisti sconosciuti)
7. VARIA gli artisti - mai lo stesso artista due volte
8. MESCOLA: 60% brani internazionali iconici + 40% brani locali/di nicchia (ma sempre famosi)

PRIMA di includere un brano, chiediti: "Questo brano ha SICURAMENTE milioni di ascolti su Spotify?" Se non sei sicuro, scegli un altro.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analizza questo contesto e genera i parametri musicali:\n\n"${prompt}"\n\nRispondi SOLO con il JSON, nessun altro testo.`
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
      if (verifiedTracks.length >= 8) break;
      
      const verified = await searchSpotifyTrack(spotifyToken, track.artist, track.title);
      if (verified) {
        const isDuplicate = verifiedTracks.some(t => t.spotifyId === verified.spotifyId);
        if (!isDuplicate) {
          verifiedTracks.push({ ...verified, reason: track.reason });
        }
      } else {
        if (!failedArtists.includes(track.artist)) {
          failedArtists.push(track.artist);
        }
      }
    }
    
    if (verifiedTracks.length < 8 && failedArtists.length > 0) {
      for (const artist of failedArtists) {
        if (verifiedTracks.length >= 8) break;
        
        const topTrack = await searchArtistTopTracks(spotifyToken, artist);
        if (topTrack) {
          const isDuplicate = verifiedTracks.some(t => t.spotifyId === topTrack.spotifyId);
          if (!isDuplicate) {
            verifiedTracks.push({ ...topTrack, reason: `Brano iconico di ${artist}` });
          }
        }
      }
    }

    return Response.json({
      interpretation: analysis.interpretation,
      parameters: analysis.parameters,
      genres: analysis.genres,
      playlist: verifiedTracks
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
