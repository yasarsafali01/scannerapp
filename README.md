# FreeScanner

Bir fotoğraf veya belge görüntüsünü yükleyip **taranmış belge** formatına (kenarları düzeltilmiş, siyah-beyaz/gri/renkli filtrelenmiş, PDF ve OCR metniyle) dönüştüren web ve mobil uygulama. CamScanner benzeri bir akış izler:

1. Ana sayfadan "Kamerayla Tara" veya "Galeriden Seç" ile bir görsel al
2. Belgenin dört köşesini sürükleyerek belge kenarlarına oturt (varsayılan olarak görselin ortasına yerleştirilmiş bir dörtgenle başlar)
3. Perspektif düzeltmesi ile belgeyi düzleştir
4. Siyah-beyaz / gri / renkli tarama filtresi uygula
5. İsteğe bağlı OCR ile metni çıkar
6. JPEG/PDF olarak paylaş veya indir; tarama otomatik olarak "Taramalarım" geçmişine kaydedilir

Uygulama alt navigasyonla iki sekmeye ayrılır: **Tara** (ana sayfa + hızlı tarama kısayolları) ve **Taramalarım** (geçmiş taramaların listesi — cihazda/tarayıcıda yerel olarak saklanır, backend'de veritabanı yoktur).

## Mimari

```
scanner/
├── backend/   Node.js + Express API — perspektif düzeltme, filtre, OCR, PDF üretimi
├── web/       React + Vite web arayüzü — bottom-nav (Tara/Taramalarım), sürüklenebilir köşe düzenleyici (SVG), geçmiş localStorage'da
└── mobile/    Expo (React Native) — React Navigation (bottom tabs + stack), sürüklenebilir köşe düzenleyici, geçmiş AsyncStorage + dosya sisteminde
```

**Veri akışı:**

- **Web/Mobil:** Kullanıcı bir görsel seçer/çeker → varsayılan (kenarlardan içe girintili) 4 köşe gösterilir → kullanıcı köşeleri belgenin gerçek kenarlarına sürükler → orijinal görsel + köşe koordinatları backend'e `multipart/form-data` ile gönderilir.
- **Backend:** Gelen görsel ham piksel verisine çevrilir (`sharp`) → köşe noktalarına göre saf JS ile perspektif (homografi) dönüşümü uygulanır → `sharp` ile tarama filtresi (siyah-beyaz/gri/renkli) uygulanır → istenirse `tesseract.js` ile OCR yapılır → `pdf-lib` ile PDF üretilir → sonuç (JPEG + PDF, base64 data URI olarak, ve OCR metni) JSON yanıt olarak döner.

> **Otomatik kenar algılama neden yok?** Denendi: hem Node.js'te hem headless tarayıcıda `opencv.js` (WASM) senkron çalışıp işlemi/sekmeyi kilitlediği için (10+ saniye donma) kaldırıldı. Bunun yerine backend'de bağımlılıksız, hızlı ve öngörülebilir saf JS perspektif dönüşümü + web/mobilde sürükle-bırak köşe düzenleyici kullanılıyor. Daha güvenilir bir native/otomatik algılama eklemek istenirse ayrı bir iyileştirme olarak ele alınabilir.

## Klasör Yapısı

- `backend/src/index.js` — Express sunucu girişi
- `backend/src/routes/scan.js` — `POST /api/scan` uç noktası
- `backend/src/scan/perspectiveWarp.js` — saf JS homografi/perspektif düzeltme
- `backend/src/scan/applyFilter.js` — `sharp` ile tarama filtreleri
- `backend/src/scan/ocr.js` — `tesseract.js` OCR
- `backend/src/scan/pdf.js` — `pdf-lib` ile PDF üretimi
- `web/src/App.jsx` — bottom-nav kabuğu (Tara / Taramalarım sekmeleri)
- `web/src/ScannerView.jsx` — tarama akışı (hızlı kısayollar, köşe düzenleyici, sonuç)
- `web/src/HistoryView.jsx` — geçmiş taramalar listesi + detay modalı
- `web/src/storage/history.js` — `localStorage` tabanlı geçmiş deposu
- `web/src/scanner/CornerEditor.jsx` — sürüklenebilir köşe düzenleyici (SVG)
- `web/src/scanner/ShareButtons.jsx` — Web Share API ile paylaş + indir linkleri
- `mobile/src/navigation/RootNavigator.js` — bottom tabs (Tara / Taramalarım) + iç içe stack navigasyon
- `mobile/src/screens/HomeScreen.js` — hızlı tarama kısayolları + son taramalar şeridi
- `mobile/src/screens/EditScreen.js` — köşe düzenleyici + mod/OCR seçimi + tarama isteği
- `mobile/src/screens/ResultScreen.js` — sonuç, paylaş, silme
- `mobile/src/screens/HistoryScreen.js` — geçmiş taramalar (ızgara görünüm)
- `mobile/src/storage/history.js` — `AsyncStorage` (indeks) + `expo-file-system` (JPEG/PDF dosyaları) tabanlı geçmiş deposu
- `mobile/src/scanner/CornerEditor.js` — sürüklenebilir köşe düzenleyici (React Native View'lar)

## Teknolojiler

- **Backend:** Node.js, Express, sharp, tesseract.js, pdf-lib, multer
- **Web:** React, Vite, Web Share API
- **Mobil:** Expo (React Native), React Navigation, AsyncStorage, expo-image-picker, expo-file-system, expo-sharing

## Hızlı Başlangıç

```bash
# 1) Bağımlılıkları kur (backend + web, npm workspaces ile)
npm install

# 2) Backend'i başlat (http://localhost:4000)
npm run dev:backend

# 3) Web arayüzünü başlat (http://localhost:5173)
npm run dev:web
```

Mobil uygulama ayrı bir npm projesi olduğu için kurulumu ve LAN IP ayarı [INSTALL.md](INSTALL.md) dosyasında anlatılıyor.

Kurulum/ortam detayları, .env örneği ve mobil çalıştırma adımları için bkz. **[INSTALL.md](INSTALL.md)**.
