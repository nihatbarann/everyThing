import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

const ToolQrScan = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState('');
  const [mode, setMode] = useState('camera');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner = null;
    
    if (mode === 'camera') {
      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
      html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", config, false);
      
      html5QrcodeScanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          html5QrcodeScanner.clear();
        },
        () => {}
      );
    }
    
    return () => {
      if (html5QrcodeScanner) {
        try { html5QrcodeScanner.clear(); } catch(e){}
      }
    };
  }, [mode]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-file");
      const decodedText = await html5QrCode.scanFile(file, true);
      setScanResult(decodedText);
    } catch (err) {
      alert("QR Kod okunamadı. Resim net değil veya geçerli bir karekod içermiyor.");
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(scanResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-5xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="ev-icon ev-icon-error ev-icon-sm"><i className="fa-solid fa-expand"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">QR Kod Okuyucu</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>Kamera veya resim dosyasından QR kod okutun.</p>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col items-center gap-6">
        
        {/* Mod Seçici */}
        {!scanResult && (
          <div className="tool-mode-switcher">
            <button 
              onClick={() => setMode('camera')}
              className={`tool-mode-btn ${mode === 'camera' ? 'active' : ''}`}
              style={mode === 'camera' ? {color: 'var(--error)'} : {}}
            >
              <i className="fa-solid fa-camera"></i> Kamera ile Tara
            </button>
            <button 
              onClick={() => setMode('file')}
              className={`tool-mode-btn ${mode === 'file' ? 'active' : ''}`}
              style={mode === 'file' ? {color: 'var(--error)'} : {}}
            >
              <i className="fa-solid fa-file-image"></i> Dosyadan Oku
            </button>
          </div>
        )}

        {/* Tarama Alanı */}
        {!scanResult ? (
          <div style={{width:'100%', maxWidth:'440px'}}>
            {mode === 'camera' ? (
              <div style={{
                background: 'var(--bg-surface)',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div id="qr-reader" style={{width:'100%', borderRadius:'var(--radius-lg)', overflow:'hidden', border:'none'}} />
              </div>
            ) : (
              <div>
                <div id="qr-reader-file" style={{display:'none'}}></div>
                <div 
                  className="tool-drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="tool-drop-zone-icon" style={{background:'hsla(350, 78%, 52%, 0.12)', color:'var(--error)'}}>
                    <i className="fa-solid fa-upload"></i>
                  </div>
                  <h3>QR Barkod Resmi Seçin</h3>
                  <p>Masaüstünüzde okutmak istediğiniz bir ekran alıntısı veya fotoğraf ekleyin.</p>
                  <span className="ev-btn" style={{backgroundColor:'var(--error)', color:'white', marginTop:'0.5rem', border:'none'}}>
                    <i className="fa-solid fa-folder-open"></i> Gözat
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    style={{display:'none'}} 
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            width:'100%', maxWidth:'480px', gap:'1.5rem',
            animation:'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both'
          }}>
            {/* Başarı İkonu */}
            <div style={{
              width:'72px', height:'72px',
              background:'hsla(153, 70%, 38%, 0.12)',
              border:'2px solid hsla(153, 70%, 38%, 0.25)',
              borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.75rem', color:'var(--success)',
              boxShadow:'0 8px 24px hsla(153, 70%, 38%, 0.15)'
            }}>
              <i className="fa-solid fa-check"></i>
            </div>
            
            <div style={{textAlign:'center'}}>
              <h2 style={{fontSize:'1.5rem', fontWeight:800, marginBottom:'0.35rem', color:'var(--text-main)'}}>Başarıyla Okundu!</h2>
              <p style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>İşte QR kodun içeriği:</p>
            </div>

            {/* Sonuç Metni */}
            <div style={{
              width:'100%', padding:'1.25rem 1.5rem',
              background:'var(--bg-hover)',
              border:'1.5px solid var(--border-color)',
              borderRadius:'var(--radius-lg)',
              position:'relative',
              wordBreak:'break-all',
              fontSize:'0.95rem', fontWeight:600,
              color:'var(--text-main)', lineHeight:'1.7'
            }}>
              <div style={{
                position:'absolute', inset:0,
                border:'2px solid var(--success)',
                borderRadius:'inherit',
                opacity:0.15,
                pointerEvents:'none'
              }}></div>
              {scanResult}
            </div>

            {/* Aksiyonlar */}
            <div style={{display:'flex', gap:'0.75rem', width:'100%', justifyContent:'center', flexWrap:'wrap'}}>
              <button 
                onClick={copyResult} 
                className="ev-btn ev-btn-primary flex-1 justify-center"
                style={{maxWidth:'200px', ...(copied ? {backgroundColor:'var(--success)'} : {})}}
              >
                <i className={`fa-${copied ? 'solid fa-check' : 'regular fa-copy'}`}></i>
                {copied ? 'Kopyalandı!' : 'Kopyala'}
              </button>
              
              {scanResult.startsWith('http') && (
                <a 
                  href={scanResult} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ev-btn flex-1 justify-center"
                  style={{ backgroundColor: 'var(--info)', color: 'white', maxWidth:'200px' }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i> Linke Git
                </a>
              )}
            </div>

            <div style={{paddingTop:'1.25rem', borderTop:'1px solid var(--border-color)', width:'100%', textAlign:'center'}}>
              <button 
                onClick={() => setScanResult('')} 
                className="ev-btn ev-btn-ghost"
              >
                <i className="fa-solid fa-rotate-right" style={{marginRight:'0.4rem'}}></i>
                Yeni QR Tara
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ToolQrScan;
