'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState(null);

  const examplePrompts = [
    "Guido di notte a Cracovia",
    "Aperitivo a Napoli al tramonto",
    "Passeggiata a Lisbona, piove leggero",
    "Mattina a Berlino, caffè e sigaretta",
    "Domenica pigra a Buenos Aires"
  ];

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setPhase('analyzing');

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
        throw new Error(errorData.error || `Errore: ${response.status}`);
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
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#e0e0e0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.04,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'fixed',
        top: '-30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        height: '60%',
        background: 'radial-gradient(ellipse, rgba(255, 150, 50, 0.08) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1
      }}>
        
        <header style={{ 
          marginBottom: '50px', 
          textAlign: 'center',
          padding: '40px 30px',
          background: 'linear-gradient(180deg, #0d0d0d 0%, #050505 100%)',
          borderRadius: '8px',
          border: '1px solid #1a1a1a',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}>
          <div style={{
            fontSize: '10px',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            color: '#ffaa32',
            marginBottom: '8px',
            fontWeight: 600,
            textShadow: '0 0 20px rgba(255, 170, 50, 0.5)'
          }}>
            ● REC
          </div>
          
          <h1 style={{
            fontSize: 'clamp(32px, 7vw, 48px)',
            fontWeight: 700,
            margin: '0 0 8px 0',
            lineHeight: 1,
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            letterSpacing: '-1px'
          }}>
            MOOD PLAYLIST
          </h1>
          
          <p style={{
            fontSize: '11px',
            color: '#555',
            margin: 0,
            letterSpacing: '3px',
            textTransform: 'uppercase'
          }}>
            Analog Music Generator
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            marginTop: '30px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
                border: '3px solid #2a2a2a',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 0 20px rgba(255, 170, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #ffaa32 0%, #ff8c00 100%)',
                  boxShadow: '0 0 15px #ffaa32, 0 0 30px #ff8c00'
                }} />
              </div>
              <span style={{ fontSize: '9px', letterSpacing: '2px', color: '#666' }}>L</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
                border: '3px solid #2a2a2a',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 0 20px rgba(255, 170, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #ffaa32 0%, #ff8c00 100%)',
                  boxShadow: '0 0 15px #ffaa32, 0 0 30px #ff8c00'
                }} />
              </div>
              <span style={{ fontSize: '9px', letterSpacing: '2px', color: '#666' }}>R</span>
            </div>
          </div>
        </header>

        {error && (
          <div style={{
            background: 'rgba(255, 50, 50, 0.1)',
            border: '1px solid rgba(255, 50, 50, 0.3)',
            borderRadius: '4px',
            padding: '16px 20px',
            marginBottom: '24px',
            color: '#ff6b6b',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {!result && (
          <div style={{
            background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
            border: '1px solid #1a1a1a',
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)'
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descrivi dove sei, cosa senti..."
              disabled={isAnalyzing}
              style={{
                width: '100%',
                minHeight: '100px',
                background: '#000',
                border: '1px solid #222',
                borderRadius: '4px',
                outline: 'none',
                color: '#ffaa32',
                fontSize: '18px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 1.6,
                resize: 'none',
                padding: '16px',
                opacity: isAnalyzing ? 0.5 : 1,
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
              }}
            />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px'
            }}>
              <span style={{
                fontSize: '11px',
                color: '#444',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '1px'
              }}>
                {input.length > 0 ? `${input.length} CHAR` : 'READY'}
              </span>
              
              <button
                onClick={handleAnalyze}
                disabled={!input.trim() || isAnalyzing}
                style={{
                  background: input.trim() && !isAnalyzing 
                    ? 'linear-gradient(180deg, #ffaa32 0%, #ff8c00 100%)'
                    : '#1a1a1a',
                  border: 'none',
                  color: input.trim() && !isAnalyzing ? '#000' : '#444',
                  padding: '14px 32px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: input.trim() && !isAnalyzing ? 'pointer' : 'not-allowed',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  boxShadow: input.trim() && !isAnalyzing 
                    ? '0 0 20px rgba(255, 170, 50, 0.3)' 
                    : 'none'
                }}
              >
                {isAnalyzing ? '● GENERATING...' : '▶ GENERATE'}
              </button>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
            borderRadius: '8px',
            border: '1px solid #1a1a1a'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ffaa32 0%, #ff8c00 100%)',
              boxShadow: '0 0 30px rgba(255, 170, 50, 0.5)'
            }} />
            <p style={{
              color: '#ffaa32',
              fontSize: '12px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              margin: 0
            }}>
              {phase === 'analyzing' && '● ANALYZING CONTEXT...'}
              {phase === 'translating' && '● FINDING LOCAL ARTISTS...'}
              {phase === 'generating' && '● GENERATING PLAYLIST...'}
            </p>
          </div>
        )}

        {result && (
          <div>
            <div style={{
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '2px',
                  color: '#444',
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>
                  INPUT SIGNAL
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#ffaa32',
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  "{input}"
                </p>
              </div>
              <button
                onClick={resetAll}
                style={{
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#666',
                  padding: '10px 20px',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                ✕ RESET
              </button>
            </div>

            {result.interpretation && (
              <div style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '2px',
                  color: '#444',
                  marginBottom: '16px',
                  textTransform: 'uppercase'
                }}>
                  ● SIGNAL ANALYSIS
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px'
                }}>
                  {result.interpretation.location && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px', letterSpacing: '1px' }}>LOCATION</div>
                      <div style={{ fontSize: '16px', color: '#fff' }}>{result.interpretation.location}</div>
                    </div>
                  )}
                  {result.interpretation.mood && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px', letterSpacing: '1px' }}>MOOD</div>
                      <div style={{ fontSize: '16px', color: '#ffaa32' }}>{result.interpretation.mood}</div>
                    </div>
                  )}
                  {result.interpretation.region && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px', letterSpacing: '1px' }}>REGION</div>
                      <div style={{ fontSize: '16px', color: '#888' }}>{result.interpretation.region}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '2px',
                  color: '#444',
                  textTransform: 'uppercase'
                }}>
                  ● OUTPUT — {result.playlist?.length || 0} TRACKS
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ff3333',
                  boxShadow: '0 0 10px #ff3333'
                }} />
              </div>
              
              <div>
                {result.playlist?.map((track, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr auto',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 24px',
                      borderBottom: i < result.playlist.length - 1 ? '1px solid #111' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{
                      fontSize: '14px',
                      color: '#333',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{
                        fontSize: '15px',
                        color: '#fff',
                        marginBottom: '2px',
                        fontWeight: 500
                      }}>
                        {track.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        {track.artist}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: '#333',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {track.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              padding: '24px',
              background: '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid #1a1a1a'
            }}>
              <div style={{
                fontSize: '9px',
                letterSpacing: '2px',
                color: '#444',
                marginBottom: '16px',
                textTransform: 'uppercase',
                textAlign: 'center'
              }}>
                OPEN IN APPLE MUSIC
              </div>
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#111',
                      color: '#888',
                      padding: '8px 14px',
                      fontSize: '12px',
                      textDecoration: 'none',
                      borderRadius: '20px',
                      border: '1px solid #222'
                    }}
                  >
                    <span style={{ color: '#444', fontSize: '10px' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {track.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {!result && !isAnalyzing && (
          <div>
            <div style={{
              fontSize: '9px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#333',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              PRESETS
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center'
            }}>
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    color: '#555',
                    padding: '10px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '4px'
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
          padding: '20px',
          borderTop: '1px solid #111'
        }}>
          <p style={{
            fontSize: '10px',
            color: '#333',
            letterSpacing: '2px',
            margin: 0
          }}>
            BLACKSTARS STUDIO © 2024
          </p>
        </footer>
      </div>
    </div>
  );
}
