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
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Special+Elite&display=swap');
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: '#1a1613',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Texture carta invecchiata */}
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"),
            radial-gradient(ellipse at 30% 20%, rgba(180, 140, 90, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(120, 80, 50, 0.06) 0%, transparent 50%)
          `,
          opacity: 0.15,
          pointerEvents: 'none'
        }} />

        {/* Macchie di caffè */}
        <div style={{
          position: 'fixed',
          top: '15%',
          right: '10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(101, 67, 33, 0.1) 0%, transparent 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'fixed',
          bottom: '25%',
          left: '5%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139, 90, 43, 0.08) 0%, transparent 70%)',
          filter: 'blur(15px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '750px',
          margin: '0 auto',
          padding: '60px 25px',
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* Header - stile carta invecchiata */}
          <header style={{ 
            marginBottom: '50px', 
            textAlign: 'center',
            padding: '50px 40px',
            background: 'linear-gradient(175deg, rgba(45, 36, 28, 0.95) 0%, rgba(30, 24, 18, 0.98) 100%)',
            borderRadius: '3px',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            border: '1px solid rgba(139, 90, 43, 0.2)'
          }}>
            {/* Bordo carta consumata */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '3px',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
              pointerEvents: 'none'
            }} />
            
            <p style={{
              fontFamily: "'Special Elite', 'Courier New', monospace",
              fontSize: '11px',
              letterSpacing: '3px',
              color: '#8b7355',
              marginBottom: '20px',
              textTransform: 'uppercase'
            }}>
              Est. 2024
            </p>
            
            <h1 style={{
              fontFamily: "'Cormorant Garamond', 'Garamond', Georgia, serif",
              fontSize: 'clamp(36px, 8vw, 56px)',
              fontWeight: 300,
              margin: '0 0 15px 0',
              lineHeight: 1,
              color: '#e8dcc8',
              letterSpacing: '4px',
              fontStyle: 'italic'
            }}>
              Mood Playlist
            </h1>
            
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '15px',
              color: '#9a8978',
              margin: 0,
              fontStyle: 'italic',
              letterSpacing: '1px'
            }}>
              Musica per ogni momento
            </p>

            {/* Linea decorativa */}
            <div style={{
              width: '60px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(139, 90, 43, 0.5), transparent)',
              margin: '25px auto 0'
            }} />
          </header>

          {/* Error display */}
          {error && (
            <div style={{
              background: 'rgba(120, 60, 40, 0.2)',
              border: '1px solid rgba(120, 60, 40, 0.3)',
              borderRadius: '3px',
              padding: '18px 22px',
              marginBottom: '25px',
              color: '#c9a088',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '15px',
              fontStyle: 'italic'
            }}>
              {error}
            </div>
          )}

          {/* Main Input Area */}
          {!result && (
            <div style={{
              background: 'linear-gradient(175deg, rgba(45, 36, 28, 0.9) 0%, rgba(30, 24, 18, 0.95) 100%)',
              border: '1px solid rgba(139, 90, 43, 0.15)',
              borderRadius: '3px',
              padding: '40px 35px',
              marginBottom: '35px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '3px',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.2)',
                pointerEvents: 'none'
              }} />
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Descrivi dove sei, cosa senti, cosa vedi..."
                disabled={isAnalyzing}
                style={{
                  width: '100%',
                  minHeight: '130px',
                  background: 'rgba(20, 16, 12, 0.6)',
                  border: 'none',
                  borderBottom: '1px solid rgba(139, 90, 43, 0.2)',
                  borderRadius: '0',
                  outline: 'none',
                  color: '#d4c4a8',
                  fontSize: '18px',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  lineHeight: 1.8,
                  resize: 'none',
                  padding: '20px 5px',
                  opacity: isAnalyzing ? 0.5 : 1,
                  fontStyle: 'italic',
                  position: 'relative',
                  zIndex: 1
                }}
              />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '25px',
                position: 'relative',
                zIndex: 1
              }}>
                <span style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '11px',
                  color: '#6b5d4d',
                  letterSpacing: '1px'
                }}>
                  {input.length > 0 ? `${input.length} caratteri` : '...'}
                </span>
                
                <button
                  onClick={handleAnalyze}
                  disabled={!input.trim() || isAnalyzing}
                  style={{
                    background: input.trim() && !isAnalyzing 
                      ? 'rgba(139, 90, 43, 0.3)'
                      : 'transparent',
                    border: '1px solid rgba(139, 90, 43, 0.4)',
                    color: input.trim() && !isAnalyzing ? '#d4c4a8' : '#6b5d4d',
                    padding: '14px 30px',
                    fontSize: '12px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    cursor: input.trim() && !isAnalyzing ? 'pointer' : 'not-allowed',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Special Elite', monospace"
                  }}
                >
                  {isAnalyzing ? 'Attendi...' : 'Genera'}
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div style={{
              textAlign: 'center',
              padding: '70px 30px',
              background: 'linear-gradient(175deg, rgba(45, 36, 28, 0.9) 0%, rgba(30, 24, 18, 0.95) 100%)',
              borderRadius: '3px',
              border: '1px solid rgba(139, 90, 43, 0.15)'
            }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '24px',
                color: '#c9a227',
                marginBottom: '15px',
                fontStyle: 'italic'
              }}>
                ◦ ◦ ◦
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: '#9a8978',
                fontSize: '16px',
                margin: 0,
                fontStyle: 'italic'
              }}>
                {phase === 'analyzing' && 'Leggo tra le righe...'}
                {phase === 'translating' && 'Cerco le melodie giuste...'}
                {phase === 'generating' && 'Compongo la tua playlist...'}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div>
              {/* Current Input Display */}
              <div style={{
                background: 'linear-gradient(175deg, rgba(45, 36, 28, 0.9) 0%, rgba(30, 24, 18, 0.95) 100%)',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                borderRadius: '3px',
                padding: '30px 35px',
                marginBottom: '25px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: 0,
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '18px',
                    color: '#d4c4a8',
                    fontStyle: 'italic',
                    lineHeight: 1.6
                  }}>
                    "{input}"
                  </p>
                </div>
                <button
                  onClick={resetAll}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(139, 90, 43, 0.3)',
                    color: '#8b7355',
                    padding: '10px 20px',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    fontFamily: "'Special Elite', monospace"
                  }}
                >
                  Ricomincia
                </button>
              </div>

              {/* Location Info */}
              {result.interpretation && (
                <div style={{
                  background: 'linear-gradient(175deg, rgba(45, 36, 28, 0.9) 0%, rgba(30, 24, 18, 0.95) 100%)',
                  border: '1px solid rgba(139, 90, 43, 0.15)',
                  borderRadius: '3px',
                  padding: '35px',
                  marginBottom: '25px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '25px'
                  }}>
                    {result.interpretation.location && (
                      <div>
                        <div style={{ 
                          fontFamily: "'Special Elite', monospace",
                          fontSize: '10px', 
                          color: '#6b5d4d', 
                          marginBottom: '8px', 
                          letterSpacing: '2px', 
                          textTransform: 'uppercase' 
                        }}>Luogo</div>
                        <div style={{ 
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: '20px', 
                          color: '#e8dcc8',
                          fontStyle: 'italic'
                        }}>{result.interpretation.location}</div>
                      </div>
                    )}
                    {result.interpretation.mood && (
                      <div>
                        <div style={{ 
                          fontFamily: "'Special Elite', monospace",
                          fontSize: '10px', 
                          color: '#6b5d4d', 
                          marginBottom: '8px', 
                          letterSpacing: '2px', 
                          textTransform: 'uppercase' 
                        }}>Mood</div>
                        <div style={{ 
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: '20px', 
                          color: '#c9a227',
                          fontStyle: 'italic'
                        }}>{result.interpretation.mood}</div>
                      </div>
                    )}
                    {result.interpretation.region && (
                      <div>
                        <div style={{ 
                          fontFamily: "'Special Elite', monospace",
                          fontSize: '10px', 
                          color: '#6b5d4d', 
                          marginBottom: '8px', 
                          letterSpacing: '2px', 
                          textTransform: 'uppercase' 
                        }}>Regione</div>
                        <div style={{ 
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: '20px', 
                          color: '#a89078',
                          fontStyle: 'italic'
                        }}>{result.interpretation.region}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Playlist */}
              <div style={{
                background: 'linear-gradient(175deg, rgba(45, 36, 28, 0.9) 0%, rgba(30, 24, 18, 0.95) 100%)',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '25px 35px',
                  borderBottom: '1px solid rgba(139, 90, 43, 0.1)'
                }}>
                  <p style={{
                    margin: 0,
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '14px',
                    color: '#8b7355',
                    fontStyle: 'italic',
                    letterSpacing: '1px'
                  }}>
                    {result.playlist?.length || 0} brani selezionati
                  </p>
                </div>
                
                <div>
                  {result.playlist?.map((track, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '35px 1fr auto',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '20px 35px',
                        borderBottom: i < result.playlist.length - 1 ? '1px solid rgba(139, 90, 43, 0.08)' : 'none'
                      }}
                    >
                      <span style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '12px',
                        color: '#5a4d40'
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: '17px',
                          color: '#e8dcc8',
                          marginBottom: '4px'
                        }}>
                          {track.title}
                        </div>
                        <div style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: '14px',
                          color: '#8b7355',
                          fontStyle: 'italic'
                        }}>
                          {track.artist}
                        </div>
                      </div>
                      <span style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '11px',
                        color: '#5a4d40'
                      }}>
                        {track.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apple Music Links */}
              <div style={{
                marginTop: '25px',
                padding: '35px',
                background: 'linear-gradient(175deg, rgba(45, 36, 28, 0.9) 0%, rgba(30, 24, 18, 0.95) 100%)',
                borderRadius: '3px',
                border: '1px solid rgba(139, 90, 43, 0.15)'
              }}>
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '13px',
                  color: '#6b5d4d',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  letterSpacing: '1px'
                }}>
                  Ascolta su Apple Music
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
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
                        gap: '8px',
                        background: 'rgba(139, 90, 43, 0.1)',
                        color: '#a89078',
                        padding: '10px 16px',
                        fontSize: '13px',
                        textDecoration: 'none',
                        borderRadius: '2px',
                        border: '1px solid rgba(139, 90, 43, 0.2)',
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontStyle: 'italic'
                      }}
                    >
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
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '13px',
                color: '#5a4d40',
                marginBottom: '20px',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                oppure prova con...
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center'
              }}>
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    style={{
                      background: 'rgba(45, 36, 28, 0.6)',
                      border: '1px solid rgba(139, 90, 43, 0.2)',
                      color: '#9a8978',
                      padding: '12px 18px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
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
            marginTop: '70px',
            textAlign: 'center',
            padding: '30px'
          }}>
            <div style={{
              width: '40px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(139, 90, 43, 0.3), transparent)',
              margin: '0 auto 20px'
            }} />
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '10px',
              color: '#4a4035',
              letterSpacing: '2px',
              margin: 0
            }}>
              Blackstars Studio
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
