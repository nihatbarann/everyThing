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
            <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <i className="fa-solid fa-crop-simple text-[var(--primary)]"></i> 
              Resim Boyutlandır
            </h1>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col gap-6">
        {!imageSrc ? (
          <div 
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)] cursor-pointer hover:border-[var(--primary)] transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h3 className="text-lg font-semibold mb-1">Resim Yükle</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">Sürükleyip bırakabilir veya tıklayarak seçebilirsiniz.</p>
            <span className="ev-btn ev-btn-primary">Dosya Seç</span>
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
                <span className="truncate max-w-[60%]" title={fileName}><i className="fa-regular fa-file-image mr-1"></i> {fileName}</span>
                <span>Orijinal: <span className="font-bold text-[var(--text-main)]">{originalSize.w} x {originalSize.h}</span></span>
              </div>
            </div>

            <div className="w-full lg:w-80 flex flex-col gap-5 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-color)] shadow-sm h-fit">
              <h3 className="font-bold text-lg mb-1 border-b border-[var(--border-color)] pb-3">Boyut Ayarları</h3>
              
              <div className="um-field">
                <label>Genişlik (X)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={newSize.w} onChange={(e) => handleWidthChange(e.target.value)} min="1" className="flex-1" />
                  <span className="text-[var(--text-muted)] text-sm font-medium px-2">px</span>
                </div>
              </div>

              <div className="um-field">
                <label>Yükseklik (Y)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={newSize.h} onChange={(e) => handleHeightChange(e.target.value)} min="1" className="flex-1" />
                  <span className="text-[var(--text-muted)] text-sm font-medium px-2">px</span>
                </div>
              </div>
              
              <div className="flex items-center mt-1 bg-[var(--bg-hover)] p-2 rounded-lg border border-[var(--border-color)]">
                <label className="flex items-center gap-2 cursor-pointer select-none w-full">
                  <input 
                    type="checkbox" 
                    checked={keepAspectRatio}
                    onChange={(e) => setKeepAspectRatio(e.target.checked)}
                    className="w-4 h-4 text-[var(--primary)] bg-[var(--bg-surface)] border-[var(--border-color)] rounded"
                  />
                  <span className="text-sm font-medium">En-Boy oranını koru <i className="fa-solid fa-link text-muted ml-1"></i></span>
                </label>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] mt-2 flex flex-col gap-3">
                <button 
                  onClick={handleDownload}
                  disabled={!newSize.w || !newSize.h}
                  className="ev-btn ev-btn-primary w-full justify-center"
                >
                  <i className="fa-solid fa-download"></i>
                  Yeni Halini İndir
                </button>
                <button onClick={reset} className="ev-btn ev-btn-secondary w-full justify-center">
                  Temizle & Farklı Seç
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

export default ToolImageResize;
