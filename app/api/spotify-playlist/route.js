export async function POST(request) {
  try {
    const { token, tracks, playlistName } = await request.json();

    if (!token || !tracks || tracks.length === 0) {
      return Response.json({ error: 'Missing token or tracks' }, { status: 400 });
    }

    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userResponse.ok) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    const createResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: playlistName || 'Mood Playlist',
        description: 'Created by Mood Playlist - Blackstars Studio',
        public: false
      })
    });

    if (!createResponse.ok) {
      const err = await createResponse.json();
      console.error('Create playlist error:', err);
      return Response.json({ error: 'Failed to create playlist' }, { status: 500 });
    }

    const playlistData = await createResponse.json();
    const playlistId = playlistData.id;

    const trackUris = tracks
      .filter(t => t.spotifyId)
      .map(t => `spotify:track:${t.spotifyId}`);

    if (trackUris.length > 0) {
      const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
      });

      if (!addResponse.ok) {
        const err = await addResponse.json();
        console.error('Add tracks error:', err);
        return Response.json({ error: 'Failed to add tracks' }, { status: 500 });
      }
    }

    return Response.json({
      success: true,
      playlistId: playlistId,
      playlistUrl: playlistData.external_urls.spotify,
      tracksAdded: trackUris.length
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
