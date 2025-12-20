'use client';

import { useState, useEffect } from 'react';

const translations = {
  en: {
    tagline: 'Music for every moment',
    placeholder: 'Describe where you are, what you feel, what you see...',
    generate: 'GENERATE',
    wait: 'WAIT...',
    tuning: 'Tuning into the mood...',
    analyzing: 'Reading between the lines...',
    composing: 'Composing your playlist...',
    new: 'NEW',
    location: 'LOCATION',
    mood: 'MOOD',
    tracksSelected: 'TRACKS SELECTED',
    play: '▶ PLAY',
    orTryWith: 'Or try with',
    characters: 'characters'
  },
  it: {
    tagline: 'Musica per ogni momento',
    placeholder: 'Descrivi dove sei, cosa senti, cosa vedi...',
    generate: 'GENERA',
    wait: 'ATTENDI...',
    tuning: 'Sintonizzandosi sul mood...',
    analyzing: 'Leggendo tra le righe...',
    composing: 'Componendo la tua playlist...',
    new: 'NUOVA',
    location: 'LUOGO',
    mood: 'MOOD',
    tracksSelected: 'BRANI SELEZIONATI',
    play: '▶ ASCOLTA',
    orTryWith: 'Oppure prova con',
    characters: 'caratteri'
  },
  pl: {
    tagline: 'Muzyka na każdy moment',
    placeholder: 'Opisz gdzie jesteś, co czujesz, co widzisz...',
    generate: 'GENERUJ',
    wait: 'CZEKAJ...',
    tuning: 'Dostrajanie się do nastroju...',
    analyzing: 'Czytanie między wierszami...',
    composing: 'Komponowanie playlisty...',
    new: 'NOWA',
    location: 'MIEJSCE',
    mood: 'NASTRÓJ',
    tracksSelected: 'WYBRANYCH UTWORÓW',
    play: '▶ ODTWÓRZ',
    orTryWith: 'Lub spróbuj z',
    characters: 'znaków'
  },
  es: {
    tagline: 'Música para cada momento',
    placeholder: 'Describe dónde estás, qué sientes, qué ves...',
    generate: 'GENERAR',
    wait: 'ESPERA...',
    tuning: 'Sintonizando el mood...',
    analyzing: 'Leyendo entre líneas...',
    composing: 'Componiendo tu playlist...',
    new: 'NUEVA',
    location: 'LUGAR',
    mood: 'MOOD',
    tracksSelected: 'CANCIONES SELECCIONADAS',
    play: '▶ ESCUCHAR',
    orTryWith: 'O prueba con',
    characters: 'caracteres'
  }
};

export default function Home() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const browserLang = navigator.language?.slice(0, 2) || 'en';
    if (translations[browserLang]) {
      setLang(browserLang);
    }
  }, []);

  const t = translations[lang];

  const examplePrompts = [
    "Driving at night in Krakow",
    "Sunset aperitivo in Naples",
    "Walking in Lisbon, light rain",
    "Morning in Berlin, coffee and cigarette",
    "Lazy Sunday in Buenos Aires"
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
  };

  const getYouTubeLink = (artist, title) => {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(artist + ' ' + title)}`;
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
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
              {t.tagline}
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
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
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
                  {input.length > 0 ? `${input.length} ${t.characters}` : '...'}
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
                  {isAnalyzing ? t.wait : t.generate}
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
                {phase === 'analyzing' && t.analyzing}
                {phase === 'translating' && t.tuning}
                {phase === 'generating' && t.composing}
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
                  {t.new}
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
                    gap: '25px',
                    marginBottom: result.interpretation.atmosphere ? '25px' : '0'
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
                        }}>{t.location}</div>
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
                        }}>{t.mood}</div>
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
                  {result.interpretation.atmosphere && (
                    <div style={{
                      borderTop: '1px solid rgba(42, 36, 32, 0.2)',
                      paddingTop: '20px'
                    }}>
                      <p style={{
                        fontFamily: "'Courier Prime', monospace",
                        fontSize: '14px',
                        color: '#4a4540',
                        fontStyle: 'italic',
                        lineHeight: 1.7,
                        margin: 0
                      }}>
                        "{result.interpretation.atmosphere}"
                      </p>
                    </div>
                  )}
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
                    {result.playlist?.length || 0} {t.tracksSelected}
                  </p>
                </div>
                
                <div>
                  {result.playlist?.map((track, i) => (
                    <a
                      key={i}
                      href={getYouTubeLink(track.artist, track.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr auto',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '18px 30px',
                        borderBottom: i < result.playlist.length - 1 ? '1px solid rgba(42, 36, 32, 0.2)' : 'none',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                        fontSize: '11px',
                        color: '#FF0000',
                        fontWeight: 700
                      }}>
                        {t.play}
                      </span>
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
                {t.orTryWith}
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
