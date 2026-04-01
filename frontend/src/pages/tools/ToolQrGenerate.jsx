import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

const ToolQrGenerate = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [level, setLevel] = useState('H');

  const handleDownload = () => {
    const canvas = document.getElementById('qr-canvas-download');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const sizeOptions = [
    { value: 128,  label: 'Küçük', desc: '128 × 128 px' },
    { value: 256,  label: 'Orta',  desc: '256 × 256 px' },
    { value: 512,  label: 'Büyük', desc: '512 × 512 px' },
    { value: 1024, label: 'Çok Büyük', desc: '1024 × 1024 px' },
  ];

  const levelOptions = [
    { value: 'L', label: 'Düşük',    desc: '%7 Kayıp Kurtarma' },
    { value: 'M', label: 'Orta',     desc: '%15 Kayıp Kurtarma' },
    { value: 'Q', label: 'Yüksek',   desc: '%25 Kayıp Kurtarma' },
    { value: 'H', label: 'En Yüksek',desc: '%30 Kayıp Kurtarma' },
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
              <div className="ev-icon ev-icon-info ev-icon-sm"><i className="fa-solid fa-qrcode"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">QR Kod Oluştur</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>Web siteniz, Wi-Fi veya herhangi bir metin için QR kodu yaratın.</p>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col lg:flex-row gap-8">
        
        {/* Sol: Kontroller */}
        <div className="flex-1 flex flex-col gap-5">
          
          {/* Metin/URL girişi */}
          <div className="um-field">
            <label><i className="fa-solid fa-link" style={{color:'var(--info)', marginRight:'0.3rem'}}></i>QR Kodu İçeriği</label>
            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)}
              placeholder="Sitenizin bağlantısı, bir telefon numarası veya metin..."
              style={{resize:'none', height:'7rem', fontSize:'0.95rem', lineHeight:'1.6'}}
            />
            <p style={{fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>
              <i className="fa-solid fa-bolt" style={{color:'var(--info)', marginRight:'0.3rem'}}></i>
              QR kod anında sağ tarafta oluşturulacaktır.
            </p>
          </div>

          {/* Boyut Seçimi */}
          <div className="um-field">
            <label>İndirme Boyutu</label>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginTop:'0.25rem'}}>
              {sizeOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`tool-radio-item ${size === opt.value ? 'selected' : ''}`}
                  onClick={() => setSize(opt.value)}
                >
                  <div className="tool-radio-indicator">
                    <div className="tool-radio-dot" style={{background:'var(--info)'}}></div>
                  </div>
                  <div>
                    <div className="tool-radio-text">{opt.label}</div>
                    <div style={{fontSize:'0.7rem', color:'var(--text-subtle)'}}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hata Düzeltme */}
          <div className="um-field">
            <label>Hata Düzeltme Seviyesi</label>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginTop:'0.25rem'}}>
              {levelOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`tool-radio-item ${level === opt.value ? 'selected' : ''}`}
                  onClick={() => setLevel(opt.value)}
                >
                  <div className="tool-radio-indicator">
                    <div className="tool-radio-dot" style={{background:'var(--info)'}}></div>
                  </div>
                  <div>
                    <div className="tool-radio-text">{opt.label}</div>
                    <div style={{fontSize:'0.7rem', color:'var(--text-subtle)'}}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Renkler */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
            <div className="um-field">
              <label>Ön Plan Rengi</label>
              <div className="tool-color-wrap">
                <div className="tool-color-preview" style={{background: fgColor}}>
                  <input 
                    type="color" 
                    value={fgColor} 
                    onChange={e => setFgColor(e.target.value)}
                  />
                  <div className="tool-color-preview-swatch" style={{background: fgColor}}></div>
                </div>
                <span className="tool-color-hex">{fgColor.toUpperCase()}</span>
              </div>
            </div>
            <div className="um-field">
              <label>Arkaplan Rengi</label>
              <div className="tool-color-wrap">
                <div className="tool-color-preview" style={{background: bgColor}}>
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={e => setBgColor(e.target.value)}
                  />
                  <div className="tool-color-preview-swatch" style={{background: bgColor}}></div>
                </div>
                <span className="tool-color-hex">{bgColor.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ: Önizleme */}
        <div style={{width:'100%', maxWidth:'320px', display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div className="tool-qr-preview-card" style={{width:'100%'}}>
            <div className="tool-qr-preview-title">
              <i className="fa-solid fa-eye" style={{marginRight:'0.4rem'}}></i>Canlı Önizleme
            </div>
            
            <div className="tool-qr-canvas-wrap">
              <QRCodeSVG 
                value={text || ' '} 
                size={200}
                bgColor={bgColor}
                fgColor={fgColor}
                level={level}
                includeMargin={false}
              />
              <div style={{display:'none'}}>
                <QRCodeCanvas 
                  id="qr-canvas-download"
                  value={text || ' '} 
                  size={size}
                  bgColor={bgColor}
                  fgColor={fgColor}
                  level={level}
                  includeMargin={true}
                />
              </div>
            </div>

            <p style={{fontSize:'0.75rem', textAlign:'center', color:'var(--text-muted)', lineHeight:'1.6', maxWidth:'220px'}}>
              Önizleme 200px sabit boyuttur. İndirme yapıldığında <strong>{size}×{size} px</strong> boyutunda kaydedilir.
            </p>

            <button 
              onClick={handleDownload}
              className="ev-btn ev-btn-primary w-full justify-center"
              style={{ backgroundColor: 'var(--info)' }}
              disabled={!text}
            >
              <i className="fa-solid fa-download"></i>
              PNG Olarak İndir
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ToolQrGenerate;
