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
  const previewRef = useRef(null);

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
        
        // Take first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to HTML table string
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
    
    // We will use jsPDF's .html() plugin which is included in modern versions
    const doc = new jsPDF({
      orientation: 'landscape',  // Excel usually needs landscape
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
    }).catch(err => {
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-file-excel text-[var(--success)]"></i> 
              Excel'den PDF'e Çevir
            </h1>
          </div>
        </div>
      </header>
      
      {/* Warning Alert */}
      <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 p-4 rounded-xl flex items-start gap-3">
        <i className="fa-solid fa-triangle-exclamation text-[var(--warning)] mt-1"></i>
        <div className="text-sm">
          <strong>Önemli Bilgi:</strong> Bu araç hücre renkleri, grafikler veya formül makroları gibi karmaşık Excel bileşenlerini desteklemez. Sadece yazılı "Hücre Verilerini" bir tablo tasarımına dönüştürüp PDF'e basar. Ağa çıkış yapmadan cihazınızda çalışır.
        </div>
      </div>

      <div className="premium-card flex flex-col gap-6">
        
        {!fileName ? (
          <div 
            className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)] cursor-pointer hover:border-[var(--success)] transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center text-3xl mb-4 group-hover:-translate-y-2 transition-transform">
              <i className="fa-regular fa-file-excel"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">.xlsx veya .csv Dosyanızı Seçin</h3>
            <p className="text-[var(--text-muted)] text-center max-w-md mb-4">Bir Excel listesini kolayca PDF A4 (Yatay) sayfalarına uyarlayın.</p>
            <span className="ev-btn ev-btn-primary" style={{backgroundColor: 'var(--success)'}}>Dosya Tara</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center p-4 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-file-invoice text-2xl text-[var(--primary)]"></i>
                <div>
                  <h4 className="font-bold">{fileName}</h4>
                  <span className="text-xs text-[var(--success)] font-bold"><i className="fa-solid fa-check"></i> Veriler Çıkartıldı</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFileName(''); setHtmlContent(''); }} className="ev-btn ev-btn-ghost">
                  İptal Et
                </button>
                <button onClick={handleDownload} disabled={isProcessing} className="ev-btn ev-btn-primary" style={{backgroundColor: 'var(--success)'}}>
                  {isProcessing ? <><i className="fa-solid fa-spinner fa-spin"></i> Dönüştürülüyor</> : <><i className="fa-solid fa-download"></i> PDF'i İndir</>}
                </button>
              </div>
            </div>
            
            <div className="bg-white text-black p-6 rounded-xl border border-gray-300 w-full overflow-auto max-h-[500px] shadow-inner" style={{ minHeight: '300px' }}>
               <h3 className="text-center font-bold text-gray-400 border-b pb-2 mb-4">Tablo Önizlemesi</h3>
               {/* Container for PDF Generation mapping */}
               <div id="excel-preview-container" className="text-sm">
                  {/* Basic styles so the generated HTML table from XLSX looks decent */}
                  <div 
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                    className="
                      [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-gray-300 
                      [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 
                      [&_th]:bg-gray-100 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:font-bold"
                  />
               </div>
            </div>
          </div>
        )}

        {/* Hidden Input */}
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default ToolExcelToPdf;
