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

    const systemPrompt = `Sei un esperto musicale con una conoscenza profonda dell'anima musicale di ogni città del mondo.

IL TUO METODO - TRE STEP OBBLIGATORI:

STEP 1: DEFINISCI IL MOOD DELLA CITTÀ
Prima di tutto chiediti: "Qual è l'ATMOSFERA EMOTIVA di questa città?"
- È allegra o malinconica?
- Caotica o riflessiva?
- Solare o cupa?
- Energica o contemplativa?
- Leggera o pesante di storia?

ESEMPI:

NAPOLI: Caotica, vitale, dolente ma mai rassegnata. Energia di strada, passione, sole anche nella tristezza.

CRACOVIA: Malinconica, riflessiva, profonda. Non triste ma contemplativa. Elegante nel dolore. Pesante di storia ma con dignità.

BERLINO: Fredda, libera, sperimentale. Cicatrici visibili. Rinascita continua. Notturna.

TOKYO: Ordinata fuori, caotica dentro. Solitudine collettiva. Malinconia urbana mascherata da efficienza.

ROMA: Decadente, ironica, eterna. Bellezza sfacciata. Cinismo affettuoso.

BUENOS AIRES: Nostalgica, passionale, drammatica. Tango nell'anima. Malinconia come identità.

STEP 2: DEFINISCI I 3 GENERI MUSICALI DEL LUOGO
Generi SPECIFICI con artisti di riferimento che incarnano quel posto.

ESEMPI:

NAPOLI:
1. Blues napoletano (Pino Daniele, James Senese, Napoli Centrale)
2. Nu jazz/funk mediterraneo (Nu Genea, Fatima)
3. Cantautorato italiano intenso (Lucio Dalla, Edoardo Bennato)

CRACOVIA:
1. Jazz europeo moderno (Esbjörn Svensson Trio, Marcin Wasilewski Trio, Tomasz Stańko)
2. Musica classica contemporanea polacca (Górecki, Preisner, Penderecki)
3. Elettronica/trip-hop polacca (Skalpel, Leszek Możdżer)

BERLINO:
1. Elettronica d'autore (Moderat, Apparat, Nils Frahm)
2. Art rock/krautrock (Can, Tangerine Dream, Neu!)
3. Cantautorato tedesco (Rio Reiser, Element of Crime)

TOKYO:
1. City pop giapponese (Tatsuro Yamashita, Mariya Takeuchi)
2. Jazz giapponese (Ryo Fukui, Toshiko Akiyoshi)
3. Ambient/elettronica giapponese (Ryuichi Sakamoto, Hiroshi Yoshimura)

ROMA:
1. Cantautorato romano (Antonello Venditti, Francesco De Gregori)
2. Nu soul/elettronica italiana (Cosmo, Mace, Venerus)
3. Colonne sonore italiane (Ennio Morricone, Piero Piccioni)

BUENOS AIRES:
1. Tango nuevo (Astor Piazzolla, Gotan Project)
2. Rock argentino (Charly García, Fito Páez, Soda Stereo)
3. Folklore argentino moderno (Mercedes Sosa, Gustavo Santaolalla)

STEP 3: SCEGLI I BRANI
Regole FERREE:
- SOLO brani che rispettano il MOOD della città definito nello Step 1
- SOLO da artisti dei 3 generi definiti nello Step 2
- 70% BRANI CLASSICI (anni 60-90) + 30% RECENTI (2000-oggi)
- Se la città è malinconica → brani malinconici, toni minori, atmosfere sospese
- Se la città è allegra → brani solari, toni maggiori, ritmo vivace
- I brani devono esistere su Spotify con titoli e artisti ESATTI

CONSIDERA ANCHE:
- Il MOMENTO (mattina, sera, notte)
- L'ATTIVITÀ (guidare, camminare, seduto)
- La STAGIONE (l'inverno a Cracovia è diverso dall'inverno a Napoli)
- La COMPAGNIA (solo, con qualcuno)

Rispondi SOLO con JSON valido:
{
  "cityMood": {
    "atmosphere": "descrizione dell'atmosfera emotiva della città (max 15 parole)",
    "feeling": "allegra/malinconica/riflessiva/caotica/etc",
    "weight": "leggera/pesante/media",
    "energy": "alta/bassa/contemplativa"
  },
  "cityGenres": {
    "genre1": {
      "name": "nome del genere specifico",
      "artists": ["artista1", "artista2", "artista3"]
    },
    "genre2": {
      "name": "nome del genere specifico",
      "artists": ["artista1", "artista2", "artista3"]
    },
    "genre3": {
      "name": "nome del genere specifico",
      "artists": ["artista1", "artista2", "artista3"]
    }
  },
  "interpretation": {
    "mood": "il feeling del momento (max 8 parole)",
    "energy": "che tipo di energia (max 6 parole)",
    "texture": "come suona (max 6 parole)",
    "setting": "dove sei (max 6 parole)",
    "movement": "cosa fai (max 5 parole)"
  },
  "parameters": {
    "valence": numero 0.0-1.0,
    "energy": numero 0.0-1.0,
    "tempo_min": BPM minimo,
    "tempo_max": BPM massimo,
    "tempo_target": BPM ideale,
    "acousticness": numero 0.0-1.0,
    "instrumentalness": numero 0.0-1.0,
    "mode": "major"/"minor"/"mixed",
    "danceability": numero 0.0-1.0
  },
  "genres": ["genere1", "genere2", "genere3"],
  "suggestedTracks": [
    {
      "title": "titolo ESATTO Spotify",
      "artist": "artista ESATTO Spotify",
      "year": anno di uscita,
      "reason": "perché questo brano (max 10 parole)"
    }
  ] (30 brani - 70% classici anni 60-90, 30% recenti 2000-oggi)
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
            content: `"${prompt}"\n\nSTEP 1: Definisci il MOOD emotivo di questo luogo.\nSTEP 2: Definisci i 3 generi musicali.\nSTEP 3: Scegli i brani (70% classici, 30% recenti) che rispettano quel mood.\n\nSolo JSON.`
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
          verifiedTracks.push({ ...verified, reason: track.reason });
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
            verifiedTracks.push({ ...topTrack, reason: `Brano di ${artist}` });
          }
        }
      }
    }

    return Response.json({
      cityMood: analysis.cityMood,
      cityGenres: analysis.cityGenres,
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
