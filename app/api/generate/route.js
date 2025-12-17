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

// Funzione per ottenere raccomandazioni Spotify
async function getSpotifyRecommendations(token, params, genres) {
  const validGenres = [
    'acoustic', 'ambient', 'blues', 'classical', 'country', 'dance', 
    'electronic', 'folk', 'funk', 'hip-hop', 'indie', 'jazz', 'latin', 
    'metal', 'pop', 'punk', 'r-n-b', 'reggae', 'rock', 'soul', 'world-music'
  ];
  
  const seedGenres = genres
    .map(g => g.toLowerCase().replace(/\s+/g, '-'))
    .filter(g => validGenres.includes(g))
    .slice(0, 2);
  
  const queryParams = new URLSearchParams({
    limit: '10',
    target_valence: params.valence.toString(),
    target_energy: params.energy.toString(),
    target_danceability: params.danceability.toString(),
    min_tempo: params.tempo_min.toString(),
    max_tempo: params.tempo_max.toString(),
  });
  
  if (seedGenres.length > 0) {
    queryParams.append('seed_genres', seedGenres.join(','));
  } else {
    queryParams.append('seed_genres', 'pop,rock');
  }
  
  const response = await fetch(
    `https://api.spotify.com/v1/recommendations?${queryParams}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  return data.tracks || [];
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    const systemPrompt = `Sei un esperto musicologo e curatore di playlist. Il tuo compito è interpretare contesti, atmosfere e momenti descritti dall'utente e tradurli in parametri musicali precisi.

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
  "genres": ["genere1", "genere2", "genere3", "genere4"] (4 generi specifici - usa generi riconosciuti come: rock, pop, jazz, electronic, classical, hip-hop, r-n-b, soul, folk, indie, ambient, blues, latin, reggae, metal, punk, funk, world-music, country, dance),
  "suggestedTracks": [
    {
      "title": "titolo brano ESATTO",
      "artist": "nome artista ESATTO",
      "reason": "perché questo brano (max 8 parole)"
    }
  ] (esattamente 12 brani, DEVONO essere brani REALI e FAMOSI che sicuramente esistono su Spotify, niente brani oscuri)
}

IMPORTANTE:
- I brani DEVONO essere reali, famosi e presenti su Spotify
- Preferisci brani conosciuti, evita deep cuts o tracce oscure
- Scegli musica che rifletta la CULTURA del luogo quando rilevante
- Se il contesto è in un paese specifico, includi artisti locali FAMOSI
- Varia gli artisti, non ripetere lo stesso artista`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
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

    // Step 2: Verifica i brani su Spotify
    const spotifyToken = await getSpotifyToken();
    const verifiedTracks = [];
    
    for (const track of analysis.suggestedTracks || []) {
      if (verifiedTracks.length >= 8) break;
      
      const verified = await searchSpotifyTrack(spotifyToken, track.artist, track.title);
      if (verified) {
        verifiedTracks.push({
          ...verified,
          reason: track.reason
        });
      }
    }
    
    // Se non abbiamo abbastanza brani, usa le raccomandazioni Spotify
    if (verifiedTracks.length < 8) {
      const recommendations = await getSpotifyRecommendations(
        spotifyToken, 
        analysis.parameters,
        analysis.genres
      );
      
      for (const track of recommendations) {
        if (verifiedTracks.length >= 8) break;
        
        const isDuplicate = verifiedTracks.some(
          t => t.spotifyId === track.id || 
               (t.title.toLowerCase() === track.name.toLowerCase() && 
                t.artist.toLowerCase() === track.artists[0].name.toLowerCase())
        );
        
        if (!isDuplicate) {
          verifiedTracks.push({
            title: track.name,
            artist: track.artists[0].name,
            year: track.album.release_date?.substring(0, 4) || 'N/A',
            spotifyId: track.id,
            reason: 'Consigliato per il mood'
          });
        }
      }
    }

    const result = {
      interpretation: analysis.interpretation,
      parameters: analysis.parameters,
      genres: analysis.genres,
      playlist: verifiedTracks
    };

    return Response.json(result);

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
