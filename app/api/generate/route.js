export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    const systemPrompt = `Sei un esperto musicologo e curatore di playlist. Il tuo compito è interpretare contesti, atmosfere e momenti descritti dall'utente e tradurli in parametri musicali precisi e playlist appropriate.

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
  "genres": ["genere1", "genere2", "genere3", "genere4"] (4 generi specifici e appropriati),
  "playlist": [
    {
      "title": "titolo brano",
      "artist": "artista",
      "year": anno,
      "reason": "perché questo brano si adatta al contesto (max 10 parole)"
    }
  ] (esattamente 8 brani, tutti REALI e esistenti, vari ma coerenti col contesto)
}

IMPORTANTE:
- I brani devono essere REALI, esistenti, verificabili
- Scegli musica che rifletta la CULTURA del luogo quando rilevante
- Per contesti in movimento (guida, treno) considera il ritmo del viaggio
- Per contesti notturni considera l'intimità e l'atmosfera
- Per contesti con altre persone considera la dinamica sociale
- Varia gli artisti, non ripetere lo stesso artista
- Includi mix di classici e contemporanei quando appropriato
- Se il contesto è in un paese specifico, includi artisti locali`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
            content: `Analizza questo contesto e genera una playlist perfetta:\n\n"${prompt}"\n\nRispondi SOLO con il JSON, nessun altro testo.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return Response.json({ error: 'Errore API Claude' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON dalla risposta
    const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return Response.json(parsed);

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
