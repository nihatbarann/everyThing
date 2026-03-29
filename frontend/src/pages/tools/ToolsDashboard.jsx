import React from 'react';
import { useNavigate } from 'react-router-dom';

const ToolsDashboard = () => {
  const navigate = useNavigate();

  const tools = [
    {
      id: "resize",
      name: "Resim Boyutlandır",
      desc: "Resimlerin (Genişlik x Yükseklik) piksel ayarlarını değiştirin.",
      icon: "fa-crop-simple",
      path: "/dashboard/tools/resize",
      color: "var(--primary)"
    },
    {
      id: "format",
      name: "Format Değiştir",
      desc: "Resimleri farklı formatlara (PNG, JPG, WEBP) çevirin.",
      icon: "fa-file-image",
      path: "/dashboard/tools/format",
      color: "var(--success)"
    },
    {
      id: "compress",
      name: "Resim Sıkıştır",
      desc: "Büyük resim dosyalarını kaliteyi koruyarak küçültün.",
      icon: "fa-compress",
      path: "/dashboard/tools/compress",
      color: "var(--warning)"
    },
    {
      id: "qr-generate",
      name: "QR Kod Oluştur",
      desc: "Web siteniz, Wi-Fi veya herhangi bir metin için QR kodu yaratın.",
      icon: "fa-qrcode",
      path: "/dashboard/tools/qr-generate",
      color: "var(--info)"
    },
    {
      id: "qr-scan",
      name: "QR Kod Tara",
      desc: "Kameranızdan veya bir resim dosyasından QR kodu okutun.",
      icon: "fa-expand",
      path: "/dashboard/tools/qr-scan",
      color: "var(--error)"
    },
    {
      id: "images-to-pdf",
      name: "Resimlerden PDF",
      desc: "PNG/JPG resimlerini birleştirerek çok sayfalı PDF oluşturun.",
      icon: "fa-file-pdf",
      path: "/dashboard/tools/images-to-pdf",
      color: "var(--info)"
    },
    {
      id: "excel-to-pdf",
      name: "Excel'den PDF'e",
      desc: "Excel hücrelerindeki tabloları PDF sayfalarına sığdırın.",
      icon: "fa-file-excel",
      path: "/dashboard/tools/excel-to-pdf",
      color: "var(--success)"
    },
    {
      id: "word-to-pdf",
      name: "Word'den PDF'e",
      desc: "Düz metin (.docx) dosyalarını PDF formatına dönüştürüp indirin.",
      icon: "fa-file-word",
      path: "/dashboard/tools/word-to-pdf",
      color: "var(--primary)"
    },
    {
      id: "pdf-to-word",
      name: "PDF'ten Metne (Word)",
      desc: "Kilitli olmayan PDF sayfalarındaki metni Txt/Word (.docx) olarak çıkartın.",
      icon: "fa-file-export",
      path: "/dashboard/tools/pdf-to-word",
      color: "var(--warning)"
    }
  ];

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8 animate-in max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2" onClick={() => navigate('/dashboard/tools')} style={{cursor: 'pointer'}}>
            <div className="ev-icon ev-icon-purple"><i className="fa-solid fa-toolbox"></i></div>
            <h1 className="text-3xl font-bold text-gradient hover:opacity-80 transition-opacity">Gündelik Araçlar</h1>
          </div>
          <p className="text-muted text-lg">Ofis hayatında en çok ihtiyaç duyduğunuz dosyalarınızı düzenleme, dönüştürme işlemleri.</p>
        </div>
      </header>

      <div 
        className="w-full max-w-6xl w-full mb-10" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
          gap: '1.5rem' 
        }}
      >
        {tools.map(tool => (
          <div 
            key={tool.id}
            onClick={() => navigate(tool.path)}
            className="premium-card p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-transform flex flex-col items-center text-center gap-4 group"
          >
            <div style={{ backgroundColor: tool.color, color: '#fff', width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', fontSize: '1.25rem', opacity: 0.9 }} className="group-hover:opacity-100 transition-opacity">
              <i className={`fa-solid ${tool.icon}`}></i>
            </div>
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{tool.name}</h3>
            <p className="text-muted leading-relaxed" style={{ fontSize: '0.95rem' }}>
              {tool.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ToolsDashboard;
