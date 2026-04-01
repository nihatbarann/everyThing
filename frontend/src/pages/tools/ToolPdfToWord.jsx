import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from "docx";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ToolPdfToWord = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    setExtractedText('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const typedarray = new Uint8Array(event.target.result);
        const loadingTask = pdfjsLib.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        
        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          let pageText = "";
          for (const item of textContent.items) {
             pageText += item.str + " ";
          }
          fullText += `--- Sayfa ${i} ---\n` + pageText + "\n\n";
        }
        
        setExtractedText(fullText);
      } catch (err) {
        alert('PDF belgesinden metin ayıklanamadı. Belge sadece resim içeriyor veya şifreli olabilir.');
        setFileName('');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async () => {
    if (!extractedText) return;
    setIsProcessing(true);
    
    try {
      const textLines = extractedText.split('\n');
      const docChildren = textLines.map(line => {
        return new Paragraph({
          children: [
             new TextRun({
               text: line,
               size: 24
             })
          ],
          spacing: { after: 200 }
        })
      });

      const doc = new Document({
        sections: [{ properties: {}, children: docChildren }],
      });

      const blob = await Packer.toBlob(doc);
      
      const link = document.createElement('a');
      let name = fileName.replace(/\.[^/.]+$/, "");
      link.download = `${name}_metin.docx`;
      link.href = URL.createObjectURL(blob);
      link.click();

    } catch(err) {
      alert("Word .docx oluşturulurken hata oldu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const charCount = extractedText.length;

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-6xl mx-auto w-full text-[var(--text-main)]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="ev-icon ev-icon-warning ev-icon-sm"><i className="fa-solid fa-file-export"></i></div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">PDF'ten Word'e (Metin Çıkartma)</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm" style={{marginLeft:'2.5rem'}}>Kilitli olmayan PDF sayfalarındaki metni Txt/Word olarak çıkartın.</p>
          </div>
        </div>
      </header>

      {/* Uyarı */}
      <div className="tool-alert-warn">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Önemli Bilgi:</strong> PDF dosyaları içinde metinler "parçalanmış" kelime öbekleri halinde bulunur. Çıkartılan Word dosyasında (.docx) sadece ham düz metin bulunur, görsel veya tasarımsal ögeler kopyalanamaz. Taranmış fotokopi PDF'leri desteklemez.
        </div>
      </div>

      <div className="premium-card flex flex-col gap-6">
        
        {!fileName ? (
          <div 
            className="tool-drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="tool-drop-zone-icon" style={{background:'hsla(350, 78%, 52%, 0.12)', color:'var(--error)'}}>
              <i className="fa-regular fa-file-pdf"></i>
            </div>
            <h3>Ayıklanacak .PDF Dosyasını Seçin</h3>
            <p>Bir PDF'teki yazıları kopyalanabilir .docx belgesi haline getirin.<br/>
              <span style={{fontSize:'0.8rem', opacity:0.7}}>Yalnızca metin tabanlı PDF'ler desteklenir</span>
            </p>
            <span className="ev-btn" style={{backgroundColor:'var(--error)', color:'white', border:'none', marginTop:'0.5rem'}}>
              <i className="fa-solid fa-folder-open"></i> PDF Yükle
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
                <div className="ev-icon ev-icon-error">
                  <i className="fa-solid fa-file-lines"></i>
                </div>
                <div>
                  <h4 style={{
                    fontWeight:700, color:'var(--text-main)',
                    maxWidth:'240px', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap'
                  }} title={fileName}>{fileName}</h4>
                  {isProcessing ? (
                    <span style={{fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600}}>
                      <i className="fa-solid fa-spinner fa-spin" style={{marginRight:'0.3rem'}}></i>Metin okunuyor...
                    </span>
                  ) : (
                    <span style={{fontSize:'0.75rem', color:'var(--success)', fontWeight:700}}>
                      <i className="fa-solid fa-check" style={{marginRight:'0.3rem'}}></i>
                      {charCount.toLocaleString()} karakter bulundu
                    </span>
                  )}
                </div>
              </div>
              <div style={{display:'flex', gap:'0.625rem', flexShrink:0}}>
                <button onClick={() => { setFileName(''); setExtractedText(''); }} className="ev-btn ev-btn-ghost">
                  <i className="fa-solid fa-xmark"></i> İptal
                </button>
                <button 
                  onClick={handleDownload} 
                  disabled={isProcessing || !extractedText} 
                  className="ev-btn ev-btn-primary"
                  style={{backgroundColor:'var(--error)'}}
                >
                  {isProcessing 
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Hazırlanıyor</>
                    : <><i className="fa-solid fa-download"></i> Word (Docx) İndir</>
                  }
                </button>
              </div>
            </div>

            {isProcessing && !extractedText ? (
              <div className="tool-processing">
                <i className="fa-solid fa-spinner tool-processing-spinner" style={{color:'var(--error)'}}></i>
                <span className="tool-processing-text">PDF sayfaları okunuyor...</span>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'0.625rem'}}>
                <div style={{
                  display:'flex', alignItems:'center', gap:'0.5rem',
                  fontSize:'0.8rem', fontWeight:700, color:'var(--primary)'
                }}>
                  <i className="fa-solid fa-magnifying-glass"></i>
                  Okunan Çıktı Önizlemesi
                </div>
                <textarea
                  className="tool-text-preview"
                  style={{height:'15rem'}}
                  readOnly
                  value={extractedText}
                  placeholder="Bu belgede seçilebilen hiçbir dijital metin bulunamadı."
                />
              </div>
            )}
          </div>
        )}

        <input 
          type="file" 
          accept=".pdf" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{display:'none'}} 
        />
      </div>
    </div>
  );
};

export default ToolPdfToWord;
