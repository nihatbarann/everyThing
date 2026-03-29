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
        
        // Sığdırma işlemi: Kenar boşlukları bırakalım (10mm)
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
            <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <i className="fa-solid fa-file-pdf text-[var(--info)]"></i> 
              Resimlerden PDF Oluştur
            </h1>
          </div>
        </div>
      </header>

      <div className="premium-card flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Sayfaları Sırala</h3>
            <p className="text-sm text-[var(--text-muted)]">Her resim ayrı bir PDF sayfasına basılacaktır.</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="ev-btn ev-btn-primary"
            style={{backgroundColor: 'var(--info)'}}
          >
            <i className="fa-solid fa-plus"></i> Resim Ekle
          </button>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            multiple
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </div>

        {images.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)] cursor-pointer hover:border-[var(--info)] transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--info)]/10 text-[var(--info)] flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
              <i className="fa-regular fa-images"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Başlamak İçin Resimleri Seçin</h3>
            <p className="text-[var(--text-muted)] text-center max-w-md">Sıralı halde birleştirmek istediğiniz tüm JPEG, PNG fotoğrafları buraya yükleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border-color)]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={img.id} className="relative group bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-color)] shadow-sm flex flex-col gap-2">
                  <div className="absolute top-1 left-1 bg-black/60 text-white rounded px-2 py-0.5 text-xs font-bold z-10 backdrop-blur-sm">
                    {index + 1}
                  </div>
                  
                  <div className="aspect-[3/4] w-full bg-[var(--bg-hover)] rounded border flex items-center justify-center overflow-hidden">
                    <img src={img.dataUrl} alt="preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="text-xs text-center truncate px-1 text-[var(--text-muted)] font-medium" title={img.name}>
                    {img.name}
                  </div>

                  {/* Actions overlay */}
                  <div className="flex justify-between items-center w-full px-1">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => moveItem(index, -1)} 
                        disabled={index === 0}
                        className="w-7 h-7 rounded bg-[var(--bg-hover)] hover:bg-[var(--primary)] hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-[var(--bg-hover)] disabled:hover:text-current flex items-center justify-center"
                      >
                        <i className="fa-solid fa-chevron-left text-xs"></i>
                      </button>
                      <button 
                        onClick={() => moveItem(index, 1)} 
                        disabled={index === images.length - 1}
                        className="w-7 h-7 rounded bg-[var(--bg-hover)] hover:bg-[var(--primary)] hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-[var(--bg-hover)] disabled:hover:text-current flex items-center justify-center"
                      >
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                      </button>
                    </div>
                    <button 
                      onClick={() => removeImage(img.id)}
                      className="w-7 h-7 rounded text-[var(--error)] bg-[var(--error)]/10 hover:bg-[var(--error)] hover:text-white transition-colors flex items-center justify-center"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-[var(--border-color)] mt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-sm font-bold text-[var(--text-main)]">Toplam Sayfa: <span className="text-[var(--primary)]">{images.length}</span></div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setImages([])} 
                  className="ev-btn ev-btn-ghost flex-1 sm:flex-none justify-center"
                >
                  <i className="fa-solid fa-broom"></i> Tümünü Temizle
                </button>
                <button 
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="ev-btn ev-btn-primary flex-1 sm:flex-none justify-center shadow-md shadow-[var(--info)]/20"
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
