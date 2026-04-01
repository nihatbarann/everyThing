import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const ToolImagesToPdf = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          dataUrl: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveItem = (index, direction) => {
    if (index + direction < 0 || index + direction >= images.length) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index + direction];
    newImages[index + direction] = temp;
    setImages(newImages);
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < images.length; i++) {
        const imgObj = images[i];
        
        if (i > 0) {
          doc.addPage();
        }

        const img = new Image();
        img.src = imgObj.dataUrl;
        await new Promise(resolve => {
          img.onload = resolve;
        });

        const a4Width = 210;
        const a4Height = 297;
        const margin = 10;
        const maxWidth = a4Width - (margin * 2);
        const maxHeight = a4Height - (margin * 2);
        
        const imgRatio = img.width / img.height;
        const pageRatio = maxWidth / maxHeight;

        let renderWidth = maxWidth;
        let renderHeight = maxHeight;

        if (imgRatio > pageRatio) {
          renderHeight = maxWidth / imgRatio;
        } else {
          renderWidth = maxHeight * imgRatio;
        }

        const x = (a4Width - renderWidth) / 2;
        const y = (a4Height - renderHeight) / 2;

        const isPng = imgObj.dataUrl.startsWith('data:image/png');
        doc.addImage(imgObj.dataUrl, isPng ? 'PNG' : 'JPEG', x, y, renderWidth, renderHeight);
      }

      doc.save('Resimler_Belgesi.pdf');

    } catch (e) {
      alert('PDF oluşturulurken hata meydana geldi.');
    } finally {
      setIsGenerating(false);
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
            <div className="flex items-center gap-2 mb-0.5">
              <div className="ev-icon ev-icon-info ev-icon-sm"><i className="fa-solid fa-file-pdf"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Resimlerden PDF Oluştur</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>PNG/JPG resimlerini birleştirerek çok sayfalı PDF oluşturun.</p>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col gap-6">
        
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem'}}>
          <div>
            <h3 style={{fontWeight:700, fontSize:'1rem', color:'var(--text-main)', marginBottom:'0.2rem'}}>Sayfaları Sırala</h3>
            <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Her resim ayrı bir PDF sayfasına basılacaktır.</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="ev-btn ev-btn-primary"
            style={{backgroundColor:'var(--info)'}}
          >
            <i className="fa-solid fa-plus"></i> Resim Ekle
          </button>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            multiple
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{display:'none'}} 
          />
        </div>

        {images.length === 0 ? (
          <div 
            className="tool-drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="tool-drop-zone-icon" style={{background:'hsla(200, 85%, 52%, 0.12)', color:'var(--info)'}}>
              <i className="fa-regular fa-images"></i>
            </div>
            <h3>Başlamak İçin Resimleri Seçin</h3>
            <p>Sıralı halde birleştirmek istediğiniz JPEG, PNG fotoğrafları buraya yükleyebilirsiniz.<br/>
              <span style={{fontSize:'0.8rem', opacity:0.7}}>Birden fazla dosya aynı anda seçilebilir</span>
            </p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'1.25rem', background:'var(--bg-hover)', padding:'1rem', borderRadius:'var(--radius-lg)', border:'1px solid var(--border-color)'}}>
            <div className="tool-img-grid">
              {images.map((img, index) => (
                <div key={img.id} className="tool-img-tile">
                  <div className="tool-img-tile-badge">{index + 1}</div>
                  
                  <div className="tool-img-tile-thumb">
                    <img src={img.dataUrl} alt="preview" />
                  </div>
                  
                  <div className="tool-img-tile-name" title={img.name}>{img.name}</div>

                  <div className="tool-img-tile-actions">
                    <div style={{display:'flex', gap:'0.25rem'}}>
                      <button 
                        onClick={() => moveItem(index, -1)} 
                        disabled={index === 0}
                        className="tool-img-action-btn"
                        title="Öne Al"
                      >
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                      <button 
                        onClick={() => moveItem(index, 1)} 
                        disabled={index === images.length - 1}
                        className="tool-img-action-btn"
                        title="Arkaya Al"
                      >
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                    <button 
                      onClick={() => removeImage(img.id)}
                      className="tool-img-delete-btn"
                      title="Kaldır"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              paddingTop:'1rem', borderTop:'1px solid var(--border-color)',
              display:'flex', flexDirection:'row', gap:'1rem',
              alignItems:'center', justifyContent:'space-between', flexWrap:'wrap'
            }}>
              <div style={{fontSize:'0.875rem', fontWeight:700, color:'var(--text-main)'}}>
                Toplam Sayfa: <span style={{color:'var(--info)', fontSize:'1rem'}}>{images.length}</span>
              </div>
              
              <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap'}}>
                <button 
                  onClick={() => setImages([])} 
                  className="ev-btn ev-btn-ghost"
                >
                  <i className="fa-solid fa-broom"></i> Tümünü Temizle
                </button>
                <button 
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="ev-btn ev-btn-primary justify-center"
                  style={{ backgroundColor: 'var(--info)' }}
                >
                  {isGenerating ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> İşleniyor...</>
                  ) : (
                    <><i className="fa-solid fa-file-export"></i> PDF Dosyasını İndir</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolImagesToPdf;
