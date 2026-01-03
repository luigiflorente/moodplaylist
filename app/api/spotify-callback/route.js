'use client';

import { useEffect, useState } from 'react';

export default function CallbackPage() {
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
      const pendingPlaylist = JSON.parse(localStorage.getItem('pendingPlaylist') || '{}');
      
      if (pendingPlaylist.tracks) {
        createPlaylist(accessToken, pendingPlaylist);
      }
    } else {
      setStatus('error');
    }
  }, []);

  const createPlaylist = async (token, playlistData) => {
    try {
      // Get user ID
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userResponse.json();

      // Create playlist
      const createResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playlistData.name,
          description: playlistData.description,
          public: false
        })
      });
      const playlist = await createResponse.json();

      // Add tracks
      await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: playlistData.tracks.map(id => `spotify:track:${id}`)
        })
      });

      localStorage.removeItem('pendingPlaylist');
      setStatus('success');
      
      // Redirect to Spotify
      setTimeout(() => {
        window.location.href = playlist.external_urls.spotify;
      }, 2000);

    } catch (error) {
      console.error('Error creating playlist:', error);
      setStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#e8e0d4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier Prime', monospace"
    }}>
      <div style={{
        background: 'rgba(255, 252, 245, 0.8)',
        border: '2px solid #2a2420',
        padding: '50px',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        {status === 'processing' && (
          <>
            <div style={{ fontSize: '24px', marginBottom: '20px' }}>• • •</div>
            <p style={{ fontSize: '16px', color: '#4a4540' }}>
              Creating your playlist on Spotify...
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
            <p style={{ fontSize: '18px', color: '#1a1815', fontWeight: 700 }}>
              Playlist created!
            </p>
            <p style={{ fontSize: '14px', color: '#6a655d', marginTop: '10px' }}>
              Redirecting to Spotify...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✗</div>
            <p style={{ fontSize: '18px', color: '#1a1815', fontWeight: 700 }}>
              Something went wrong
            </p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                marginTop: '20px',
                background: '#1a1815',
                border: '2px solid #1a1815',
                color: '#e8e0d4',
                padding: '12px 28px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              GO BACK
            </button>
          </>
        )}
      </div>
    </div>
  );
}
