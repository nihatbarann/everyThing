<div align="center">

# 🌐 everyThing

**Küçük ve orta ölçekli ekipler için modern, tek çatı altında ofis yönetim paneli.**

[![PHP](https://img.shields.io/badge/PHP-8.0+-777BB4?logo=php&logoColor=white)](https://php.net)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?logo=mysql&logoColor=white)](https://mysql.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Ekran Görüntüleri](#-modüller)
- [Kurulum Gereksinimleri](#-kurulum-gereksinimleri)
- [Hızlı Kurulum](#-hızlı-kurulum)
- [Güvenlik Ayarları](#-güvenlik-ayarları)
- [Proje Yapısı](#-proje-yapısı)
- [Lisans](#-lisans)

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| 🔐 **JWT Kimlik Doğrulama** | Güvenli token tabanlı oturum yönetimi |
| 👥 **Kullanıcı Yönetimi** | Rol tabanlı izin sistemi (Admin / Employee) |
| 📣 **Duyurular** | İçerik editörü ile öncelikli duyuru yayınlama |
| 📝 **Not Defteri** | Zengin metin editörü (Quill) ile kişisel notlar |
| 🔗 **Link Yöneticisi** | Kişisel link ve şifre kasası (8'li grid) |
| ✅ **Yapılacaklar** | Kanban tarzı görev panosu (Yapılacak / Yapılıyor / Yapıldı) |
| 📅 **Takvim** | Etkinlik planlama ve günlük plan sistemi |
| 🛠️ **Araç Kutusu** | Resim/PDF/QR işlem araçları (offline, sunucu yok) |
| 📤 **Veri Yedekleme** | Kişisel verileri JSON olarak dışa/içe aktarma |
| ⚙️ **Kurulum Sihirbazı** | Kullanıcı dostu tek tıkla kurulum |

---

## 🧩 Modüller

### Yönetim Paneli (`/dashboard`)
Ana ekranda son duyurular ve interaktif takvim gösterilir.

### Kullanıcı Yönetimi (`/dashboard/users`) — Admin Only
- Kullanıcı oluşturma, düzenleme, pasifleştirme
- Hiyerarşik yönetici yapısı (Manager → Employee)
- Granüler izin sistemi (her kullanıcıya özel yetkiler)

### Duyurular (`/dashboard/announcements`)
- Öncelik seviyeleri: `Kritik / Yüksek / Orta / Düşük`
- Yayımlama/Gizleme kontrolü
- Görüntülenme sayacı

### Notlar (`/dashboard/notes`)
- Quill rich-text editör
- Kişisel not defteri (kullanıcıya özel)
- Otomatik kayıt

### Linkler (`/dashboard/links`)
- Her kart: İsim, URL, kullanıcı adı, şifre, notlar
- 8 sütunlu responsive grid
- Modal ile ekleme/düzenleme

### Yapılacaklar (`/dashboard/todos`)
- Kanban board (yatay satırlar, renkli)
- Arşivleme sistemi
- Öncelik ve tarih desteği

### Takvim (`/dashboard/calendar`)
- react-calendar entegrasyonu
- Renk kodlu etkinlikler
- Günlük plan görünümü

### 🛠️ Araç Kutusu (`/dashboard/tools`)
Tüm araçlar **sunucu gerektirmez**, tarayıcıda çalışır:

| Araç | Açıklama |
|---|---|
| **Resim Boyutlandır** | Piksel bazlı yeniden boyutlandırma (en-boy kilidi) |
| **Format Değiştir** | PNG ↔ JPG ↔ WEBP dönüşümü + kalite kontrolü |
| **Dosya Sıkıştır** | Kalite koruyarak boyut azaltma |
| **QR Kod Oluştur** | Özel renkli QR kod, PNG indirme |
| **QR Kod Oku** | Kamera veya dosyadan QR okuma |
| **Resim → PDF** | Çoklu resimden sayfalı PDF |
| **Word → PDF** | .docx içerik çıkartma ve PDF'e dönüştürme |
| **Excel → PDF** | .xlsx tablo verilerini PDF A4'e basma |
| **PDF → Word** | PDF metin ayıklama ve .docx çıktısı |

### Profil (`/dashboard/profile`)
- Kişisel ve iş bilgileri
- Şifre değiştirme
- **Veri Dışa Aktarma** (JSON)
- **Veri İçe Aktarma** (başka hesaba taşıma)

### Ayarlar (`/dashboard/settings`) — Admin Only
- Koyu/Açık tema
- Veritabanı bakımı, optimizasyon
- Yedekleme indirme

---

## 💻 Kurulum Gereksinimleri

| Yazılım | Minimum Sürüm | İndirme |
|---|---|---|
| **PHP** | 8.0+ | [php.net](https://php.net/downloads) |
| **MySQL / MariaDB** | 8.0+ / 10.6+ | [mysql.com](https://dev.mysql.com/downloads/) |
| **Apache** | 2.4+ (mod_rewrite açık) | [apache.org](https://httpd.apache.org) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **PHP Extensions** | PDO, PDO_MySQL, mbstring | — |

> **Not:** XAMPP veya Laragon kullanıyorsanız tüm gereksinimler zaten dahildir.

---

## 🚀 Hızlı Kurulum

### Adım 1 — Projeyi İndirin

```bash
git clone https://github.com/kullanici/everyThing.git
cd everyThing
```

### Adım 2 — Frontend Bağımlılıklarını Kurun

```bash
cd frontend
npm install
```

### Adım 3 — Backend URL'sini Ayarlayın

`frontend/vite.config.js` dosyasını açın ve projenizin çalışacağı URL'yi girin:

```js
// Eğer Apache'de /everyThing/ klasöründe çalışıyorsa:
target: 'http://localhost/everyThing/backend'

// Eğer doğrudan root'ta (localhost/) çalışıyorsa:
target: 'http://localhost/backend'
```

### Adım 4 — Apache'yi Yapılandırın

`backend/.htaccess` dosyası zaten mevcut. Apache'de `mod_rewrite` modülünün aktif olduğundan emin olun:

**Windows (XAMPP):** `httpd.conf` dosyasında `LoadModule rewrite_module` satırının başındaki `#` işaretini kaldırın.

**Linux/Apache:**
```bash
sudo a2enmod rewrite
sudo service apache2 restart
```

### Adım 5 — Kurulum Sihirbazını Çalıştırın

Frontend'i başlatın:
```bash
# frontend/ dizininde:
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine gidin. **Kurulum Sihirbazı** otomatik açılır.

1. Veritabanı bağlantı bilgilerini girin (host, port, db adı, kullanıcı, şifre)
2. **"Bağlantıyı Test Et"** butonuna tıklayın
3. **"Kurulumu Tamamla"** butonuna tıklayın

Kurulum sihirbazı şunları otomatik yapar:
- Veritabanını ve tüm tabloları oluşturur
- Varsayılan rolleri (`Admin`, `Employee`) ekler
- Menüleri ve izinleri yapılandırır
- `backend/config/database.php` dosyasını oluşturur

### Adım 6 — İlk Girişi Yapın

| Alan | Değer |
|---|---|
| Kullanıcı Adı | `everything` |
| Şifre | `admin` |

> ⚠️ **Güvenlik:** İlk girişten hemen sonra şifrenizi değiştirin!

### Adım 7 — Production Build (Opsiyonel)

Frontend'i Apache'nin doğrudan sunması için:
```bash
# frontend/ dizininde:
npm run build
```
`frontend/dist/` klasörü oluşur. Bu klasörü Apache root'unuza veya bir subdirectory'e kopyalayın.

---

## 🔐 Güvenlik Ayarları

### JWT Secret Key

Üretim ortamında Apache `httpd.conf` veya `.htaccess` dosyasına ekleyin:

```apache
SetEnv JWT_SECRET "buraya-en-az-64-karakter-uzunlugunda-guclu-bir-anahtar"
```

**veya** sistem ortam değişkenine ekleyin:
```bash
# Linux
export JWT_SECRET="buraya-guclu-anahtar"

# Windows (PowerShell)
[Environment]::SetEnvironmentVariable("JWT_SECRET", "buraya-guclu-anahtar", "Machine")
```

### CORS Kısıtlaması

Üretimde yalnızca frontend URL'nizi izin verin:

```apache
SetEnv CORS_ORIGIN "https://your-domain.com"
```

### install.lock

Kurulum tamamlandıktan sonra `backend/config/install.lock` dosyası otomatik oluşur ve kurulum endpointleri devre dışı kalır. Bu dosyayı silmeyin.

---

## 📁 Proje Yapısı

```
everyThing/
├── backend/
│   ├── Controllers/          # API kontrolcüleri
│   │   ├── AuthController.php
│   │   ├── UserController.php
│   │   ├── AnnouncementController.php
│   │   ├── NoteController.php
│   │   ├── LinkController.php
│   │   ├── TodoController.php
│   │   ├── CalendarController.php
│   │   ├── DataController.php    ← Dışa/İçe Aktarma
│   │   ├── SystemController.php
│   │   └── InstallController.php
│   ├── Core/
│   │   ├── Router.php
│   │   ├── Database.php
│   │   └── AuthMiddleware.php
│   ├── Routes/
│   │   └── api.php
│   ├── config/               # .gitignore'da (hassas)
│   │   ├── database.php      ← Kurulumda oluşturulur
│   │   └── install.lock      ← Kurulumda oluşturulur
│   ├── migrations/           # CLI migration dosyaları
│   └── .htaccess
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── tools/        # 9 araç sayfası
    │   │   └── ...
    │   ├── index.css         # Tasarım sistemi
    │   ├── App.jsx
    │   └── main.jsx
    ├── vite.config.js        ← Backend URL'si burada
    └── package.json
```

---

## 🛠️ Geliştirici Notları

### Yeni Migration Çalıştırma (CLI)

```bash
cd backend/migrations
php run_migration.php
```

### API Endpoint'leri

Tüm endpoint'ler `Bearer <JWT>` token gerektirir.

| Yöntem | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/auth/login` | Giriş yap |
| GET | `/api/auth/me` | Mevcut kullanıcı |
| GET | `/api/data/export` | Verileri dışa aktar |
| POST | `/api/data/import` | Verileri içe aktar |
| ... | `/api/users`, `/api/notes`, `/api/todos`, `/api/links`, `/api/calendar` | CRUD |

---

## 📄 Lisans

MIT License — Özgürce kullanabilir, dağıtabilir ve değiştirebilirsiniz.

---

<div align="center">
<sub>everyThing — Ekibiniz için her şey, tek bir yerden.</sub>
</div>
