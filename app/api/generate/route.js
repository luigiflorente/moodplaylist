export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt mancante' }, { status: 400 });
    }

    const currentHour = new Date().getHours();
    let timeContext = 'daytime';
    if (currentHour >= 22 || currentHour < 6) timeContext = 'late night';
    else if (currentHour >= 18) timeContext = 'evening';
    else if (currentHour >= 12) timeContext = 'afternoon';
    else timeContext = 'morning';

    const geminiPrompt = `You are a music expert who DEEPLY understands the SOUL of places and moments.

User request: "${prompt}"
Current time: ${timeContext}

YOUR TASK: Create the PERFECT playlist for this moment. Think like someone who LIVES this experience.

THINK ABOUT:
1. VISUAL ATMOSPHERE: What does this place/moment look like? Light, colors, architecture
2. EMOTIONAL SOUL: What feelings does this evoke? What memories?
3. WHAT YOU'D ACTUALLY HEAR: In bars, cafes, homes, car radios in this situation
4. THE VIBE: Not just geography, but the emotional truth

EXAMPLES OF GOOD THINKING:

KRAKOW AT NIGHT:
- Smoky jazz bars in Kazimierz (Tomasz Stańko, Marcin Wasilewski)
- Klezmer echoing through Jewish quarter (Kroke)
- Post-soviet melancholy (Molchat Doma, Motorama)
- Dark atmospheric music (Bohren & Der Club of Gore, Portishead)

POLISH FAMILY GATHERING:
- Classic singers everyone knows (Czesław Niemen, Marek Grechuta, Anna German)
- Beloved pop stars (Krzysztof Krawczyk, Maryla Rodowicz)
- Folk music (Mazowsze, Golec uOrkiestra)
- Songs that make grandparents emotional

NAPLES SUNSET:
- Pino Daniele, James Senese - the soul of Naples
- Nu Genea, Napoli Centrale - modern Naples sound
- Mediterranean warmth mixed with melancholy

LISBON RAIN:
- Fado: Amália Rodrigues, Mariza, Ana Moura
- Saudade feeling: Madredeus
- Melancholic international: Portishead, Chet Baker

RULES:
1. Create EXACTLY 17 tracks
2. At least 60% should be LOCAL artists from the identified place/culture
3. Choose REAL, FAMOUS songs that DEFINITELY EXIST - be very precise with names
4. Match the MOOD perfectly - every song should feel right
5. Mix eras: classics and contemporary
6. Think about the FLOW - how songs connect to each other
7. Double-check artist names and song titles for accuracy

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "location": "the place/situation identified",
  "atmosphere": "2-3 sentences describing the visual and emotional atmosphere",
  "mood": "2-3 words capturing the mood",
  "playlist": [
    {
      "title": "exact song title",
      "artist": "exact artist name",
      "year": "release year"
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: geminiPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini API error:', data.error);
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    const content = data.candidates[0].content.parts[0].text;
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanContent);

    console.log('=== GEMINI PLAYLIST GENERATED ===');
    console.log('Location:', result.location);
    console.log('Mood:', result.mood);
    console.log('Tracks:', result.playlist?.length);

    return Response.json({
      interpretation: {
        location: result.location,
        mood: result.mood,
        atmosphere: result.atmosphere
      },
      playlist: result.playlist
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
