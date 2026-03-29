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
    { value: 'image/jpeg', label: 'JPEG (JPG)' },
    { value: 'image/png', label: 'PNG' },
    { value: 'image/webp', label: 'WEBP' }
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
      
      // If converting to JPEG, fill with white background first to avoid black backgrounds for transparent PNGs
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

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-5xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <i className="fa-solid fa-file-image text-[var(--success)]"></i> 
              Format Değiştir
            </h1>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col gap-6">
        {!imageSrc ? (
          <div 
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)] cursor-pointer hover:border-[var(--success)] transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h3 className="text-lg font-semibold mb-1">Dönüştürülecek Resmi Yükle</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">PNG, JPG veya WEBP türünde bir dosya seçin.</p>
            <span className="ev-btn ev-btn-primary" style={{backgroundColor: 'var(--success)'}}>Dosya Seç</span>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-4">
              <div className="aspect-video bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] overflow-hidden flex items-center justify-center p-4 relative" style={{ minHeight: '300px' }}>
                <img src={imageSrc} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-lg" />
              </div>
              <div className="text-sm font-medium text-[var(--text-muted)] flex justify-between px-2 bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-color)]">
                <span className="truncate max-w-[80%]" title={fileName}><i className="fa-regular fa-file-image mr-1"></i> {fileName}</span>
              </div>
            </div>

            <div className="w-full lg:w-80 flex flex-col gap-5 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-color)] shadow-sm h-fit">
              <h3 className="font-bold text-lg mb-1 border-b border-[var(--border-color)] pb-3">Dönüştürme Seçenekleri</h3>
              
              <div className="um-field">
                <label>Hedef Format</label>
                <div className="flex flex-col gap-2 mt-2">
                  {formats.map(fmt => (
                    <label key={fmt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${targetFormat === fmt.value ? 'bg-[var(--success)]/10 border-[var(--success)]' : 'border-[var(--border-color)] bg-[var(--bg-hover)]'}`}>
                      <input 
                        type="radio" 
                        name="targetFormat" 
                        value={fmt.value} 
                        checked={targetFormat === fmt.value}
                        onChange={() => setTargetFormat(fmt.value)}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${targetFormat === fmt.value ? 'border-[var(--success)]' : 'border-[var(--text-muted)]'}`}>
                        {targetFormat === fmt.value && <div className="w-2 h-2 rounded-full bg-[var(--success)]" />}
                      </div>
                      <span className={`font-medium ${targetFormat === fmt.value ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                        {fmt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {targetFormat !== 'image/png' && (
                <div className="um-field mt-2 bg-[var(--bg-hover)] p-4 rounded-lg border border-[var(--border-color)]">
                  <div className="flex justify-between items-center mb-2">
                    <label className="mb-0">Kalite Seviyesi</label>
                    <span className="text-[var(--success)] font-bold">{Math.round(quality * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.05" 
                    value={quality} 
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-[var(--success)] cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1 font-medium">
                    <span>Küçük Boyut</span>
                    <span>Yüksek Kalite</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border-color)] mt-2 flex flex-col gap-3">
                <button 
                  onClick={handleDownload}
                  style={targetFormat ? { backgroundColor: 'var(--success)', color: 'white' } : {}}
                  className={`ev-btn ev-btn-primary w-full justify-center ${!targetFormat && 'opacity-50'}`}
                >
                  <i className="fa-solid fa-file-export"></i>
                  Dönüştür ve İndir
                </button>
                <button onClick={reset} className="ev-btn ev-btn-secondary w-full justify-center">
                  Farklı Bir Dosya Seç
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ToolImageFormat;
