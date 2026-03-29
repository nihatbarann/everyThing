import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from "docx";

// Set worker src directly from remote unpkg to avoid local worker path issues for pdf.js
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
        
        // Loop through all pages to extract text
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          let pageText = "";
          // Each item represents a text string object in PDF
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
      // Split text by lines to create paragraphs in Word
      const textLines = extractedText.split('\n');
      const docChildren = textLines.map(line => {
        return new Paragraph({
          children: [
             new TextRun({
               text: line,
               size: 24 // 12pt
             })
          ],
          spacing: {
            after: 200 // Add a bit of spacing after each line
          }
        })
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
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

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-6xl mx-auto w-full text-[var(--text-main)]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/tools')} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm shrink-0" title="Geri Dön">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-file-export text-[var(--error)]"></i> 
              PDF'ten Word'e (Metin Çıkartma)
            </h1>
          </div>
        </div>
      </header>

      {/* Warning Alert */}
      <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 p-4 rounded-xl flex items-start gap-3">
        <i className="fa-solid fa-triangle-exclamation text-[var(--warning)] mt-1"></i>
        <div className="text-sm">
          <strong>Önemli Bilgi:</strong> PDF dosyaları içinde metinler "parçalanmış" kelime öbekleri halinde bulunur. Çıkartılan Word dosyasında (.docx) sadece ham düz metin bulunur, görsel veya tasarımsal ögeler kopyalanamaz. Taranmış fotokopi PDF'leri desteklemez.
        </div>
      </div>

      <div className="premium-card flex flex-col gap-6">
        
        {!fileName ? (
          <div 
            className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)] cursor-pointer hover:border-[var(--error)] transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 text-[var(--error)] flex items-center justify-center text-3xl mb-4 group-hover:-translate-y-2 transition-transform">
              <i className="fa-regular fa-file-pdf"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Ayıklanacak .PDF Dosyasını Seçin</h3>
            <p className="text-[var(--text-muted)] text-center max-w-md mb-4">Bir PDF'teki yazıları kopyalanabilir .docx belgesi haline getirin.</p>
            <span className="ev-btn ev-btn-primary" style={{backgroundColor: 'var(--error)'}}>PDF Yükle</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center p-4 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-file-lines text-2xl text-[var(--error)]"></i>
                <div className="max-w-[150px] sm:max-w-xs md:max-w-sm">
                  <h4 className="font-bold truncate" title={fileName}>{fileName}</h4>
                  <span className="text-xs text-[var(--success)] font-bold"><i className="fa-solid fa-check"></i> {extractedText.length} Karakter Bulundu</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setFileName(''); setExtractedText(''); }} className="ev-btn ev-btn-ghost">
                  İptal
                </button>
                <button onClick={handleDownload} disabled={isProcessing} className="ev-btn ev-btn-primary" style={{backgroundColor: 'var(--error)'}}>
                  {isProcessing ? <><i className="fa-solid fa-spinner fa-spin"></i> Dosya Hazırlanıyor</> : <><i className="fa-solid fa-download"></i> Word (Docx) İndir</>}
                </button>
              </div>
            </div>
            
            <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] w-full">
               <h3 className="text-[var(--primary)] font-bold mb-3 flex items-center gap-2"><i className="fa-solid fa-magnifying-glass"></i> Okunan Çıktı Önizlemesi</h3>
               <textarea
                 className="w-full h-64 p-4 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-color)] resize-none text-sm text-[var(--text-muted)]"
                 readOnly
                 value={extractedText}
                 placeholder="Bu belgede seçilebilen hiçbir dijital metin bulunamadı."
               />
            </div>
          </div>
        )}

        <input 
          type="file" 
          accept=".pdf" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default ToolPdfToWord;
