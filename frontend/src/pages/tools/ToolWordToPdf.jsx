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
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        setHtmlContent(result.value);
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
      x: 30,
      y: 30,
      width: doc.internal.pageSize.getWidth() - 60,
      windowWidth: targetElement.scrollWidth,
      autoPaging: 'text',
    }).catch(() => {
      alert("PDF oluşturulurken hata oluştu.");
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
            <div className="flex items-center gap-2 mb-0.5">
              <div className="ev-icon ev-icon-primary ev-icon-sm"><i className="fa-solid fa-file-word"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Word'den PDF'e Çevir</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>Düz metin (.docx) dosyalarını PDF formatına dönüştürüp indirin.</p>
          </div>
        </div>
      </header>

      {/* Uyarı */}
      <div className="tool-alert-warn">
        <i className="fa-solid fa-circle-exclamation"></i>
        <div>
          <strong>Önemli Bilgi:</strong> Tarayıcı içinde dönüştürme yapıldığından Word içindeki özel fontlar, karmaşık grafikler ve hizalamalar birebir PDF'ye geçmeyebilir. Genel metin içeriği ve başlıklar korunur.
        </div>
      </div>

      <div className="premium-card flex flex-col gap-6">
        
        {!fileName ? (
          <div 
            className="tool-drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="tool-drop-zone-icon" style={{background:'hsla(222, 85%, 55%, 0.12)', color:'var(--primary)'}}>
              <i className="fa-regular fa-file-word"></i>
            </div>
            <h3>Başlamak İçin .Docx Dosyası Seçin</h3>
            <p>Bir Word dosyasındaki metin ve temel görselleri PDF A4 formatında oluşturun.<br/>
              <span style={{fontSize:'0.8rem', opacity:0.7}}>Yalnızca .docx uzantılı dosyalar desteklenir</span>
            </p>
            <span className="ev-btn ev-btn-primary" style={{marginTop:'0.5rem'}}>
              <i className="fa-solid fa-folder-open"></i> Dosya Seç
            </span>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'0.875rem 1.25rem',
              background:'var(--bg-hover)', border:'1.5px solid var(--border-color)',
              borderRadius:'var(--radius-lg)', flexWrap:'wrap', gap:'0.75rem'
            }}>
              <div style={{display:'flex', alignItems:'center', gap:'0.875rem'}}>
                <div className="ev-icon ev-icon-primary">
                  <i className="fa-solid fa-file-invoice"></i>
                </div>
                <div>
                  <h4 style={{fontWeight:700, color:'var(--text-main)', maxWidth:'240px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}
                      title={fileName}>{fileName}</h4>
                  <span style={{fontSize:'0.75rem', color:'var(--success)', fontWeight:700}}>
                    <i className="fa-solid fa-check" style={{marginRight:'0.3rem'}}></i>HTML'ye Çözümlendi
                  </span>
                </div>
              </div>
              <div style={{display:'flex', gap:'0.625rem'}}>
                <button onClick={() => { setFileName(''); setHtmlContent(''); }} className="ev-btn ev-btn-ghost">
                  <i className="fa-solid fa-xmark"></i> İptal Et
                </button>
                <button onClick={handleDownload} disabled={isProcessing} className="ev-btn ev-btn-primary">
                  {isProcessing 
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> İşleniyor</>
                    : <><i className="fa-solid fa-download"></i> PDF İndir</>
                  }
                </button>
              </div>
            </div>
            
            <div className="tool-doc-preview">
              <div className="tool-doc-preview-header">
                <i className="fa-solid fa-eye" style={{marginRight:'0.4rem'}}></i>Metin Önizlemesi
              </div>
              <div className="tool-doc-preview-body">
                <div id="word-preview-container">
                  <div 
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                    style={{
                      lineHeight:'1.8', fontSize:'0.9rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <input 
          type="file" 
          accept=".docx" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{display:'none'}} 
        />
      </div>
    </div>
  );
};

export default ToolWordToPdf;
