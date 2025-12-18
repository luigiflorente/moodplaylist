// Funzione per analizzare brano con SoundNet
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

    const systemPrompt = `Sei un esperto musicale. L'utente ti descrive un momento, un luogo, un'atmosfera. Tu proponi 50 brani che catturano perfettamente quel mood.

Rispondi SOLO con JSON:
{
  "interpretation": "la tua interpretazione del mood in 2-3 frasi",
  "suggestedTracks": [
    {
      "title": "titolo ESATTO come su Spotify",
      "artist": "artista ESATTO come su Spotify"
    }
  ]
}

IMPORTANTE: i brani devono essere REALI e FAMOSI. Usa titoli e artisti esatti.`;

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
      
      const trackInfo = await analyzeTrack(track.artist, track.title);
      
      // Se SoundNet trova il brano, lo aggiungiamo con tutti i dati
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
