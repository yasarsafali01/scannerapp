# Kurulum

## Gereksinimler

- Node.js 18+ (geliştirme Node.js 25 ile yapıldı)
- Mobil için: [Expo Go](https://expo.dev/go) uygulaması (telefonda) veya Android Studio / Xcode

## 1) Backend + Web (npm workspaces)

Proje kökünden:

```bash
npm install
```

Bu, hem `backend/` hem `web/` bağımlılıklarını kurar.

### Ortam değişkenleri

`backend/.env.example` dosyasını `backend/.env` olarak kopyalayın:

```bash
cp backend/.env.example backend/.env
```

| Değişken    | Açıklama                                              | Varsayılan |
| ----------- | ------------------------------------------------------ | ---------- |
| `PORT`      | Backend'in dinleyeceği port                            | `4000`     |
| `OCR_LANGS` | Tesseract OCR dil kodları (`+` ile birden fazla dil)   | `eng+tur`  |

### Çalıştırma

```bash
npm run dev:backend   # http://localhost:4000
npm run dev:web       # http://localhost:5173 (backend'e otomatik proxy yapar)
```

> **Not:** Backend ilk `/api/scan` isteğinde OCR dil dosyalarını (`eng.traineddata`, `tur.traineddata`) internetten indirir ve `backend/` klasörüne kaydeder (birkaç MB, tek seferlik). İnternet bağlantısı gerektirir.

## 2) Mobil (Expo)

Mobil uygulama ayrı bir npm projesidir (React Native/Expo'nun bağımlılık çözümlemesi npm workspaces ile iyi uyuşmadığı için kasıtlı olarak ayrılmıştır):

```bash
cd mobile
npm install
```

### Backend adresini ayarlama

Telefon (Expo Go) ile test ederken `localhost` **çalışmaz** — telefon backend'i bilgisayarınızın ağ adresinden bulmalıdır:

1. Bilgisayarınızın yerel IP adresini öğrenin:
   - Windows: `ipconfig` → "IPv4 Address"
2. `mobile/src/config.js` içindeki `API_BASE_URL` değerini bu IP ile güncelleyin:
   ```js
   export const API_BASE_URL = "http://192.168.X.X:4000";
   ```
3. Telefon ve bilgisayarın **aynı Wi-Fi ağında** olduğundan emin olun.
4. Backend'i `0.0.0.0` üzerinde dinleyecek şekilde başlatın (varsayılan Express davranışı zaten tüm arayüzlerde dinler), Windows Güvenlik Duvarı ilk bağlantıda izin isteyebilir — izin verin.

### Çalıştırma

```bash
npx expo start
```

Açılan QR kodu Expo Go ile okutun, ya da `a` (Android emulator) / `i` (iOS simulator, sadece macOS) tuşlarına basın.

## Platform-Spesifik Notlar

- **Windows:** `sharp` ve diğer native bağımlılıklar önceden derlenmiş binary indirir, ekstra kurulum gerekmez.
- **iOS simulator:** Sadece macOS'ta çalışır. Windows'tan iOS geliştirmesi için Expo Go + gerçek iPhone veya EAS Build kullanın.
- **Kamera izinleri:** Mobil uygulama ilk fotoğraf çekiminde kamera/galeri izni ister; reddedilirse tekrar denemek için telefon ayarlarından izin verilmesi gerekir.

## Sorun Giderme

- **"Sunucuya bağlanılamadı" (mobil):** `src/config.js`'teki IP adresini ve backend'in çalıştığını kontrol edin; Windows Güvenlik Duvarı'nın Node.js'e gelen bağlantılara izin verdiğinden emin olun.
- **OCR çok yavaş / hiç bitmiyor:** İlk çalıştırmada dil dosyaları indiriliyor olabilir; `backend/` klasöründe `eng.traineddata` ve `tur.traineddata` dosyalarının oluştuğunu kontrol edin.
- **Kenar algılama yanlış:** Otomatik kenar algılama yoktur (bkz. README) — köşe noktalarını elle sürükleyerek düzeltin.
