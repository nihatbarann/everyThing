import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ToolImageResize = () => {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState(null);
  const [fileName, setFileName] = useState('');
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  const [newSize, setNewSize] = useState({ w: '', h: '' });
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalSize({ w: img.width, h: img.height });
        setNewSize({ w: img.width, h: img.height });
        setImageSrc(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleWidthChange = (val) => {
    let w = parseInt(val, 10);
    if (isNaN(w)) w = '';
    
    if (keepAspectRatio && w && originalSize.w) {
      let h = Math.round((w / originalSize.w) * originalSize.h);
      setNewSize({ w, h });
    } else {
      setNewSize(prev => ({ ...prev, w }));
    }
  };

  const handleHeightChange = (val) => {
    let h = parseInt(val, 10);
    if (isNaN(h)) h = '';
    
    if (keepAspectRatio && h && originalSize.h) {
      let w = Math.round((h / originalSize.h) * originalSize.w);
      setNewSize({ w, h });
    } else {
      setNewSize(prev => ({ ...prev, h }));
    }
  };

  const handleDownload = () => {
    if (!imageSrc || !newSize.w || !newSize.h) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = newSize.w;
    canvas.height = newSize.h;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, newSize.w, newSize.h);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `resized_${fileName || 'image.png'}`;
      link.href = dataUrl;
      link.click();
    };
    img.src = imageSrc;
  };

  const reset = () => {
    setImageSrc(null);
    setFileName('');
    setOriginalSize({ w: 0, h: 0 });
    setNewSize({ w: '', h: '' });
    if(fileInputRef.current) fileInputRef.current.value = '';
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
              <div className="ev-icon ev-icon-primary ev-icon-sm"><i className="fa-solid fa-crop-simple"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Resim Boyutlandır</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>Resimlerin piksel boyutlarını hassas şekilde ayarlayın.</p>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col gap-6">
        {!imageSrc ? (
          <div 
            className="tool-drop-zone group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="tool-drop-zone-icon" style={{background: 'hsla(222, 85%, 55%, 0.12)', color: 'var(--primary)'}}>
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h3>Resim Yükle</h3>
            <p>Sürükleyip bırakabilir veya tıklayarak seçebilirsiniz.<br/>
              <span style={{fontSize:'0.8rem', opacity:0.7}}>PNG, JPG, WEBP, GIF desteklenir</span>
            </p>
            <span className="ev-btn ev-btn-primary" style={{marginTop: '0.5rem'}}>
              <i className="fa-solid fa-folder-open"></i> Dosya Seç
            </span>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{display:'none'}} 
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-4">
              <div className="tool-preview-frame" style={{ minHeight: '300px' }}>
                <img src={imageSrc} alt="Preview" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}} />
              </div>
              <div className="tool-info-bar">
                <div className="tool-info-bar-name">
                  <i className="fa-regular fa-file-image" style={{color: 'var(--primary)'}}></i>
                  <span title={fileName}>{fileName}</span>
                </div>
                <span className="tool-info-bar-meta">
                  Orijinal: <strong style={{color: 'var(--text-main)'}}>{originalSize.w} × {originalSize.h} px</strong>
                </span>
              </div>
            </div>

            <div className="tool-panel" style={{width:'100%', maxWidth:'320px'}}>
              <div className="tool-panel-title">
                <i className="fa-solid fa-sliders"></i> Boyut Ayarları
              </div>
              
              <div className="um-field">
                <label>Genişlik (X)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={newSize.w} onChange={(e) => handleWidthChange(e.target.value)} min="1" className="flex-1" />
                  <span style={{
                    flexShrink:0, fontSize:'0.8rem', fontWeight:700, padding:'0.4rem 0.6rem',
                    background:'var(--bg-hover)', borderRadius:'var(--radius-sm)',
                    border:'1px solid var(--border-color)', color:'var(--text-muted)'
                  }}>px</span>
                </div>
              </div>

              <div className="um-field">
                <label>Yükseklik (Y)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={newSize.h} onChange={(e) => handleHeightChange(e.target.value)} min="1" className="flex-1" />
                  <span style={{
                    flexShrink:0, fontSize:'0.8rem', fontWeight:700, padding:'0.4rem 0.6rem',
                    background:'var(--bg-hover)', borderRadius:'var(--radius-sm)',
                    border:'1px solid var(--border-color)', color:'var(--text-muted)'
                  }}>px</span>
                </div>
              </div>
              
              <label className="tool-toggle-wrap">
                <span className="tool-toggle-label">
                  <i className="fa-solid fa-link"></i>
                  En-Boy Oranını Koru
                </span>
                <div className="tool-toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={keepAspectRatio}
                    onChange={(e) => setKeepAspectRatio(e.target.checked)}
                  />
                  <div className="tool-toggle-track"></div>
                </div>
              </label>

              <div style={{paddingTop:'0.875rem', borderTop:'1px solid var(--border-color)', display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                <button 
                  onClick={handleDownload}
                  disabled={!newSize.w || !newSize.h}
                  className="ev-btn ev-btn-primary w-full justify-center"
                >
                  <i className="fa-solid fa-download"></i>
                  Yeni Halini İndir
                </button>
                <button onClick={reset} className="ev-btn ev-btn-secondary w-full justify-center">
                  <i className="fa-solid fa-rotate-left"></i> Temizle &amp; Farklı Seç
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{display:'none'}} />
    </div>
  );
};

export default ToolImageResize;
