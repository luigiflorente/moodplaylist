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
      acousticness: data.acousticness,
      popularity: data.popularity
    };
  } catch (error) {
    console.error('SoundNet error:', error.message);
    return null;
  }
}

// Funzione per verificare se il brano corrisponde ai parametri richiesti
function matchesParameters(trackInfo, params) {
  // Mode (minor/major)
  if (params.mode && trackInfo.mode?.toLowerCase() !== params.mode) {
    return false;
  }
  
  // Happiness range
  if (params.happinessMax && trackInfo.happiness > params.happinessMax) {
    return false;
  }
  if (params.happinessMin && trackInfo.happiness < params.happinessMin) {
    return false;
  }
  
  // Energy range
  if (params.energyMax && trackInfo.energy > params.energyMax) {
    return false;
  }
  if (params.energyMin && trackInfo.energy < params.energyMin) {
    return false;
  }
  
  // Tempo range
  if (params.tempoMax && trackInfo.tempo > params.tempoMax) {
    return false;
  }
  if (params.tempoMin && trackInfo.tempo < params.tempoMin) {
    return false;
  }
  
  return true;
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    const systemPrompt = `Sei un esperto musicale che crea playlist AUTENTICHE basate sul LUOGO.

PROCESSO:

1. ANALIZZA IL LUOGO (priorità massima)
Identifica la città/regione e la sua anima musicale:
- Cracovia/Polonia/Est Europa → Kroke, Preisner, Górecki, Kilar, Chopin, Molchat Doma, klezmer, post-punk sovietico
- Napoli/Sud Italia → Pino Daniele, James Senese, Nu Genea, Napoli Centrale, blues napoletano
- Berlino/Germania → Tangerine Dream, Nils Frahm, Apparat, Kraftwerk, elettronica
- Lisbona/Portogallo → Amália Rodrigues, Madredeus, Ana Moura, fado
- Buenos Aires/Argentina → Piazzolla, Gotan Project, tango nuevo
- Parigi/Francia → Serge Gainsbourg, Air, chanson française
- Tokyo/Giappone → Ryuichi Sakamoto, Yellow Magic Orchestra, ambient giapponese

2. ANALIZZA L'AZIONE/MOOD
- Guidare di notte → strumentale, atmosferico, cinematico
- Passeggiare → ritmo moderato, melodico
- Malinconia/pioggia → lento, minore, introspettivo
- Festa/energia → veloce, maggiore, ritmico

3. COMPOSIZIONE PLAYLIST (40 brani)
- 25 brani di artisti LOCALI/REGIONALI (anima autentica del luogo)
- 15 brani INTERNAZIONALI che hanno lo stesso mood (non mainstream ovvi)

4. PARAMETRI MUSICALI
Definisci i parametri ideali per questa richiesta:
- mode: "minor" o "major"
- happinessMax: 0-100 (es: 40 per malinconico)
- happinessMin: 0-100 (es: 50 per allegro)
- energyMin: 0-100
- energyMax: 0-100
- tempoMin: BPM
- tempoMax: BPM

Rispondi SOLO con JSON:
{
  "interpretation": {
    "location": "il luogo identificato",
    "mood": "il mood in 2-3 parole",
    "atmosphere": "l'atmosfera in 2-3 parole"
  },
  "parameters": {
    "mode": "minor" o "major" o null,
    "happinessMax": numero o null,
    "happinessMin": numero o null,
    "energyMin": numero o null,
    "energyMax": numero o null,
    "tempoMin": numero o null,
    "tempoMax": numero o null
  },
  "suggestedTracks": [
    {
      "title": "titolo ESATTO come su Spotify",
      "artist": "artista ESATTO come su Spotify"
    }
  ]
}

IMPORTANTE: I titoli e artisti devono essere ESATTI come su Spotify. Proponi 40 brani.`;

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

    const params = analysis.parameters || {};
    const verifiedTracks = [];
    
    for (const track of analysis.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      
      // Aspetta 1.1 secondi tra ogni richiesta (rate limit = 1/sec)
      await delay(1100);
      
      const trackInfo = await analyzeTrack(track.artist, track.title);
      
      if (trackInfo) {
        // Verifica se il brano corrisponde ai parametri
        if (!matchesParameters(trackInfo, params)) {
          console.log(`Skipped ${track.title} - doesn't match parameters`);
          continue;
        }
        
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
      parameters: analysis.parameters,
      playlist: verifiedTracks
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
