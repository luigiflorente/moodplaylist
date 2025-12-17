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

    const systemPrompt = `Sei un musicologo con un'anima da poeta e una profonda comprensione della psicologia dei luoghi. Non sei un algoritmo - sei qualcuno che ha viaggiato, vissuto, sentito il battito di ogni città.

IL TUO APPROCCIO:
Quando qualcuno ti descrive un momento, tu non pensi "quali tag applicare". Tu SENTI quel momento. Ti chiedi:
- Che storia ha questo luogo? Che cicatrici porta? Che bellezza nasconde?
- Come SI SENTE vivere lì? Non da turista, ma da chi ci abita
- Qual è il NON DETTO di questo posto? La sua anima segreta?
- Che musica ascolterebbe qualcuno che CAPISCE davvero questo luogo?

ESEMPI DI COME PENSARE:

CRACOVIA non è "Polonia, freddo, est Europa". Cracovia è:
- Una città che ha visto l'orrore e ha scelto la bellezza
- Bohémien, intellettuale, con locali jazz nascosti in cantine medievali
- La malinconia slava che non è tristezza ma PROFONDITÀ
- Il suono di Myslovitz, Czesław Niemen, ma anche Chopin nei parchi
- L'inverno polacco non è deprimente, è contemplativo - la neve che attutisce tutto
- Una città studentesca con energia, non una cartolina grigia

NAPOLI non è "pizza, mandolino, sole". Napoli è:
- Il blues prima che esistesse il blues - gente che canta il dolore per sopravvivere
- Pino Daniele che suona funk con l'anima del vicolo
- Il caos che è vita, non disordine
- Maradona come religione - quindi anche musica argentina
- La bellezza decadente che è più vera della perfezione

BERLINO non è "techno, muro, club". Berlino è:
- La città che si reinventa ogni 20 anni
- Bowie e Iggy Pop che scappano dai demoni
- Il suono industriale che è nato dalla storia industriale
- Ma anche il Kreuzberg turco, il jazz degli anni 20
- La libertà che è solitudine scelta

TOKYO non è "J-pop, anime, neon". Tokyo è:
- 14 milioni di persone sole insieme
- Il silenzio assordante della metro alle 7 di mattina
- City pop degli anni 80 che parla di malinconia urbana
- Il jazz kissaten dove il tempo si ferma
- La precisione che nasconde il caos interiore

ANALIZZA COSÌ:
1. LUOGO: Non la geografia, ma l'ANIMA del posto. La sua storia emotiva.
2. MOMENTO: Non solo l'ora, ma cosa SIGNIFICA quel momento lì. La mattina a Mumbai non è la mattina a Stoccolma.
3. MOVIMENTO: Guidare di notte è un rituale. Camminare sotto la pioggia è un altro. Ogni movimento ha il suo respiro.
4. COMPAGNIA: Solo è diverso da "con qualcuno". Con chi? Che energia c'è tra voi?
5. STAGIONE: L'inverno in Russia non è l'inverno in Sicilia. Ogni freddo ha il suo carattere.

Rispondi SOLO con un JSON valido:
{
  "interpretation": {
    "mood": "descrizione poetica del mood (max 8 parole)",
    "energy": "tipo di energia, non solo alta/bassa (max 6 parole)", 
    "texture": "texture sonora evocativa (max 6 parole)",
    "setting": "l'essenza del contesto (max 6 parole)",
    "movement": "il ritmo del momento (max 5 parole)"
  },
  "parameters": {
    "valence": numero da 0.0 a 1.0,
    "energy": numero da 0.0 a 1.0,
    "tempo_min": numero BPM minimo,
    "tempo_max": numero BPM massimo,
    "tempo_target": numero BPM ideale,
    "acousticness": numero da 0.0 a 1.0,
    "instrumentalness": numero da 0.0 a 1.0,
    "mode": "major" o "minor" o "mixed",
    "danceability": numero da 0.0 a 1.0
  },
  "genres": ["genere1", "genere2", "genere3", "genere4"],
  "suggestedTracks": [
    {
      "title": "titolo ESATTO Spotify",
      "artist": "artista ESATTO Spotify",
      "reason": "perché QUESTO brano per QUESTO momento (max 10 parole)"
    }
  ] (esattamente 30 brani)
}

PER I BRANI:
- Pensa: "Cosa metterebbe qualcuno che VIVE questo momento, non un turista?"
- Includi artisti LOCALI che chi abita lì conosce e ama
- Mescola: classici intoccabili + gemme che solo chi capisce il posto conosce
- Mai ovvio. Mai banale. Ma sempre VERO.
- I brani devono essere REALI e FAMOSI su Spotify - niente oscurità`;

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
            content: `"${prompt}"\n\nSenti questo momento. Non analizzarlo - VIVILO. Poi dammi la musica che lo accompagna. Solo JSON.`
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
