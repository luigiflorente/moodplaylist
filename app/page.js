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
      background: 'linear-gradient(180deg, #1a1510 0%, #0d0a07 100%)',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: '#d4c4a8',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Texture legno/pelle */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.06,
        pointerEvents: 'none'
      }} />

      {/* Luce calda dall'alto tipo lampada da studio */}
      <div style={{
        position: 'fixed',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '50%',
        background: 'radial-gradient(ellipse, rgba(255, 200, 120, 0.07) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Header - Stile amplificatore vintage */}
        <header style={{ 
          marginBottom: '50px', 
          textAlign: 'center',
          padding: '50px 40px',
          background: 'linear-gradient(180deg, #2a211a 0%, #1a1510 100%)',
          borderRadius: '12px',
          border: '1px solid #3d3225',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,180,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          {/* Viti decorative */}
          <div style={{ position: 'absolute', top: '15px', left: '15px', width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #4a4035 0%, #2a2520 100%)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', top: '15px', right: '15px', width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #4a4035 0%, #2a2520 100%)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #4a4035 0%, #2a2520 100%)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #4a4035 0%, #2a2520 100%)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }} />

          {/* Logo vintage */}
          <div style={{
            fontSize: '10px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: '#c9a227',
            marginBottom: '12px',
            fontFamily: "'Georgia', serif",
            textShadow: '0 0 20px rgba(201, 162, 39, 0.3)'
          }}>
            ✦ Since 2024 ✦
          </div>
          
          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            fontWeight: 400,
            margin: '0 0 8px 0',
            lineHeight: 1.1,
            color: '#f4e4c8',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '3px',
            fontFamily: "'Georgia', serif"
          }}>
            MOOD PLAYLIST
          </h1>
          
          <p style={{
            fontSize: '11px',
            color: '#8b7355',
            margin: 0,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontStyle: 'italic'
          }}>
            Handcrafted Music Selection
          </p>

          {/* Manopole stile vintage */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '50px',
            marginTop: '35px'
          }}>
            {/* Manopola L */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #3d3225 0%, #1a1510 100%)',
                border: '2px solid #4a4035',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,220,180,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Indicatore manopola */}
                <div style={{
                  width: '2px',
                  height: '12px',
                  background: '#c9a227',
                  position: 'absolute',
                  top: '8px',
                  borderRadius: '1px',
                  boxShadow: '0 0 8px rgba(201, 162, 39, 0.5)'
                }} />
                {/* Centro manopola */}
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'linear-gradient(145deg, #2a2520 0%, #1a1510 100%)',
                  border: '1px solid #3d3225'
                }} />
              </div>
              <span style={{ fontSize: '9px', letterSpacing: '2px', color: '#6b5d4d', textTransform: 'uppercase' }}>Tone</span>
            </div>

            {/* Luce valvola centrale */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #1a1510 0%, #0d0a07 100%)',
                border: '2px solid #3d3225',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 0 20px rgba(255, 180, 100, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #ffb866 0%, #cc8844 50%, #995522 100%)',
                  boxShadow: '0 0 15px rgba(255, 180, 100, 0.6), 0 0 30px rgba(255, 150, 80, 0.3)'
                }} />
              </div>
              <span style={{ fontSize: '9px', letterSpacing: '2px', color: '#6b5d4d', textTransform: 'uppercase' }}>Power</span>
            </div>

            {/* Manopola R */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #3d3225 0%, #1a1510 100%)',
                border: '2px solid #4a4035',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,220,180,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '2px',
                  height: '12px',
                  background: '#c9a227',
                  position: 'absolute',
                  top: '8px',
                  transform: 'rotate(45deg)',
                  borderRadius: '1px',
                  boxShadow: '0 0 8px rgba(201, 162, 39, 0.5)'
                }} />
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'linear-gradient(145deg, #2a2520 0%, #1a1510 100%)',
                  border: '1px solid #3d3225'
                }} />
              </div>
              <span style={{ fontSize: '9px', letterSpacing: '2px', color: '#6b5d4d', textTransform: 'uppercase' }}>Volume</span>
            </div>
          </div>
        </header>

        {/* Error display */}
        {error && (
          <div style={{
            background: 'rgba(180, 80, 60, 0.15)',
            border: '1px solid rgba(180, 80, 60, 0.3)',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            color: '#d4a088',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            {error}
          </div>
        )}

        {/* Main Input Area */}
        {!result && (
          <div style={{
            background: 'linear-gradient(180deg, #2a211a 0%, #1a1510 100%)',
            border: '1px solid #3d3225',
            borderRadius: '12px',
            padding: '35px',
            marginBottom: '30px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,220,180,0.03)'
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descrivi dove sei, cosa senti, cosa vedi..."
              disabled={isAnalyzing}
              style={{
                width: '100%',
                minHeight: '120px',
                background: 'linear-gradient(180deg, #1a1510 0%, #0d0a07 100%)',
                border: '1px solid #3d3225',
                borderRadius: '6px',
                outline: 'none',
                color: '#d4c4a8',
                fontSize: '17px',
                fontFamily: "'Georgia', serif",
                lineHeight: 1.7,
                resize: 'none',
                padding: '20px',
                opacity: isAnalyzing ? 0.5 : 1,
                boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.4)'
              }}
            />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '25px'
            }}>
              <span style={{
                fontSize: '11px',
                color: '#6b5d4d',
                letterSpacing: '1px',
                fontStyle: 'italic'
              }}>
                {input.length > 0 ? `${input.length} caratteri` : 'In attesa...'}
              </span>
              
              <button
                onClick={handleAnalyze}
                disabled={!input.trim() || isAnalyzing}
                style={{
                  background: input.trim() && !isAnalyzing 
                    ? 'linear-gradient(180deg, #c9a227 0%, #8b7020 100%)'
                    : '#2a211a',
                  border: input.trim() && !isAnalyzing ? '1px solid #d4b32a' : '1px solid #3d3225',
                  color: input.trim() && !isAnalyzing ? '#1a1510' : '#6b5d4d',
                  padding: '14px 35px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: input.trim() && !isAnalyzing ? 'pointer' : 'not-allowed',
                  borderRadius: '6px',
                  transition: 'all 0.3s ease',
                  boxShadow: input.trim() && !isAnalyzing 
                    ? '0 4px 15px rgba(201, 162, 39, 0.3)' 
                    : 'none',
                  fontFamily: "'Georgia', serif"
                }}
              >
                {isAnalyzing ? '● Generating...' : '♪ Generate'}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div style={{
            textAlign: 'center',
            padding: '60px 30px',
            background: 'linear-gradient(180deg, #2a211a 0%, #1a1510 100%)',
            borderRadius: '12px',
            border: '1px solid #3d3225'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 30px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ffb866 0%, #cc8844 50%, #995522 100%)',
              boxShadow: '0 0 30px rgba(255, 180, 100, 0.5), 0 0 60px rgba(255, 150, 80, 0.2)'
            }} />
            <p style={{
              color: '#c9a227',
              fontSize: '13px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              margin: 0,
              fontStyle: 'italic'
            }}>
              {phase === 'analyzing' && 'Analizzando il contesto...'}
              {phase === 'translating' && 'Cercando artisti locali...'}
              {phase === 'generating' && 'Componendo la playlist...'}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Current Input Display */}
            <div style={{
              background: 'linear-gradient(180deg, #2a211a 0%, #1a1510 100%)',
              border: '1px solid #3d3225',
              borderRadius: '12px',
              padding: '25px 30px',
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
                  color: '#6b5d4d',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  La tua richiesta
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#d4c4a8',
                  fontStyle: 'italic'
                }}>
                  "{input}"
                </p>
              </div>
              <button
                onClick={resetAll}
                style={{
                  background: 'transparent',
                  border: '1px solid #4a4035',
                  color: '#8b7355',
                  padding: '10px 20px',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontFamily: "'Georgia', serif"
                }}
              >
                ✕ Nuovo
              </button>
            </div>

            {/* Location Info */}
            {result.interpretation && (
              <div style={{
                background: 'linear-gradient(180deg, #2a211a 0%, #1a1510 100%)',
                border: '1px solid #3d3225',
                borderRadius: '12px',
                padding: '30px',
                marginBottom: '24px'
              }}>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '2px',
                  color: '#6b5d4d',
                  marginBottom: '20px',
                  textTransform: 'uppercase'
                }}>
                  ✦ Interpretazione
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '20px'
                }}>
                  {result.interpretation.location && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#6b5d4d', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Luogo</div>
                      <div style={{ fontSize: '18px', color: '#f4e4c8' }}>{result.interpretation.location}</div>
                    </div>
                  )}
                  {result.interpretation.mood && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#6b5d4d', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Mood</div>
                      <div style={{ fontSize: '18px', color: '#c9a227' }}>{result.interpretation.mood}</div>
                    </div>
                  )}
                  {result.interpretation.region && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#6b5d4d', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Regione</div>
                      <div style={{ fontSize: '18px', color: '#a89078' }}>{result.interpretation.region}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Playlist */}
            <div style={{
              background: 'linear-gradient(180deg, #2a211a 0%, #1a1510 100%)',
              border: '1px solid #3d3225',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '25px 30px',
                borderBottom: '1px solid #3d3225',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '2px',
                  color: '#6b5d4d',
                  textTransform: 'uppercase'
                }}>
                  ✦ Playlist — {result.playlist?.length || 0} brani
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #cc4444 0%, #992222 100%)',
                  boxShadow: '0 0 10px rgba(204, 68, 68, 0.5)'
                }} />
              </div>
              
              <div>
                {result.playlist?.map((track, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '45px 1fr auto',
                      alignItems: 'center',
                      gap: '20px',
                      padding: '18px 30px',
                      borderBottom: i < result.playlist.length - 1 ? '1px solid #2a211a' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <span style={{
                      fontSize: '14px',
                      color: '#4a4035',
                      fontFamily: "'Georgia', serif"
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{
                        fontSize: '16px',
                        color: '#f4e4c8',
                        marginBottom: '4px'
                      }}>
                        {track.title}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#8b7355',
                        fontStyle: 'italic'
                      }}>
                        {track.artist}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: '#4a4035',
                      fontFamily: "'Georgia', serif"
                    }}>
                      {track.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Apple Music Links */}
            <div style={{
              marginTop: '24px',
              padding: '30px',
              background: 'linear-gradient(180deg, #2a211a 0%, #1a1510 100%)',
              borderRadius: '12px',
              border: '1px solid #3d3225'
            }}>
              <div style={{
                fontSize: '9px',
                letterSpacing: '2px',
                color: '#6b5d4d',
                marginBottom: '20px',
                textTransform: 'uppercase',
                textAlign: 'center'
              }}>
                Ascolta su Apple Music
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                justifyContent: 'center'
              }}>
                {result.playlist?.map((track, i) => (
                  
                    key={i}
                    href={`https://music.apple.com/search?term=${encodeURIComponent(track.artist + ' ' + track.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#1a1510',
                      color: '#a89078',
                      padding: '10px 16px',
                      fontSize: '12px',
                      textDecoration: 'none',
                      borderRadius: '20px',
                      border: '1px solid #3d3225',
                      fontFamily: "'Georgia', serif"
                    }}
                  >
                    <span style={{ color: '#4a4035', fontSize: '10px' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {track.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Example prompts */}
        {!result && !isAnalyzing && (
          <div>
            <div style={{
              fontSize: '9px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#4a4035',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Suggerimenti
            </div>
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
                    background: 'linear-gradient(180deg, #2a211a 0%, #1a1510 100%)',
                    border: '1px solid #3d3225',
                    color: '#8b7355',
                    padding: '12px 18px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontFamily: "'Georgia', serif",
                    fontStyle: 'italic'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{
          marginTop: '60px',
          textAlign: 'center',
          padding: '25px',
          borderTop: '1px solid #2a211a'
        }}>
          <p style={{
            fontSize: '10px',
            color: '#4a4035',
            letterSpacing: '2px',
            margin: 0,
            fontStyle: 'italic'
          }}>
            Blackstars Studio · 2024
          </p>
        </footer>
      </div>
    </div>
  );
}
