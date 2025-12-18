// Funzione per analizzare brano con SoundNet (tutti i dati)
async function analyzeTrack(artist, title) {
  try {
    const params = new URLSearchParams({
      song: title,
      artist: artist
    });
    
    const response = await fetch(
      `https://track-analysis.p.rapidapi.com/pktx/analysis?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'track-analysis.p.rapidapi.com'
        }
      }
    );
    
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
    console.error('SoundNet error:', error);
    return null;
  }
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
- 70% brani classici (anni 60-90) + 30% recenti (2000-oggi)
- SOLO brani degli artisti dei 3 generi definiti
- Brani FAMOSI che sicuramente esistono
- Titoli e artisti ESATTI

Rispondi SOLO con JSON:
{
  "cityMood": "malinconica/allegra/energica/etc",
  "cityGenres": [
    {"name": "genere1", "artists": ["artista1", "artista2"]},
    {"name": "genere2", "artists": ["artista1", "artista2"]},
    {"name": "genere3", "artists": ["artista1", "artista2"]}
  ],
  "suggestedTracks": [
    {
      "title": "titolo ESATTO",
      "artist": "artista ESATTO"
    }
  ] (50 brani)
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
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `"${prompt}"\n\n3 regole:\n1. Mood della città\n2. 3 generi\n3. Brani famosi\n\nSolo JSON.`
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

    const cityMood = analysis.cityMood.toLowerCase();
    const isMelancholic = cityMood.includes('malincon') || cityMood.includes('rifless') || cityMood.includes('nostalig') || cityMood.includes('triste');
    
    const verifiedTracks = [];
    
    for (const track of analysis.suggestedTracks || []) {
      if (verifiedTracks.length >= 17) break;
      
      const trackInfo = await analyzeTrack(track.artist, track.title);
      
      if (!trackInfo) continue;
      
      // Filtro per mood della città
      let passesFilter = false;
      
      if (isMelancholic) {
        // Città malinconica: happiness < 50 E mode minor
        passesFilter = trackInfo.happiness < 50 && trackInfo.mode?.toLowerCase() === 'minor';
      } else {
        // Città allegra/energica: happiness >= 50 O mode major
        passesFilter = trackInfo.happiness >= 50 || trackInfo.mode?.toLowerCase() === 'major';
      }
      
      if (!passesFilter) continue;
      
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

    return Response.json({
      cityMood: analysis.cityMood,
      cityGenres: analysis.cityGenres,
      playlist: verifiedTracks
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
