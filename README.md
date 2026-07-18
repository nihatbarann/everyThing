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
- [Modüller](#-modüller)
- [Kurulum Gereksinimleri](#-kurulum-gereksinimleri)
- [Kurulum (macOS & Windows)](#-kurulum-macos--windows)
- [Her Yeniden Başlatmada](#-her-yeniden-başlatmada)
- [Güvenlik Ayarları](#-güvenlik-ayarları)
- [Proje Yapısı](#-proje-yapısı)
- [Sık Karşılaşılan Sorunlar](#-sık-karşılaşılan-sorunlar)
- [Lisans](#-lisans)

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| 🔐 **JWT Kimlik Doğrulama** | Güvenli token tabanlı oturum yönetimi, her kurulumda benzersiz otomatik anahtar |
| 👥 **Kullanıcı Yönetimi** | Rol tabanlı izin sistemi (Admin / Employee) |
| 📣 **Duyurular** | İçerik editörü ile öncelikli duyuru yayınlama |
| 📝 **Not Defteri** | Zengin metin editörü + aynı sayfada diyagram/şema desteği |
| 🔗 **Link Yöneticisi** | Kişisel link ve şifre kasası |
| ✅ **Yapılacaklar** | Kanban tarzı görev panosu (Yapılacak / Yapılıyor / Yapıldı) |
| 📅 **Takvim** | Etkinlik planlama ve günlük plan sistemi |
| 📜 **Sertifika/Domain Takibi** | Son kullanma tarihi uyarıları, canlı SSL kontrolü |
| 📡 **Cihaz İzleme** | Switch/AP/modem/kamera gibi ağ cihazlarının aktiflik durumu |
| 🧩 **Projeler & Ticketlar** | Ekip içi proje ve görev/ticket takibi |
| 📤 **Veri Yedekleme** | Kişisel verileri JSON olarak dışa/içe aktarma |
| ⚙️ **Kurulum Sihirbazı** | Veritabanı ve kendi yönetici hesabınızı sihirbaz üzerinden oluşturun — sabit/varsayılan hesap yoktur |

---

## 🧩 Modüller

### Yönetim Paneli (`/dashboard`)
Ana ekranda son duyurular, interaktif takvim ve yaklaşan sertifika/cihaz uyarıları gösterilir.

### Kullanıcı Yönetimi (`/dashboard/users`) — Admin Only
- Kullanıcı oluşturma, düzenleme, pasifleştirme
- Hiyerarşik yönetici yapısı (Manager → Employee)
- Granüler izin sistemi (her kullanıcıya özel yetkiler)

### Duyurular (`/dashboard/announcements`)
- Öncelik seviyeleri: `Kritik / Yüksek / Orta / Düşük`
- Yayımlama/Gizleme kontrolü, görüntülenme sayacı

### Notlar (`/dashboard/notes`)
- Quill rich-text editör + aynı not içinde diyagram/şema sekmesi
- Kişisel not defteri (kullanıcıya özel), otomatik kayıt

### Linkler (`/dashboard/links`)
- Her kart: İsim, URL, kullanıcı adı, şifre, notlar
- Kategori/favori filtreleme, modal ile ekleme/düzenleme

### Yapılacaklar (`/dashboard/todos`)
- Kanban board (Yapılacak / Yapılıyor / Yapıldı), sürükle-bırak
- Arşivleme sistemi, öncelik ve tarih desteği

### Takvim (`/dashboard/calendar`)
- react-calendar entegrasyonu, renk kodlu etkinlikler, günlük plan görünümü

### Sertifikalar & Domainler (`/dashboard/certificates`)
- Domain ve SSL sertifikası son kullanma tarihi takibi
- Yaklaşan son tarihler için Dashboard'da otomatik uyarı
- SSL kayıtları için canlı kontrol (openssl ile gerçek sertifika bitiş tarihini çeker)

### Cihaz İzleme (`/dashboard/monitors`)
- Switch, access point, modem, router, IP kamera, sunucu gibi ağ cihazlarının aktiflik durumu
- Lokasyona göre gruplanmış görünüm
- TCP port veya HTTP(S) tabanlı erişilebilirlik kontrolü, sayfa açıkken otomatik yenilenir
- Son 24 saatlik çalışma oranı (%) ve yanıt süresi
- Sürekli/arka planda izleme isteyen kurulumlar için `POST /api/monitors/check-all` uç noktasına bir sistem cron job'ı yönlendirilebilir

### Projeler & Ticketlar (`/dashboard/projects`, `/dashboard/tickets`)
- Proje bazlı not/link/görev alt sekmeleri, üye ataması
- Ekip içi ticket atama, yorum ve süre uzatma talebi akışı

### Profil (`/dashboard/profile`)
- Kişisel ve iş bilgileri, şifre değiştirme
- Veri dışa/içe aktarma (JSON)

### Ayarlar (`/dashboard/settings`) — Admin Only
- Koyu/Açık tema, veritabanı bakımı/optimizasyon, yedekleme indirme

---

## 💻 Kurulum Gereksinimleri

| Yazılım | Minimum Sürüm | macOS | Windows |
|---|---|---|---|
| **PHP** | 8.0+ | Homebrew | Chocolatey veya [windows.php.net](https://windows.php.net/download) |
| **MySQL / MariaDB** | 8.0+ / 10.6+ | Homebrew | Chocolatey veya [MySQL Installer](https://dev.mysql.com/downloads/installer/) |
| **Node.js** | 18+ | Homebrew | Chocolatey veya [nodejs.org](https://nodejs.org) |
| **PHP Extensions** | `pdo_mysql`, `mbstring` | Homebrew paketinde dahil | `php.ini`'de etkinleştirin (aşağıda) |
| **Git** | herhangi | Homebrew / Xcode CLT | [git-scm.com](https://git-scm.com/download/win) |

> **Not:** Bu proje Apache/`mod_rewrite` **gerektirmez** — backend, PHP'nin kendi dahili sunucusuyla (`php -S`) çalışır ve tüm istekleri `index.php` üzerinden kendi basit router'ıyla yönetir. Apache yalnızca kalıcı bir üretim (production) sunucusu kurmak isterseniz devreye girer (`backend/.htaccess` bunun için hazır bulunur).

---

## 🚀 Kurulum (macOS & Windows)

Aşağıdaki adımlar iki platformda da birebir aynıdır; yalnızca **Adım 1** (ön gereksinimlerin kurulumu) ve **MySQL'in arka planda nasıl çalıştığı** platforma göre değişir.

### Adım 1 — Ön Gereksinimleri Kurun

<details>
<summary><b>🍎 macOS</b></summary>

Homebrew kurulu değilse:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Kurulum sonunda ekrana yazdırılan `echo ... >> ~/.zprofile` ve `eval "$(...)"` komutlarını da çalıştırın (PATH'e eklemek için).

PHP, MySQL ve Node'u kurun:
```bash
brew install php mysql node
brew services start mysql
```
`brew services start`, MySQL'i **kalıcı bir arka plan servisi** olarak kaydeder — Mac'i yeniden başlatsanız bile otomatik ayağa kalkar.

</details>

<details>
<summary><b>🪟 Windows</b></summary>

**Chocolatey ile (önerilen):** PowerShell'i **Yönetici olarak** açın.

Chocolatey kurulu değilse ([resmi komut](https://chocolatey.org/install)):
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

PHP, MySQL, Node.js ve Git'i kurun:
```powershell
choco install php mysql nodejs-lts git -y
```

MySQL servisinin çalıştığını doğrulayın (Chocolatey bunu otomatik bir Windows servisi olarak kaydeder):
```powershell
net start MySQL
```

**PHP eklentilerini etkinleştirin:** Yüklü `php.ini` dosyasının yerini bulun:
```powershell
php --ini
```
Dosyayı bir metin editörüyle açıp şu satırların başındaki `;` işaretini kaldırın (yoksa ekleyin):
```ini
extension=pdo_mysql
extension=mbstring
```
Değişiklikten sonra açık bir PowerShell penceresi varsa yeniden açın (PATH/ini önbelleği için).

> **Chocolatey kullanmak istemiyorsanız:** PHP'yi [windows.php.net/download](https://windows.php.net/download) adresinden **Thread Safe (x64)** zip olarak indirip `C:\php`'ye çıkarın ve bu klasörü sistem PATH'ine ekleyin; MySQL'i [MySQL Installer](https://dev.mysql.com/downloads/installer/) ile, Node.js'i [nodejs.org](https://nodejs.org) LTS installer'ı ile kurun.

</details>

### Adım 2 — Veritabanı Kullanıcısı Oluşturun

Bir MySQL oturumu açın (Windows'ta PowerShell/CMD, macOS'ta Terminal — komut aynıdır):
```bash
mysql -u root -p
```
> Chocolatey/Homebrew ile yeni kurulan MySQL'de root için henüz şifre belirlemediyseniz `-p` olmadan `mysql -u root` deneyin.

MySQL konsolunda:
```sql
CREATE USER 'everything'@'localhost' IDENTIFIED BY 'guclu-bir-sifre';
GRANT ALL PRIVILEGES ON everything_db.* TO 'everything'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
> Veritabanı adını (`everything_db`) ve şifreyi dilediğiniz gibi değiştirebilirsiniz — Adım 6'da kurulum sihirbazına gireceğiniz bilgiler bunlarla eşleşmelidir.

### Adım 3 — Projeyi İndirin

```bash
git clone https://github.com/<kullanici-adiniz>/everyThing.git
cd everyThing
```

### Adım 4 — Frontend Bağımlılıklarını Kurun

```bash
cd frontend
npm install
```

### Adım 5 — Backend URL'sini Ayarlayın

`frontend/vite.config.js` içindeki proxy hedefinin PHP'nin dahili sunucusuna işaret ettiğinden emin olun (varsayılan olarak zaten böyledir):

```js
target: 'http://localhost:8000'
```

### Adım 6 — Backend'i Başlatın

```bash
cd backend
php -S localhost:8000 index.php
```
> Bu komut çalıştığı terminal penceresine bağlıdır — pencereyi kapatırsanız backend durur, tekrar çalıştırmanız gerekir.

### Adım 7 — Frontend'i Başlatın ve Kurulum Sihirbazını Tamamlayın

Yeni bir terminalde/PowerShell penceresinde:
```bash
cd frontend
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine gidin. **Kurulum Sihirbazı** otomatik açılır:

1. Veritabanı bağlantı bilgilerini girin (Adım 2'de oluşturduğunuz host/port/db adı/kullanıcı/şifre) ve **"Bağlantıyı Test Et"** ile doğrulayın.
2. **Kendi yönetici kullanıcı adınızı ve şifrenizi belirleyin** — sabit/varsayılan bir hesap oluşturulmaz, girdiğiniz bilgilerle ilk giriş bu olacaktır.
3. **"Kurulumu Tamamla"** butonuna tıklayın.

Kurulum sihirbazı şunları otomatik yapar:
- Veritabanını ve temel tabloları oluşturur
- Varsayılan rolleri (`Admin`, `Employee`) ve menüleri yapılandırır
- Belirttiğiniz kullanıcı adı/şifreyle **yönetici hesabınızı** oluşturur
- `backend/config/database.php` dosyasını oluşturur

### Adım 8 — Ek Modül Migration'larını Çalıştırın

Kurulum sihirbazı yalnızca temel tabloları (kullanıcılar, roller, menüler) oluşturur. Diğer tüm modüller için `backend/migrations/` klasöründeki script'leri sırayla çalıştırın:

```bash
cd backend/migrations
php run_migration.php
php migration_user_permissions.php
php migration_user_menu_order.php
php migration_activity_logs.php
php migration_announcements.php
php migration_calendar.php
php migration_calendar_event_time_done.php
php migration_links.php
php migration_links_category_favorite.php
php migration_notes.php
php migration_notes_diagram_type.php
php migration_todo_initial.php
php migration_todo_priority.php
php migration_todo_title_nullable.php
php migration_todo_archive.php
php migration_todo_menu_permission_fix.php
php migration_projects.php
php migration_tickets.php
php migration_ticket_comments.php
php migration_certificates.php
php migration_monitors.php
php migration_monitors_credentials.php
```

Her script idempotent'tir (tekrar çalıştırılması güvenlidir) — "already exists" gibi mesajlar hata değildir.

### Adım 9 — Production Build (Opsiyonel)

Frontend'i statik dosyalar olarak sunmak için:
```bash
cd frontend
npm run build
```
`frontend/dist/` klasörü oluşur; bunu bir web sunucusuna (Apache/Nginx) veya statik hosting'e yükleyebilirsiniz.

---

## 🔁 Her Yeniden Başlatmada

<details>
<summary><b>🍎 macOS</b></summary>

MySQL otomatik ayağa kalkar (`brew services` kalıcıdır), ancak backend ve frontend'i elle başlatmanız gerekir:
```bash
# Terminal 1
cd everyThing/backend && php -S localhost:8000 index.php

# Terminal 2
cd everyThing/frontend && npm run dev
```

</details>

<details>
<summary><b>🪟 Windows</b></summary>

Chocolatey ile kurulan MySQL bir Windows servisi olduğu için genelde bilgisayar açılışında otomatik başlar; değilse:
```powershell
net start MySQL
```

Backend ve frontend'i elle başlatın:
```powershell
# PowerShell penceresi 1
cd everyThing\backend
php -S localhost:8000 index.php

# PowerShell penceresi 2
cd everyThing\frontend
npm run dev
```

</details>

---

## 🔐 Güvenlik Ayarları

### JWT Secret Key

Kurulum sihirbazı gerektirmez — **ilk çalıştırmada** her kurulum için otomatik olarak rastgele, benzersiz bir imzalama anahtarı üretilir ve `backend/config/jwt_secret.php` içine kaydedilir (bu dosya `.gitignore`'dadır, asla commit edilmez). Farklı sunuculara yayılan veya yeniden başlatmalarda tutarlı bir anahtar isteyen üretim kurulumları için kendi anahtarınızı ortam değişkeni olarak tanımlayabilirsiniz — bu, otomatik üretilen dosyadan önceliklidir:

```apache
# Apache httpd.conf / .htaccess
SetEnv JWT_SECRET "buraya-en-az-32-karakter-uzunlugunda-guclu-bir-anahtar"
```

```bash
# macOS/Linux
export JWT_SECRET="buraya-guclu-anahtar"
```

```powershell
# Windows (PowerShell, kalıcı sistem değişkeni)
[Environment]::SetEnvironmentVariable("JWT_SECRET", "buraya-guclu-anahtar", "Machine")
```

### CORS Kısıtlaması

Üretimde yalnızca frontend URL'nizi izin verin:
```apache
SetEnv CORS_ORIGIN "https://your-domain.com"
```

### install.lock

Kurulum tamamlandıktan sonra `backend/config/install.lock` dosyası otomatik oluşur ve kurulum endpointleri devre dışı kalır. Bu dosyayı silmeyin — silinmesi, kurulum sihirbazının tekrar açılmasına ve teoride veritabanının üzerine yazılmasına izin verir.

### Varsayılan hesap yok

Bu projede sabit bir kullanıcı adı/şifre **kasıtlı olarak yoktur** — yönetici hesabınızı kurulum sihirbazının son adımında siz oluşturursunuz. `backend/config/database.php`, `backend/config/jwt_secret.php` ve `backend/config/install.lock` dosyaları `.gitignore` ile korunur; bunları asla elle commit etmeyin.

---

## 📁 Proje Yapısı

```
everyThing/
├── backend/
│   ├── Controllers/          # API kontrolcüleri (Auth, Users, Notes, Links, Todos,
│   │                         #   Projects, Tickets, Certificates, Monitors, ...)
│   ├── Core/
│   │   ├── Router.php
│   │   ├── Database.php
│   │   ├── AuthMiddleware.php
│   │   └── Secret.php        ← JWT anahtarını üretir/okur
│   ├── Routes/
│   │   └── api.php
│   ├── config/                       # .gitignore'da (hassas / kurulumda oluşur)
│   │   ├── database.php.example      ← Şablon, commit edilir
│   │   ├── database.php              ← Kurulumda oluşturulur
│   │   ├── jwt_secret.php            ← İlk çalıştırmada otomatik oluşturulur
│   │   └── install.lock              ← Kurulumda oluşturulur
│   ├── migrations/           # CLI migration dosyaları
│   └── .htaccess             # Yalnızca Apache ile üretim dağıtımı için
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── index.css         # Tasarım sistemi
    │   ├── App.jsx
    │   └── main.jsx
    ├── vite.config.js        ← Backend URL'si burada
    └── package.json
```

---

## 🧯 Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|---|---|
| `Access denied for user 'everything'@'localhost'` | Adım 2'deki `GRANT` komutunu, kurulum sihirbazına girdiğiniz veritabanı adıyla birebir eşleşecek şekilde tekrar çalıştırın. |
| Kurulum sihirbazı "Bağlantıyı Test Et" başarısız oluyor | MySQL servisinin çalıştığını doğrulayın: macOS'ta `brew services list`, Windows'ta `net start MySQL`. |
| `Class 'PDO' not found` veya `could not find driver` | `pdo_mysql` eklentisi etkin değil — Windows'ta `php --ini` ile bulduğunuz `php.ini`'de `extension=pdo_mysql` satırının başındaki `;`'yi kaldırın, PHP'yi (terminali) yeniden başlatın. |
| Frontend açılıyor ama API istekleri 404/başarısız | `frontend/vite.config.js`'deki proxy hedefinin `http://localhost:8000` olduğunu ve backend'in (Adım 6) hâlâ çalıştığını kontrol edin. |
| Yeni eklenen bir modül menüde görünmüyor | O modülün migration dosyasını (Adım 8'deki listeden) çalıştırıp çalıştırmadığınızı kontrol edin — menü kaydı migration ile eklenir. |
| Kurulumu baştan yapmak istiyorum | `backend/config/database.php` ve `backend/config/install.lock` dosyalarını silin, veritabanını düşürüp (`DROP DATABASE ...`) Adım 2'den devam edin. |

---

## 📄 Lisans

[MIT License](LICENSE) — Özgürce kullanabilir, dağıtabilir ve değiştirebilirsiniz.

---

<div align="center">
<sub>everyThing — Ekibiniz için her şey, tek bir yerden.</sub>
</div>
