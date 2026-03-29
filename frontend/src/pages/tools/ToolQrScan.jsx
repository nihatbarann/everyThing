import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

const ToolQrScan = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState('');
  const [mode, setMode] = useState('camera'); // 'camera' or 'file'
  const fileInputRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner = null;
    
    if (mode === 'camera') {
      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
      html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", config, false);
      
      html5QrcodeScanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          html5QrcodeScanner.clear(); // stop scanning after success
        },
        (error) => {
          // just ignore scanning errors
        }
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
    alert('Kopyalandı!');
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-5xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <i className="fa-solid fa-expand text-[var(--error)]"></i> 
              QR Kod Okuyucu (Tarayıcı)
            </h1>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col items-center">
        
        {/* Mode Switcher */}
        {!scanResult && (
          <div className="flex items-center gap-4 mb-8 bg-[var(--bg-hover)] p-2 rounded-xl border border-[var(--border-color)]">
            <button 
              onClick={() => setMode('camera')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${mode === 'camera' ? 'bg-[var(--error)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              <i className="fa-solid fa-camera mr-2"></i> Kamera ile Tara
            </button>
            <button 
              onClick={() => setMode('file')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${mode === 'file' ? 'bg-[var(--error)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              <i className="fa-solid fa-file-image mr-2"></i> Dosyadan Oku
            </button>
          </div>
        )}

        {/* Scan Area */}
        {!scanResult ? (
          <div className="w-full max-w-md bg-[var(--bg-surface)] p-6 rounded-2xl border-2 border-[var(--border-color)] shadow-sm">
            {mode === 'camera' ? (
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden [&_video]:rounded-xl [&_video]:w-full" style={{border:'none'}} />
            ) : (
              <div 
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)] cursor-pointer hover:border-[var(--error)] transition-colors group text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <div id="qr-reader-file" style={{display:'none'}}></div>
                <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 text-[var(--error)] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-upload"></i>
                </div>
                <h3 className="text-lg font-semibold mb-1">QR Barkod Resmi Seçin</h3>
                <p className="text-[var(--text-muted)] text-sm mb-4">Masaüstünüzde okutmak istediğiniz bir ekran alıntısı vb. ekleyin.</p>
                <span className="ev-btn" style={{backgroundColor: 'var(--error)', color: 'white'}}>Gözat</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full max-w-xl slide-in-bottom">
            <div className="w-20 h-20 bg-[var(--success)]/10 text-[var(--success)] rounded-full flex items-center justify-center text-3xl mb-4 border border-[var(--success)]/20 shadow-lg shadow-[var(--success)]/10">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-2xl font-bold mb-2">Başarıyla Okundu!</h2>
            <p className="text-[var(--text-muted)] mb-8 text-center">İşte QR kodun içeriği:</p>

            <div className="w-full p-6 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-2xl break-words relative min-h-[100px] flex items-center justify-center">
              <span className="text-lg font-medium text-[var(--text-main)] relative z-10 leading-relaxed max-w-[90%] break-all">
                {scanResult}
              </span>
              <div className="absolute top-0 left-0 w-full h-full border-2 border-[var(--success)] opacity-20 rounded-2xl pointer-events-none"></div>
            </div>

            <div className="flex gap-4 mt-8 w-full justify-center">
              <button 
                onClick={copyResult} 
                className="ev-btn ev-btn-primary flex-1 max-w-[200px] justify-center shadow-lg hover:shadow-xl transition-all"
              >
                <i className="fa-regular fa-copy"></i> Kopyala
              </button>
              
              {scanResult.startsWith('http') && (
                <a 
                  href={scanResult} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ev-btn justify-center flex-1 max-w-[200px] shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: 'var(--info)', color: 'white' }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i> Linke Git
                </a>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border-color)] w-full text-center">
              <button 
                onClick={() => setScanResult('')} 
                className="ev-btn ev-btn-ghost group hover:bg-[var(--bg-hover)]"
              >
                <i className="fa-solid fa-rotate-right group-hover:-rotate-90 transition-transform duration-300"></i> Eski Ekranına Dön & Yeni Tara
              </button>
           </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ToolQrScan;
