'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistCreated, setPlaylistCreated] = useState(null);

  const examplePrompts = [
    "Driving at night in Krakow",
    "Sunset aperitivo in Naples",
    "Walking in Lisbon, light rain",
    "Morning in Berlin, coffee and cigarette",
    "Lazy Sunday in Buenos Aires"
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('spotify_token');
    if (token) {
      setSpotifyToken(token);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setPhase('analyzing');
    setPlaylistCreated(null);

    try {
      setPhase('translating');
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      
      setPhase('generating');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setResult(data);
      setPhase('complete');
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setPhase('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAll = () => {
    setInput('');
    setResult(null);
    setPhase('idle');
    setError(null);
    setPlaylistCreated(null);
  };

  const connectSpotify = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '68ff042636ad42dfa8ed292f89d7d558';
    const redirectUri = encodeURIComponent('https://moodplaylist-ten.vercel.app/api/spotify-callback');
    const scopes = encodeURIComponent('playlist-modify-public playlist-modify-private');
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  const createSpotifyPlaylist = async () => {
    if (!spotifyToken || !result?.playlist) return;
    
    setIsCreatingPlaylist(true);
    
    try {
      const response = await fetch('/api/spotify-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: spotifyToken,
          tracks: result.playlist,
          playlistName: `Mood: ${input.substring(0, 50)}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPlaylistCreated(data);
      } else {
        throw new Error(data.error || 'Failed to create playlist');
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create Spotify playlist. Please try connecting again.');
      setSpotifyToken(null);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: '#e8e0d4',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
          `,
          opacity: 0.12,
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'fixed',
          top: '8%',
          left: '12%',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139, 119, 101, 0.25) 0%, rgba(139, 119, 101, 0.1) 40%, transparent 70%)',
          filter: 'blur(2px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'fixed',
          bottom: '15%',
          right: '8%',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(101, 85, 72, 0.2) 0%, rgba(101, 85, 72, 0.08) 40%, transparent 70%)',
          filter: 'blur(2px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'fixed',
          top: '45%',
          right: '20%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(120, 100, 80, 0.15) 0%, transparent 60%)',
          filter: 'blur(3px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'fixed',
          inset: 0,
          boxShadow: 'inset 0 0 150px rgba(60, 50, 40, 0.4)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '50px 25px',
          position: 'relative',
          zIndex: 1
        }}>
          
          <header style={{ 
            marginBottom: '50px', 
            textAlign: 'center',
            padding: '45px 35px',
            background: 'rgba(232, 224, 212, 0.5)',
            position: 'relative'
          }}>
            <div style={{
              width: '100%',
              height: '3px',
              background: '#2a2420',
              marginBottom: '25px'
            }} />
            
            <h1 style={{
              fontFamily: "'Anton', 'Impact', sans-serif",
              fontSize: 'clamp(42px, 12vw, 72px)',
              fontWeight: 400,
              margin: '0',
              lineHeight: 0.9,
              color: '#1a1815',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: '2px 2px 0 rgba(232, 224, 212, 0.8)'
            }}>
              MOOD
            </h1>
            <h1 style={{
              fontFamily: "'Anton', 'Impact', sans-serif",
              fontSize: 'clamp(42px, 12vw, 72px)',
              fontWeight: 400,
              margin: '0',
              lineHeight: 0.9,
              color: '#1a1815',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: '2px 2px 0 rgba(232, 224, 212, 0.8)'
            }}>
              PLAYLIST
            </h1>
            
            <p style={{
              fontFamily: "'Courier Prime', 'Courier New', monospace",
              fontSize: '14px',
              color: '#4a4540',
              margin: '20px 0 0 0',
              letterSpacing: '3px',
              textTransform: 'uppercase'
            }}>
              Music for every moment
            </p>

            <div style={{
              width: '100%',
              height: '3px',
              background: '#2a2420',
              marginTop: '25px'
            }} />
          </header>

          {error && (
            <div style={{
              background: 'rgba(80, 60, 50, 0.1)',
              border: '2px solid #4a4540',
              padding: '18px 22px',
              marginBottom: '25px',
              fontFamily: "'Courier Prime', monospace",
              color: '#3a3530',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {!result && (
            <div style={{
              background: 'rgba(255, 252, 245, 0.4)',
              border: '2px solid #2a2420',
              padding: '30px',
              marginBottom: '35px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '30px',
                height: '30px',
                background: 'linear-gradient(135deg, transparent 50%, rgba(200, 190, 175, 0.8) 50%)',
                boxShadow: '-2px 2px 5px rgba(0,0,0,0.1)'
              }} />
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe where you are, what you feel, what you see..."
                disabled={isAnalyzing}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #3a3530',
                  outline: 'none',
                  color: '#1a1815',
                  fontSize: '18px',
                  fontFamily: "'Courier Prime', 'Courier New', monospace",
                  lineHeight: 1.8,
                  resize: 'none',
                  padding: '15px 0',
                  opacity: isAnalyzing ? 0.5 : 1
                }}
              />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px'
              }}>
                <span style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: '12px',
                  color: '#6a655d',
                  letterSpacing: '1px'
                }}>
                  {input.length > 0 ? `${input.length} characters` : '...'}
                </span>
                
                <button
                  onClick={handleAnalyze}
                  disabled={!input.trim() || isAnalyzing}
                  style={{
                    background: input.trim() && !isAnalyzing ? '#1a1815' : 'transparent',
                    border: '2px solid #1a1815',
                    color: input.trim() && !isAnalyzing ? '#e8e0d4' : '#6a655d',
                    padding: '12px 28px',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    cursor: input.trim() && !isAnalyzing ? 'pointer' : 'not-allowed',
                    fontFamily: "'Courier Prime', monospace",
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isAnalyzing ? 'WAIT...' : 'GENERATE'}
                </button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div style={{
              textAlign: 'center',
              padding: '60px 30px',
              background: 'rgba(255, 252, 245, 0.4)',
              border: '2px solid #2a2420'
            }}>
              <div style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: '24px',
                color: '#1a1815',
                marginBottom: '15px',
                letterSpacing: '8px'
              }}>
                • • •
              </div>
              <p style={{
                fontFamily: "'Courier Prime', monospace",
                color: '#4a4540',
                fontSize: '14px',
                margin: 0,
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>
                {phase === 'analyzing' && 'Reading between the lines...'}
                {phase === 'translating' && 'Finding the right melodies...'}
                {phase === 'generating' && 'Composing your playlist...'}
              </p>
            </div>
          )}

          {result && (
            <div>
              <div style={{
                background: 'rgba(255, 252, 245, 0.4)',
                border: '2px solid #2a2420',
                padding: '25px 30px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: '16px',
                  color: '#1a1815',
                  flex: 1
                }}>
                  "{input}"
                </p>
                <button
                  onClick={resetAll}
                  style={{
                    background: 'transparent',
                    border: '2px solid #3a3530',
                    color: '#3a3530',
                    padding: '8px 18px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: "'Courier Prime', monospace"
                  }}
                >
                  NEW
                </button>
              </div>

              {result.interpretation && (
                <div style={{
                  background: 'rgba(255, 252, 245, 0.4)',
                  border: '2px solid #2a2420',
                  padding: '30px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '25px'
                  }}>
                    {result.interpretation.location && (
                      <div>
                        <div style={{ 
                          fontFamily: "'Courier Prime', monospace",
                          fontSize: '10px', 
                          color: '#6a655d', 
                          marginBottom: '8px', 
                          letterSpacing: '2px', 
                          textTransform: 'uppercase' 
                        }}>LOCATION</div>
                        <div style={{ 
                          fontFamily: "'Anton', sans-serif",
                          fontSize: '22px', 
                          color: '#1a1815',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>{result.interpretation.location}</div>
                      </div>
                    )}
                    {result.interpretation.mood && (
                      <div>
                        <div style={{ 
                          fontFamily: "'Courier Prime', monospace",
                          fontSize: '10px', 
                          color: '#6a655d', 
                          marginBottom: '8px', 
                          letterSpacing: '2px', 
                          textTransform: 'uppercase' 
                        }}>MOOD</div>
                        <div style={{ 
                          fontFamily: "'Anton', sans-serif",
                          fontSize: '22px', 
                          color: '#3a3530',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>{result.interpretation.mood}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{
                background: 'rgba(255, 252, 245, 0.4)',
                border: '2px solid #2a2420',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '20px 30px',
                  borderBottom: '2px solid #2a2420',
                  background: '#1a1815'
                }}>
                  <p style={{
                    margin: 0,
                    fontFamily: "'Anton', sans-serif",
                    fontSize: '16px',
                    color: '#e8e0d4',
                    letterSpacing: '3px',
                    textTransform: 'uppercase'
                  }}>
                    {result.playlist?.length || 0} TRACKS SELECTED
                  </p>
                </div>
                
                <div>
                  {result.playlist?.map((track, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr auto',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '18px 30px',
                        borderBottom: i < result.playlist.length - 1 ? '1px solid rgba(42, 36, 32, 0.2)' : 'none'
                      }}
                    >
                      <span style={{
                        fontFamily: "'Anton', sans-serif",
                        fontSize: '18px',
                        color: '#9a958d'
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div style={{
                          fontFamily: "'Courier Prime', monospace",
                          fontSize: '15px',
                          color: '#1a1815',
                          marginBottom: '3px',
                          fontWeight: 700
                        }}>
                          {track.title}
                        </div>
                        <div style={{
                          fontFamily: "'Courier Prime', monospace",
                          fontSize: '13px',
                          color: '#6a655d',
                          fontStyle: 'italic'
                        }}>
                          {track.artist}
                        </div>
                      </div>
                      <span style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: '12px',
                        color: '#9a958d'
                      }}>
                        {track.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spotify Playlist Button */}
              <div style={{
                marginTop: '20px',
                padding: '30px',
                background: 'rgba(255, 252, 245, 0.4)',
                border: '2px solid #2a2420',
                textAlign: 'center'
              }}>
                {playlistCreated ? (
                  <div>
                    <p style={{
                      fontFamily: "'Courier Prime', monospace",
                      fontSize: '14px',
                      color: '#1a1815',
                      marginBottom: '15px'
                    }}>
                      ✓ Playlist created with {playlistCreated.tracksAdded} tracks!
                    </p>
                    <a
                      href={playlistCreated.playlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: '#1DB954',
                        color: '#fff',
                        padding: '14px 28px',
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                        borderRadius: '30px',
                        fontFamily: "'Courier Prime', monospace"
                      }}
                    >
                      OPEN IN SPOTIFY
                    </a>
                  </div>
                ) : (
                  <div>
                    <p style={{
                      fontFamily: "'Courier Prime', monospace",
                      fontSize: '11px',
                      color: '#6a655d',
                      marginBottom: '15px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase'
                    }}>
                      Save to your Spotify account
                    </p>
                    {spotifyToken ? (
                      <button
                        onClick={createSpotifyPlaylist}
                        disabled={isCreatingPlaylist}
                        style={{
                          background: isCreatingPlaylist ? '#6a655d' : '#1DB954',
                          border: 'none',
                          color: '#fff',
                          padding: '14px 28px',
                          fontSize: '13px',
                          fontWeight: 700,
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          cursor: isCreatingPlaylist ? 'not-allowed' : 'pointer',
                          borderRadius: '30px',
                          fontFamily: "'Courier Prime', monospace"
                        }}
                      >
                        {isCreatingPlaylist ? 'CREATING...' : 'CREATE SPOTIFY PLAYLIST'}
                      </button>
                    ) : (
                      <button
                        onClick={connectSpotify}
                        style={{
                          background: '#1DB954',
                          border: 'none',
                          color: '#fff',
                          padding: '14px 28px',
                          fontSize: '13px',
                          fontWeight: 700,
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          borderRadius: '30px',
                          fontFamily: "'Courier Prime', monospace"
                        }}
                      >
                        CONNECT SPOTIFY
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Apple Music Links */}
              <div style={{
                marginTop: '20px',
                padding: '30px',
                background: 'rgba(255, 252, 245, 0.4)',
                border: '2px solid #2a2420'
              }}>
                <p style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: '11px',
                  color: '#6a655d',
                  marginBottom: '20px',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}>
                  Listen on Apple Music
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center'
                }}>
                  {result.playlist?.map((track, i) => (
                    <a
                      key={i}
                      href={`https://music.apple.com/search?term=${encodeURIComponent(track.artist + ' ' + track.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: 'transparent',
                        color: '#3a3530',
                        padding: '8px 14px',
                        fontSize: '12px',
                        textDecoration: 'none',
                        border: '1px solid #3a3530',
                        fontFamily: "'Courier Prime', monospace"
                      }}
                    >
                      {track.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!result && !isAnalyzing && (
            <div>
              <p style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: '11px',
                color: '#6a655d',
                marginBottom: '18px',
                textAlign: 'center',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>
                Or try with
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                justifyContent: 'center'
              }}>
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #4a4540',
                      color: '#4a4540',
                      padding: '10px 16px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: "'Courier Prime', monospace"
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <footer style={{
            marginTop: '60px',
            textAlign: 'center',
            padding: '25px'
          }}>
            <div style={{
              width: '60px',
              height: '2px',
              background: '#2a2420',
              margin: '0 auto 20px'
            }} />
            <p style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: '11px',
              color: '#6a655d',
              letterSpacing: '3px',
              margin: 0,
              textTransform: 'uppercase'
            }}>
              Blackstars Studio
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
