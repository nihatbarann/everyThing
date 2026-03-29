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

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-5xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <i className="fa-solid fa-compress text-[var(--warning)]"></i> 
              Dosya Boyutu Sıkıştır
            </h1>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col gap-6">
        {!originalFile ? (
          <div 
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)] cursor-pointer hover:border-[var(--warning)] transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h3 className="text-lg font-semibold mb-1">Büyük Dosyanızı Yükleyin</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">MB'larca büyüklükteki resimleri çok az kalite kaybıyla KB'lara düşürün.</p>
            <span className="ev-btn ev-btn-primary" style={{backgroundColor: 'var(--warning)', color: '#000'}}>Dosya Seç</span>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Orijinal Preivew */}
              <div className="flex flex-col gap-2 p-5 bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)]">
                <div className="font-bold border-b border-[var(--border-color)] pb-2 mb-2 flex justify-between items-center text-[var(--text-main)]">
                  <span>Orijinal Dosya</span>
                  <span className="text-[var(--primary)]">{formatBytes(originalFile.size)}</span>
                </div>
                <div className="text-sm">
                  <strong>Dosya Adı:</strong> <span className="text-[var(--text-muted)]">{originalFile.name}</span>
                </div>
              </div>

              {/* Sonuç Preview */}
              {isCompressing ? (
                <div className="flex flex-col gap-3 p-10 items-center justify-center bg-[var(--bg-hover)] rounded-xl border border-[var(--border-color)] border-dashed animate-pulse">
                  <i className="fa-solid fa-spinner fa-spin text-3xl text-[var(--warning)]"></i>
                  <span className="font-medium text-[var(--text-muted)]">Akıllı sıkıştırma yapılıyor...</span>
                </div>
              ) : compressedFile ? (
                <div className="flex flex-col gap-2 p-5 bg-[var(--success)]/10 rounded-xl border border-[var(--success)]/30 mt-2 slide-in-bottom">
                  <div className="font-bold border-b border-[var(--success)]/30 pb-2 mb-2 flex justify-between items-center text-[var(--success)]">
                    <span><i className="fa-solid fa-circle-check mr-2"></i>Sıkıştırılmış Dosya</span>
                    <span className="text-xl">{formatBytes(compressedFile.size)}</span>
                  </div>
                  <div className="text-sm font-medium text-[var(--success)]">
                    Tam <strong>%{(100 - (compressedFile.size / originalFile.size) * 100).toFixed(1)}</strong> alan tasarrufu sağladınız!
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
                  Henüz sıkıştırma işlemi yapılmadı.
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="w-full md:w-80 flex flex-col gap-5 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-color)] shadow-sm h-fit">
              <h3 className="font-bold text-lg mb-1 border-b border-[var(--border-color)] pb-3">Sıkıştırma Ayarları</h3>
              
              <div className="um-field">
                <label>Hedef Maksimum Boyut (MB)</label>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.1" min="0.1" value={maxSizeMB} onChange={(e) => setMaxSizeMB(e.target.value)} className="flex-1" />
                  <span className="text-[var(--text-muted)] text-sm font-medium">MB</span>
                </div>
              </div>

              <div className="um-field">
                <label>Maksimum Çözünürlük (px)</label>
                <select value={maxWidthOrHeight} onChange={e => setMaxWidthOrHeight(Number(e.target.value))} className="h-10">
                  <option value={800}>800px (Web İçi / E-Mail)</option>
                  <option value={1024}>1024px (Normal Kullanım)</option>
                  <option value={1920}>1920px (Full HD Görünüm)</option>
                  <option value={3840}>3840px (4K Çözünürlük)</option>
                </select>
                <div className="text-xs text-[var(--text-muted)] mt-1 ml-1 leading-relaxed">
                  (Resmin genişliği veya yüksekliği bu değeri geçemez. Geçerse küçültülür.)
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] mt-4 flex flex-col gap-3">
                {!compressedFile ? (
                  <button 
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="ev-btn w-full justify-center"
                    style={{ backgroundColor: 'var(--warning)', color: '#000' }}
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
                    className="ev-btn w-full justify-center"
                    style={{ backgroundColor: 'var(--success)', color: 'white' }}
                  >
                    <i className="fa-solid fa-download"></i>
                    Dosyayı İndir
                  </button>
                )}
                <button onClick={reset} className="ev-btn ev-btn-secondary w-full justify-center">
                  Farklı İşlem
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
