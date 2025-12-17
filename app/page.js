'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState(null);

  const examplePrompts = [
    "Sono seduto a un bar a Napoli centro, caffè espresso in mano",
    "Guido di notte a Cracovia con mia moglie, città illuminata",
    "Domenica pomeriggio, piove, sto leggendo sul divano",
    "Aperitivo al tramonto su una terrazza a Roma",
    "Mattina presto in montagna, nebbia e silenzio"
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
      background: 'linear-gradient(165deg, #1a1714 0%, #2d2620 50%, #1f1b17 100%)',
      fontFamily: "'EB Garamond', Georgia, serif",
      color: '#e8e0d5',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Texture overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.03,
        pointerEvents: 'none'
      }} />

      {/* Warm ambient glow */}
      <div style={{
        position: 'fixed',
        top: '-20%',
        right: '-10%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(ellipse, rgba(180, 120, 60, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 40px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <header style={{ marginBottom: '80px', textAlign: 'center' }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: '#a08060',
            marginBottom: '20px',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500
          }}>
            Traduttore di Contesti Musicali
          </div>
          <h1 style={{
            fontSize: 'clamp(42px, 8vw, 72px)',
            fontWeight: 400,
            margin: 0,
            lineHeight: 1.1,
            fontStyle: 'italic',
            background: 'linear-gradient(135deg, #e8e0d5 0%, #c4a882 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Mood Playlist
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#9a8a78',
            marginTop: '24px',
            fontWeight: 300,
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.7
          }}>
            Descrivi dove sei, cosa senti, cosa vedi.<br/>
            La musica seguirà.
          </p>
        </header>

        {/* Error display */}
        {error && (
          <div style={{
            background: 'rgba(180, 60, 60, 0.1)',
            border: '1px solid rgba(180, 60, 60, 0.3)',
            borderRadius: '4px',
            padding: '20px',
            marginBottom: '30px',
            color: '#e8a0a0'
          }}>
            {error}
          </div>
        )}

        {/* Main Input Area */}
        {!result && (
          <div style={{
            background: 'rgba(255, 250, 245, 0.02)',
            border: '1px solid rgba(180, 140, 100, 0.15)',
            borderRadius: '4px',
            padding: '40px',
            marginBottom: '40px',
            backdropFilter: 'blur(10px)'
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Sono seduto a un bar a Napoli centro..."
              disabled={isAnalyzing}
              style={{
                width: '100%',
                minHeight: '140px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e8e0d5',
                fontSize: '22px',
                fontFamily: "'EB Garamond', Georgia, serif",
                lineHeight: 1.7,
                resize: 'none',
                opacity: isAnalyzing ? 0.5 : 1
              }}
            />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '30px',
              paddingTop: '30px',
              borderTop: '1px solid rgba(180, 140, 100, 0.1)'
            }}>
              <span style={{
                fontSize: '13px',
                color: '#6a5a4a',
                fontFamily: "'Inter', sans-serif"
              }}>
                {input.length > 0 ? `${input.length} caratteri` : 'Descrivi il tuo momento'}
              </span>
              
              <button
                onClick={handleAnalyze}
                disabled={!input.trim() || isAnalyzing}
                style={{
                  background: input.trim() && !isAnalyzing 
                    ? 'linear-gradient(135deg, #8a6a4a 0%, #6a4a2a 100%)'
                    : 'rgba(100, 80, 60, 0.3)',
                  border: 'none',
                  color: '#e8e0d5',
                  padding: '16px 40px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: input.trim() && !isAnalyzing ? 'pointer' : 'not-allowed',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  opacity: input.trim() ? 1 : 0.5
                }}
              >
                {isAnalyzing ? 'Analizzo...' : 'Genera Playlist'}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div style={{
            textAlign: 'center',
            padding: '60px 0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginBottom: '40px'
            }}>
              {['analyzing', 'translating', 'generating'].map((p, i) => (
                <div key={p} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: phase === p ? 1 : (
                    ['analyzing', 'translating', 'generating'].indexOf(phase) > i ? 0.4 : 0.2
                  ),
                  transition: 'opacity 0.5s ease'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: phase === p ? '#c4a882' : 'rgba(180, 140, 100, 0.3)',
                    marginBottom: '12px',
                    animation: phase === p ? 'pulse 1.5s ease-in-out infinite' : 'none'
                  }} />
                  <span style={{
                    fontSize: '12px',
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: phase === p ? '#c4a882' : '#6a5a4a'
                  }}>
                    {p === 'analyzing' && 'Interpreto'}
                    {p === 'translating' && 'Traduco'}
                    {p === 'generating' && 'Genero'}
                  </span>
                </div>
              ))}
            </div>
            <p style={{
              color: '#9a8a78',
              fontStyle: 'italic',
              fontSize: '18px'
            }}>
              {phase === 'analyzing' && "Leggo il contesto, l'atmosfera, le sfumature..."}
              {phase === 'translating' && 'Traduco in parametri musicologici...'}
              {phase === 'generating' && 'Compongo la playlist perfetta...'}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: 'fadeIn 0.8s ease' }}>
            {/* Original prompt */}
            <div style={{
              background: 'rgba(180, 140, 100, 0.05)',
              border: '1px solid rgba(180, 140, 100, 0.1)',
              borderRadius: '4px',
              padding: '24px 30px',
              marginBottom: '40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <p style={{
                margin: 0,
                fontStyle: 'italic',
                fontSize: '18px',
                color: '#c4a882',
                flex: 1
              }}>
                "{input}"
              </p>
              <button
                onClick={resetAll}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(180, 140, 100, 0.3)',
                  color: '#9a8a78',
                  padding: '10px 20px',
                  fontSize: '12px',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                Nuovo
              </button>
            </div>

            {/* Interpretation */}
            <section style={{ marginBottom: '50px' }}>
              <h2 style={{
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#6a5a4a',
                marginBottom: '24px'
              }}>
                Interpretazione
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px'
              }}>
                {result.interpretation && Object.entries(result.interpretation).map(([key, value]) => (
                  <div key={key} style={{
                    background: 'rgba(255, 250, 245, 0.02)',
                    padding: '18px',
                    borderLeft: '2px solid rgba(180, 140, 100, 0.3)'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontFamily: "'Inter', sans-serif",
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      color: '#6a5a4a',
                      marginBottom: '8px'
                    }}>
                      {key === 'mood' && 'Mood'}
                      {key === 'energy' && 'Energia'}
                      {key === 'texture' && 'Texture'}
                      {key === 'setting' && 'Setting'}
                      {key === 'movement' && 'Movimento'}
                      {key === 'timeOfDay' && 'Momento'}
                      {key === 'atmosphere' && 'Atmosfera'}
                    </div>
                    <div style={{
                      fontSize: '15px',
                      color: '#c4a882',
                      lineHeight: 1.4
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Technical Parameters */}
            <section style={{ marginBottom: '50px' }}>
              <h2 style={{
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#6a5a4a',
                marginBottom: '24px'
              }}>
                Parametri Musicologici
              </h2>
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                padding: '24px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '12px',
                lineHeight: 1.9,
                overflowX: 'auto'
              }}>
                <div style={{ color: '#6a8a5a' }}>// Traduzione in parametri Spotify</div>
                {result.parameters && (
                  <>
                    <div><span style={{ color: '#8a6a4a' }}>valence:</span> <span style={{ color: '#c4a882' }}>{result.parameters.valence}</span> <span style={{ color: '#5a5a5a' }}>// positività emotiva</span></div>
                    <div><span style={{ color: '#8a6a4a' }}>energy:</span> <span style={{ color: '#c4a882' }}>{result.parameters.energy}</span> <span style={{ color: '#5a5a5a' }}>// intensità percepita</span></div>
                    <div><span style={{ color: '#8a6a4a' }}>tempo:</span> <span style={{ color: '#c4a882' }}>{result.parameters.tempo_min}-{result.parameters.tempo_max} BPM</span> <span style={{ color: '#5a5a5a' }}>// target: {result.parameters.tempo_target}</span></div>
                    <div><span style={{ color: '#8a6a4a' }}>acousticness:</span> <span style={{ color: '#c4a882' }}>{result.parameters.acousticness}</span></div>
                    <div><span style={{ color: '#8a6a4a' }}>instrumentalness:</span> <span style={{ color: '#c4a882' }}>{result.parameters.instrumentalness}</span></div>
                    <div><span style={{ color: '#8a6a4a' }}>danceability:</span> <span style={{ color: '#c4a882' }}>{result.parameters.danceability}</span></div>
                    <div><span style={{ color: '#8a6a4a' }}>mode:</span> <span style={{ color: '#c4a882' }}>"{result.parameters.mode}"</span></div>
                  </>
                )}
                <div style={{ marginTop: '12px', color: '#6a8a5a' }}>// Generi seed</div>
                <div><span style={{ color: '#8a6a4a' }}>genres:</span> [<span style={{ color: '#c4a882' }}>{result.genres?.map(g => `"${g}"`).join(', ')}</span>]</div>
              </div>
            </section>

            {/* Playlist */}
            <section>
              <h2 style={{
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#6a5a4a',
                marginBottom: '24px'
              }}>
                La Tua Playlist
              </h2>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                {result.playlist?.map((track, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr auto',
                      alignItems: 'start',
                      gap: '16px',
                      padding: '18px',
                      background: i % 2 === 0 ? 'rgba(255, 250, 245, 0.02)' : 'transparent',
                      borderRadius: '2px',
                      transition: 'background 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(180, 140, 100, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255, 250, 245, 0.02)' : 'transparent'}
                  >
                    <span style={{
                      fontSize: '14px',
                      color: '#5a4a3a',
                      fontFamily: "'Inter', sans-serif",
                      paddingTop: '2px'
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{
                        fontSize: '17px',
                        color: '#e8e0d5',
                        marginBottom: '4px'
                      }}>
                        {track.title}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#8a7a6a'
                      }}>
                        {track.artist}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6a5a4a',
                        fontStyle: 'italic',
                        marginTop: '6px',
                        lineHeight: 1.4
                      }}>
                        {track.reason}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: '#5a4a3a',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {track.year}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Individual track links */}
            <div style={{
              marginTop: '50px',
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '4px',
              border: '1px solid rgba(180, 140, 100, 0.1)'
            }}>
              <p style={{
                color: '#6a5a4a',
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '1px',
                textTransform: 'uppercase',
                margin: '0 0 16px 0',
                textAlign: 'center'
              }}>
                Apri su Apple Music
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(180, 140, 100, 0.1)',
                      color: '#c4a882',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontFamily: "'Inter', sans-serif",
                      textDecoration: 'none',
                      borderRadius: '20px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ 
                      opacity: 0.5,
                      fontSize: '10px'
                    }}>
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
          <div style={{ marginTop: '60px' }}>
            <div style={{
              fontSize: '11px',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#5a4a3a',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Esempi
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
                    background: 'transparent',
                    border: '1px solid rgba(180, 140, 100, 0.2)',
                    color: '#8a7a6a',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontFamily: "'EB Garamond', Georgia, serif",
                    fontStyle: 'italic',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
