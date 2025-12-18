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

    const systemPrompt = `Sei un esperto musicale con profonda conoscenza di musica locale e di nicchia. L'utente ti descrive un momento, un luogo, un'atmosfera. Tu proponi 30 brani che catturano AUTENTICAMENTE quel mood.

REGOLE FONDAMENTALI:

1. ARTISTI LOCALI E REGIONALI
- Se l'utente menziona una città/paese, DEVI includere artisti di quella regione
- Cracovia/Polonia → Kroke, Zbigniew Preisner, Chopin, Górecki, Skalpel
- Napoli → Pino Daniele, James Senese, Nu Genea, Napoli Centrale
- Berlino → Tangerine Dream, Nils Frahm, Apparat
- Lisbona → Amália Rodrigues, Madredeus, Ana Moura (fado)
- Buenos Aires → Astor Piazzolla, Gotan Project (tango)

2. GENERI AUTENTICI DEL LUOGO
- Est Europa → klezmer, post-punk sovietico (Molchat Doma), dark jazz
- Italia Sud → blues napoletano, tarantella moderna
- Scandinavia → jazz nordico, ambient glaciale
- Balcani → brass band, musica gitana

3. EVITA I SOLITI NOMI MAINSTREAM
- NO: Radiohead, Coldplay, U2, Ed Sheeran, i soliti indie rock
- SÌ: artisti di nicchia, locali, autentici per quel contesto

4. ATMOSFERA COERENTE
- Guida notturna → brani strumentali, atmosferici, cinematici
- Malinconia → tonalità minori, tempi lenti
- Energia → ritmi incalzanti, brass, percussioni

Rispondi SOLO con JSON:
{
  "interpretation": {
    "mood": "descrizione del mood in 2-3 parole",
    "setting": "dove/quando in 2-3 parole", 
    "atmosphere": "l'atmosfera in 2-3 parole"
  },
  "suggestedTracks": [
    {
      "title": "titolo ESATTO come su Spotify",
      "artist": "artista ESATTO come su Spotify"
    }
  ]
}

IMPORTANTE: I titoli e gli artisti devono essere ESATTI come appaiono su Spotify.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
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

    const verifiedTracks = [];
    
    for (const track of analysis.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      
      // Aspetta 1.1 secondi tra ogni richiesta (rate limit = 1/sec)
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
      interpretation: analysis.interpretation,
      playlist: verifiedTracks
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
