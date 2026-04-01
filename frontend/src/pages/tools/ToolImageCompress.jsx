import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

const ToolImageCompress = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOriginalFile(file);
      setCompressedFile(null);
    }
  };

  const handleCompress = async () => {
    if (!originalFile) return;
    setIsCompressing(true);
    
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidthOrHeight,
      useWebWorker: true
    };

    try {
      const compressed = await imageCompression(originalFile, options);
      setCompressedFile(compressed);
    } catch (error) {
      alert('Resim sıkıştırılırken bir hata oluştu.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedFile);
    link.download = `compressed_${originalFile.name}`;
    link.click();
  };

  const reset = () => {
    setOriginalFile(null);
    setCompressedFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const savingsPercent = compressedFile
    ? (100 - (compressedFile.size / originalFile.size) * 100).toFixed(1)
    : 0;

  const resolutionOptions = [
    { value: 800,  label: '800px', desc: 'Web / E-Mail' },
    { value: 1024, label: '1024px', desc: 'Normal Kullanım' },
    { value: 1920, label: '1920px', desc: 'Full HD (Önerilir)' },
    { value: 3840, label: '3840px', desc: '4K Çözünürlük' },
  ];

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-5xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="ev-icon ev-icon-warning ev-icon-sm"><i className="fa-solid fa-compress"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Dosya Boyutu Sıkıştır</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>Büyük resim dosyalarını kaliteyi koruyarak küçültün.</p>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col gap-6">
        {!originalFile ? (
          <div 
            className="tool-drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="tool-drop-zone-icon" style={{background: 'hsla(38, 92%, 48%, 0.12)', color: 'var(--warning)'}}>
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h3>Büyük Dosyanızı Yükleyin</h3>
            <p>MB'larca büyüklükteki resimleri çok az kalite kaybıyla küçültün.<br/>
              <span style={{fontSize:'0.8rem', opacity:0.7}}>PNG, JPG, WEBP desteklenir</span>
            </p>
            <span className="ev-btn ev-btn-warning" style={{marginTop:'0.5rem', backgroundColor:'var(--warning)', color:'#111', borderColor:'var(--warning)'}}>
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
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Orijinal Dosya */}
              <div className="tool-info-bar" style={{flexDirection:'column', alignItems:'flex-start', gap:'0.5rem', padding:'1rem 1.25rem'}}>
                <div style={{display:'flex', justifyContent:'space-between', width:'100%', marginBottom:'0.25rem'}}>
                  <span style={{fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)'}}>Orijinal Dosya</span>
                  <span style={{fontSize:'1rem', fontWeight:800, color:'var(--text-main)'}}>{formatBytes(originalFile.size)}</span>
                </div>
                <div className="tool-info-bar-name" style={{fontSize:'0.875rem'}}>
                  <i className="fa-regular fa-file-image" style={{color:'var(--primary)'}}></i>
                  <span title={originalFile.name}>{originalFile.name}</span>
                </div>
              </div>

              {/* Sonuç Alanı */}
              {isCompressing ? (
                <div className="tool-processing">
                  <i className="fa-solid fa-spinner tool-processing-spinner" style={{color:'var(--warning)'}}></i>
                  <span className="tool-processing-text">Akıllı sıkıştırma yapılıyor...</span>
                </div>
              ) : compressedFile ? (
                <div className="tool-result-card">
                  <div className="tool-result-header">
                    <span><i className="fa-solid fa-circle-check" style={{marginRight:'0.5rem'}}></i>Sıkıştırılmış Dosya</span>
                    <span className="tool-result-size">{formatBytes(compressedFile.size)}</span>
                  </div>
                  <div className="tool-result-saving">
                    <i className="fa-solid fa-fire-flame-curved" style={{marginRight:'0.4rem'}}></i>
                    Tam <strong>%{savingsPercent}</strong> alan tasarrufu sağladınız!
                  </div>
                </div>
              ) : (
                <div style={{
                  padding:'2rem', textAlign:'center',
                  color:'var(--text-subtle)', background:'var(--bg-surface)',
                  borderRadius:'var(--radius-lg)', border:'1px dashed var(--border-color)',
                  fontSize:'0.875rem'
                }}>
                  <i className="fa-regular fa-clock" style={{fontSize:'1.5rem', display:'block', marginBottom:'0.5rem', opacity:0.5}}></i>
                  Sıkıştırma işlemi için hazır. Ayarları yapıp başlatın.
                </div>
              )}
            </div>

            <div className="tool-panel" style={{width:'100%', maxWidth:'320px'}}>
              <div className="tool-panel-title">
                <i className="fa-solid fa-sliders"></i> Sıkıştırma Ayarları
              </div>
              
              <div className="um-field">
                <label>Hedef Maksimum Boyut</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    step="0.1" min="0.1" 
                    value={maxSizeMB} 
                    onChange={(e) => setMaxSizeMB(e.target.value)} 
                    className="flex-1" 
                  />
                  <span style={{
                    flexShrink:0, fontSize:'0.8rem', fontWeight:700, padding:'0.4rem 0.6rem',
                    background:'var(--bg-hover)', borderRadius:'var(--radius-sm)',
                    border:'1px solid var(--border-color)', color:'var(--text-muted)'
                  }}>MB</span>
                </div>
              </div>

              <div className="um-field">
                <label>Maksimum Çözünürlük</label>
                <div className="tool-radio-group" style={{marginTop:'0.25rem'}}>
                  {resolutionOptions.map(opt => (
                    <div 
                      key={opt.value}
                      className={`tool-radio-item ${maxWidthOrHeight === opt.value ? 'selected' : ''}`}
                      onClick={() => setMaxWidthOrHeight(opt.value)}
                      style={{'--item-color': 'var(--warning)'}}
                    >
                      <div className="tool-radio-indicator" style={maxWidthOrHeight === opt.value ? {borderColor:'var(--warning)'} : {}}>
                        <div className="tool-radio-dot" style={{background:'var(--warning)'}}></div>
                      </div>
                      <div>
                        <div className="tool-radio-text">{opt.label}</div>
                        <div style={{fontSize:'0.72rem', color:'var(--text-subtle)'}}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{paddingTop:'0.875rem', borderTop:'1px solid var(--border-color)', display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                {!compressedFile ? (
                  <button 
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="ev-btn w-full justify-center"
                    style={{ backgroundColor: 'var(--warning)', color: '#111', border:'none' }}
                  >
                    {isCompressing ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> İşleniyor</>
                    ) : (
                      <><i className="fa-solid fa-wand-magic-sparkles"></i> Sıkıştır</>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={handleDownload}
                    className="ev-btn ev-btn-success w-full justify-center"
                  >
                    <i className="fa-solid fa-download"></i>
                    Dosyayı İndir
                  </button>
                )}
                <button onClick={reset} className="ev-btn ev-btn-secondary w-full justify-center">
                  <i className="fa-solid fa-rotate-left"></i> Farklı İşlem
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolImageCompress;
