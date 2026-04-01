import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ToolImageFormat = () => {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState(null);
  const [fileName, setFileName] = useState('');
  const [targetFormat, setTargetFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(0.9);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  
  const formats = [
    { value: 'image/jpeg', label: 'JPEG (JPG)', desc: 'Fotoğraflar için ideal, küçük boyut', icon: 'fa-image' },
    { value: 'image/png', label: 'PNG', desc: 'Şeffaf arkaplanlar için', icon: 'fa-file-image' },
    { value: 'image/webp', label: 'WEBP', desc: 'Modern web formatı, en iyi sıkıştırma', icon: 'fa-globe' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!imageSrc) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      const dataUrl = canvas.toDataURL(targetFormat, targetFormat !== 'image/png' ? quality : 1);
      
      const extension = targetFormat.split('/')[1].replace('jpeg', 'jpg');
      const baseName = fileName.split('.').slice(0, -1).join('.') || 'image';
      
      const link = document.createElement('a');
      link.download = `converted_${baseName}.${extension}`;
      link.href = dataUrl;
      link.click();
    };
    img.src = imageSrc;
  };

  const reset = () => {
    setImageSrc(null);
    setFileName('');
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const qualityPct = Math.round(quality * 100);
  const rangeFill = `${qualityPct}%`;

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-5xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="ev-icon ev-icon-success ev-icon-sm"><i className="fa-solid fa-file-image"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Format Değiştir</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>Resimleri farklı formatlara (PNG, JPG, WEBP) çevirin.</p>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col gap-6">
        {!imageSrc ? (
          <div 
            className="tool-drop-zone"
            onClick={() => fileInputRef.current?.click()}
            style={{'--drop-hover-color': 'var(--success)'}}
          >
            <div className="tool-drop-zone-icon" style={{background: 'hsla(153, 70%, 38%, 0.12)', color: 'var(--success)'}}>
              <i className="fa-solid fa-arrows-rotate"></i>
            </div>
            <h3>Dönüştürülecek Resmi Yükle</h3>
            <p>PNG, JPG veya WEBP türünde bir dosya seçin.<br/>
              <span style={{fontSize:'0.8rem', opacity: 0.7}}>Tüm yaygın resim formatları desteklenir</span>
            </p>
            <span className="ev-btn ev-btn-success" style={{marginTop: '0.5rem'}}>
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
                  <i className="fa-regular fa-file-image" style={{color:'var(--success)'}}></i>
                  <span title={fileName}>{fileName}</span>
                </div>
                <span className="tool-info-bar-meta" style={{color:'var(--success)'}}>
                  <i className="fa-solid fa-check-circle"></i> Yüklendi
                </span>
              </div>
            </div>

            <div className="tool-panel" style={{width:'100%', maxWidth:'320px'}}>
              <div className="tool-panel-title">
                <i className="fa-solid fa-sliders"></i> Dönüştürme Seçenekleri
              </div>
              
              <div className="um-field">
                <label>Hedef Format</label>
                <div className="tool-radio-group" style={{marginTop:'0.25rem'}}>
                  {formats.map(fmt => (
                    <div 
                      key={fmt.value}
                      className={`tool-radio-item ${targetFormat === fmt.value ? 'selected' : ''}`}
                      onClick={() => setTargetFormat(fmt.value)}
                    >
                      <div className="tool-radio-indicator">
                        <div className="tool-radio-dot"></div>
                      </div>
                      <div>
                        <div className="tool-radio-text">{fmt.label}</div>
                        <div style={{fontSize:'0.72rem', color:'var(--text-subtle)', marginTop:'1px'}}>{fmt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {targetFormat !== 'image/png' && (
                <div className="tool-range-wrap">
                  <div className="tool-range-header">
                    <span className="tool-range-label">Kalite Seviyesi</span>
                    <span className="tool-range-value" style={{color:'var(--success)'}}>{qualityPct}%</span>
                  </div>
                  <input 
                    type="range" 
                    className="tool-range-slider"
                    style={{'--range-pct': rangeFill, accentColor: 'var(--success)'}}
                    min="0.1" 
                    max="1" 
                    step="0.05" 
                    value={quality} 
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                  />
                  <div className="tool-range-footer">
                    <span>Küçük Boyut</span>
                    <span>Yüksek Kalite</span>
                  </div>
                </div>
              )}

              <div style={{paddingTop:'0.875rem', borderTop:'1px solid var(--border-color)', display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                <button 
                  onClick={handleDownload}
                  className="ev-btn ev-btn-success w-full justify-center"
                >
                  <i className="fa-solid fa-file-export"></i>
                  Dönüştür ve İndir
                </button>
                <button onClick={reset} className="ev-btn ev-btn-secondary w-full justify-center">
                  <i className="fa-solid fa-rotate-left"></i> Farklı Bir Dosya Seç
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

export default ToolImageFormat;
