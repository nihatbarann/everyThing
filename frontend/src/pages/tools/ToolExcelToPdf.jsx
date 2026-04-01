import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const ToolExcelToPdf = () => {
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
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const htmlStr = XLSX.utils.sheet_to_html(worksheet, { id: "excel-table", header: " " });
        setHtmlContent(htmlStr);
      } catch (err) {
        alert('Excel dosyası okunamadı. Dosya bozuk veya desteklenmeyen formatta olabilir.');
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
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const targetElement = document.getElementById('excel-preview-container');

    doc.html(targetElement, {
      callback: function (doc) {
        let name = fileName.replace(/\.[^/.]+$/, "");
        doc.save(`${name}_Tablo.pdf`);
        setIsProcessing(false);
      },
      x: 20,
      y: 20,
      width: doc.internal.pageSize.getWidth() - 40,
      windowWidth: targetElement.scrollWidth > 1200 ? targetElement.scrollWidth : 1200, 
      autoPaging: 'text',
    }).catch(() => {
      alert("PDF oluşturulurken hata oluştu. Tablo çok büyük olabilir.");
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
              <div className="ev-icon ev-icon-success ev-icon-sm"><i className="fa-solid fa-file-excel"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Excel'den PDF'e Çevir</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>Excel hücrelerindeki tabloları PDF sayfalarına sığdırın.</p>
          </div>
        </div>
      </header>
      
      {/* Uyarı */}
      <div className="tool-alert-warn">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Önemli Bilgi:</strong> Bu araç hücre renkleri, grafikler veya formül makroları gibi karmaşık Excel bileşenlerini desteklemez. Sadece yazılı "Hücre Verilerini" bir tablo tasarımına dönüştürüp PDF'e basar. Ağa çıkış yapmadan cihazınızda çalışır.
        </div>
      </div>

      <div className="premium-card flex flex-col gap-6">
        
        {!fileName ? (
          <div 
            className="tool-drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="tool-drop-zone-icon" style={{background:'hsla(153, 70%, 38%, 0.12)', color:'var(--success)'}}>
              <i className="fa-regular fa-file-excel"></i>
            </div>
            <h3>.xlsx veya .csv Dosyanızı Seçin</h3>
            <p>Bir Excel listesini kolayca PDF A4 (Yatay) sayfalarına uyarlayın.<br/>
              <span style={{fontSize:'0.8rem', opacity:0.7}}>.xlsx, .xls, .csv formatları desteklenir</span>
            </p>
            <span className="ev-btn ev-btn-success" style={{marginTop:'0.5rem'}}>
              <i className="fa-solid fa-folder-open"></i> Dosya Tara
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
                <div className="ev-icon ev-icon-success">
                  <i className="fa-solid fa-file-invoice"></i>
                </div>
                <div>
                  <h4 style={{fontWeight:700, color:'var(--text-main)'}}>{fileName}</h4>
                  <span style={{fontSize:'0.75rem', color:'var(--success)', fontWeight:700}}>
                    <i className="fa-solid fa-check" style={{marginRight:'0.3rem'}}></i>Veriler Çıkartıldı
                  </span>
                </div>
              </div>
              <div style={{display:'flex', gap:'0.625rem'}}>
                <button onClick={() => { setFileName(''); setHtmlContent(''); }} className="ev-btn ev-btn-ghost">
                  <i className="fa-solid fa-xmark"></i> İptal Et
                </button>
                <button onClick={handleDownload} disabled={isProcessing} className="ev-btn ev-btn-success">
                  {isProcessing 
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Dönüştürülüyor</>
                    : <><i className="fa-solid fa-download"></i> PDF'i İndir</>
                  }
                </button>
              </div>
            </div>
            
            <div className="tool-doc-preview">
              <div className="tool-doc-preview-header">
                <i className="fa-solid fa-table" style={{marginRight:'0.4rem'}}></i>Tablo Önizlemesi
              </div>
              <div className="tool-doc-preview-body" style={{padding:'1rem'}}>
                <div id="excel-preview-container">
                  <style>{`
                    #excel-preview-container table { width:100%; border-collapse:collapse; font-size:0.8rem; }
                    #excel-preview-container td, #excel-preview-container th { 
                      border:1px solid #d1d5db; padding:0.375rem 0.625rem; 
                      text-align:left; white-space:nowrap;
                    }
                    #excel-preview-container th { 
                      background:#f3f4f6; font-weight:700; 
                    }
                    #excel-preview-container tr:nth-child(even) td { 
                      background:#f9fafb; 
                    }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{display:'none'}} 
        />
      </div>
    </div>
  );
};

export default ToolExcelToPdf;
