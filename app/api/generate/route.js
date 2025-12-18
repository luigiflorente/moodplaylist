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
  if (params.mode && trackInfo.mode?.toLowerCase() !== params.mode) {
    return false;
  }
  if (params.happinessMax && trackInfo.happiness > params.happinessMax) {
    return false;
  }
  if (params.happinessMin && trackInfo.happiness < params.happinessMin) {
    return false;
  }
  if (params.energyMax && trackInfo.energy > params.energyMax) {
    return false;
  }
  if (params.energyMin && trackInfo.energy < params.energyMin) {
    return false;
  }
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

    const systemPrompt = `SEI UN ESPERTO DI MUSICA LOCALE E REGIONALE.

⚠️ REGOLA FONDAMENTALE - LEGGI ATTENTAMENTE ⚠️

Quando l'utente menziona un LUOGO (città, paese, regione), la playlist DEVE contenere:
- MINIMO 25 brani di artisti DI QUEL LUOGO o QUELLA REGIONE
- MASSIMO 15 brani di artisti internazionali (che abbiano comunque un sound coerente)

SE NON RISPETTI QUESTA REGOLA, LA PLAYLIST È SBAGLIATA.

ARTISTI PER LUOGO (usa QUESTI, non inventare):

🇵🇱 CRACOVIA / POLONIA / EST EUROPA:
- Zbigniew Preisner (colonne sonore)
- Krzysztof Penderecki (classica)
- Henryk Górecki (classica)
- Wojciech Kilar (colonne sonore)
- Fryderyk Chopin (classica)
- Kroke (klezmer/world)
- Skalpel (jazz/elettronica)
- Marcin Wasilewski Trio (jazz)
- Tomasz Stańko (jazz)
- Leszek Możdżer (jazz/piano)
- Molchat Doma (post-punk bielorusso)
- Bohren & Der Club of Gore (dark jazz)

🇮🇹 NAPOLI / SUD ITALIA:
- Pino Daniele
- James Senese / Napoli Centrale
- Nu Genea
- Edoardo Bennato
- Tullio De Piscopo
- Tony Esposito
- Enzo Avitabile
- Alan Sorrenti
- Teresa De Sio

🇩🇪 BERLINO / GERMANIA:
- Tangerine Dream
- Kraftwerk
- Nils Frahm
- Apparat
- Moderat
- Ólafur Arnalds (islandese ma sound berlinese)

🇵🇹 LISBONA / PORTOGALLO:
- Amália Rodrigues
- Madredeus
- Ana Moura
- Mariza
- Carlos do Carmo

🇦🇷 BUENOS AIRES / ARGENTINA:
- Astor Piazzolla
- Gotan Project
- Bajofondo
- Carlos Gardel

PROCESSO:
1. Identifica il LUOGO nella richiesta
2. Scegli 25+ brani dalla lista artisti di quel luogo
3. Aggiungi max 15 brani internazionali coerenti col mood
4. Definisci i parametri musicali

PARAMETRI per il mood:
- Malinconia/notte/pioggia → mode: "minor", happinessMax: 40, energyMax: 60
- Energia/festa/sole → mode: "major", happinessMin: 50, energyMin: 50
- Guidare → tempoMin: 80, tempoMax: 120

Rispondi SOLO con JSON:
{
  "interpretation": {
    "location": "LUOGO IDENTIFICATO",
    "mood": "mood in 2-3 parole",
    "atmosphere": "atmosfera in 2-3 parole"
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
      "artist": "artista dalla lista sopra"
    }
  ]
}

RICORDA: MINIMO 25 BRANI DI ARTISTI LOCALI. È OBBLIGATORIO.`;

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
            content: `RICHIESTA: "${prompt}"
            
⚠️ RICORDA: Se c'è un luogo nella richiesta, DEVI usare ALMENO 25 brani di artisti di quel luogo/regione. È OBBLIGATORIO.`
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

    console.log('Location:', analysis.interpretation?.location);
    console.log('Parameters:', analysis.parameters);
    console.log('First 5 tracks:', analysis.suggestedTracks?.slice(0, 5));

    const params = analysis.parameters || {};
    const verifiedTracks = [];
    
    for (const track of analysis.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      
      await delay(1100);
      
      const trackInfo = await analyzeTrack(track.artist, track.title);
      
      if (trackInfo) {
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
