import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

const ToolWordToPdf = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    setHtmlContent('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        // Mammoth reads DOCX and translates it to simple HTML
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        setHtmlContent(result.value); // The generated HTML
      } catch (err) {

        alert('Word dosyası okunamadı. Desteklenmeyen bir format veya şifreli olabilir.');
        setFileName('');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!htmlContent) return;
    setIsProcessing(true);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const targetElement = document.getElementById('word-preview-container');

    doc.html(targetElement, {
      callback: function (doc) {
        let name = fileName.replace(/\.[^/.]+$/, "");
        doc.save(`${name}_indirilen.pdf`);
        setIsProcessing(false);
      },
      x: 30, // margins
      y: 30,
      width: doc.internal.pageSize.getWidth() - 60,
      windowWidth: targetElement.scrollWidth,
      autoPaging: 'text',
    }).catch(err => {
      alert("PDF oluşturulurken hata oluştu. Lütfen dosyanızın çok karmaşık medya içermediğinden emin olun.");
      setIsProcessing(false);
    });
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-6xl mx-auto w-full text-[var(--text-main)]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-file-word text-[var(--primary)]"></i> 
              Word'den PDF'e Çevir
            </h1>
          </div>
        </div>
      </header>

      {/* Warning Alert */}
      <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 p-4 rounded-xl flex items-start gap-3">
        <i className="fa-solid fa-circle-exclamation text-[var(--warning)] mt-1"></i>
        <div className="text-sm">
          <strong>Önemli Bilgi:</strong> Tarayıcı içinde dönüştürme yapıldığından Word içindeki özel fontlar, karmaşık grafikler ve hizalamalar birebir ölçüde PDF'ye geçmeyebilir. Genel metin içeriği ve başlıklar korunur.
        </div>
      </div>

      <div className="premium-card flex flex-col gap-6">
        
        {!fileName ? (
          <div 
            className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)] cursor-pointer hover:border-[var(--primary)] transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-3xl mb-4 group-hover:-translate-y-2 transition-transform">
              <i className="fa-regular fa-file-word"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Başlamak İçin .Docx Dosyası Seçin</h3>
            <p className="text-[var(--text-muted)] text-center max-w-md mb-4">Bir Word dosyasındaki metin ve temel görselleri PDF A4 formatında oluşturun.</p>
            <span className="ev-btn ev-btn-primary">Dosya Seç</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center p-4 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-file-invoice text-2xl text-[var(--primary)]"></i>
                <div>
                  <h4 className="font-bold max-w-xs truncate" title={fileName}>{fileName}</h4>
                  <span className="text-xs text-[var(--success)] font-bold"><i className="fa-solid fa-check"></i> HTML'ye Çözümlendi</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFileName(''); setHtmlContent(''); }} className="ev-btn ev-btn-ghost">
                  İptal Et
                </button>
                <button onClick={handleDownload} disabled={isProcessing} className="ev-btn ev-btn-primary">
                  {isProcessing ? <><i className="fa-solid fa-spinner fa-spin"></i> İşleniyor</> : <><i className="fa-solid fa-download"></i> PDF İndir</>}
                </button>
              </div>
            </div>
            
            <div className="bg-white text-black p-8 rounded-xl border border-gray-300 w-full overflow-auto max-h-[500px] shadow-inner" style={{ minHeight: '300px' }}>
               <h3 className="text-center font-bold text-gray-400 border-b pb-2 mb-4">Metin Önizlemesi</h3>
               
               {/* Container for PDF Generation mapping */}
               <div id="word-preview-container" className="text-[14px] leading-relaxed w-full">
                  <div 
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                    className="
                      [&>p]:mb-4 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-3
                      [&>table]:border-collapse [&>table]:border [&>table]:border-gray-300 [&>table]:w-full
                      [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 
                      [&_img]:max-w-full [&_img]:h-auto
                    "
                  />
               </div>
            </div>
          </div>
        )}

        <input 
          type="file" 
          accept=".docx" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default ToolWordToPdf;
