import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

const ToolQrGenerate = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [level, setLevel] = useState('H'); // L, M, Q, H

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

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-5xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <i className="fa-solid fa-qrcode text-[var(--info)]"></i> 
              QR Kod Oluştur
            </h1>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col lg:flex-row gap-8">
        
        {/* Left column / Controls */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="um-field">
            <label className="text-base font-bold text-[var(--text-main)]"><i className="fa-solid fa-link text-[var(--info)] mr-1"></i> QR Kodu İçeriği (Metin / Bağlantı)</label>
            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)}
              placeholder="Sitenizin bağlantısı, bir telefon numarası numarası, veya metin..."
              className="resize-none h-32 text-base p-4"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">Karekod anında sağ tarafta oluşturulacaktır.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2 bg-[var(--bg-hover)] p-5 rounded-xl border border-[var(--border-color)]">
            <div className="um-field">
              <label>Karekod Kare Boyutu</label>
              <select value={size} onChange={e => setSize(Number(e.target.value))} className="h-10">
                <option value={128}>Küçük (128x128)</option>
                <option value={256}>Orta (256x256)</option>
                <option value={512}>Büyük (512x512)</option>
                <option value={1024}>Çok Büyük (1024x1024)</option>
              </select>
            </div>

            <div className="um-field">
              <label>Hata Düzeltme Seviyesi</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="h-10">
                <option value="L">Düşük (%7 Kayıp Kurtarma)</option>
                <option value="M">Orta (%15 Kayıp Kurtarma)</option>
                <option value="Q">Yüksek (%25 Kayıp Kurtarma)</option>
                <option value="H">En Yüksek (%30 Kayıp Kurtarma)</option>
              </select>
            </div>
            
            <div className="um-field">
              <label>Ön Plan Rengi</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={fgColor} 
                  onChange={e => setFgColor(e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <span className="text-sm font-mono text-[var(--text-muted)]">{fgColor.toUpperCase()}</span>
              </div>
            </div>

            <div className="um-field">
              <label>Arka Plan Rengi</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={e => setBgColor(e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <span className="text-sm font-mono text-[var(--text-muted)]">{bgColor.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column / Preview */}
        <div className="w-full lg:w-96 flex flex-col items-center">
          <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-color)] rounded-2xl w-full p-8 flex flex-col items-center justify-center gap-6 shadow-sm">
            
            <div className="font-bold text-center text-lg w-full border-b border-[var(--border-color)] pb-3">Canlı Önizleme</div>
            
            <div className="p-4 bg-white rounded-xl shadow-md flex items-center justify-center" style={{ minWidth: '200px', minHeight: '200px' }}>
              {/* Visible SVG rendering for smooth UI scaling */}
              <QRCodeSVG 
                value={text || ' '} 
                size={200}
                bgColor={bgColor}
                fgColor={fgColor}
                level={level}
                includeMargin={false}
              />
              
              {/* Hidden Canvas rendering for high-res download */}
              <div className="hidden">
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

            <p className="text-xs text-center text-[var(--text-muted)] max-w-xs leading-relaxed">
              Önizleme 200px sabit boyuttadır. İndirme yaptığınızda seçtiğiniz <strong>{size}x{size}</strong> boyutunda indirilecektir.
            </p>

            <button 
              onClick={handleDownload}
              className="ev-btn ev-btn-primary w-full justify-center mt-2 shadow-sm"
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
