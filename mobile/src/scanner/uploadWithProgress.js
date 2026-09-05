export function uploadFormData(url, formData, { onUploadProgress, timeoutMs = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = timeoutMs;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onUploadProgress) onUploadProgress(e.loaded / e.total);
    };

    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // yanit JSON degilse body bos kalir
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
        return;
      }
      if (body.error) {
        reject(new Error(body.error));
      } else if (xhr.status >= 500) {
        reject(new Error("Sunucuda bir hata oluştu. Lütfen tekrar deneyin."));
      } else if (xhr.status === 413) {
        reject(new Error("Fotoğraf(lar) çok büyük. Daha düşük çözünürlükle tekrar deneyin."));
      } else if (xhr.status === 404) {
        reject(new Error("Sunucu adresi bulunamadı. Ayarlardaki sunucu adresini kontrol edin."));
      } else {
        reject(new Error(`Tarama başarısız oldu (kod: ${xhr.status}).`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Sunucuya bağlanılamadı. Telefonunuz ve bilgisayarınız aynı Wi-Fi ağında mı, sunucu çalışıyor mu kontrol edin."));
    };
    xhr.ontimeout = () => {
      const seconds = Math.round(timeoutMs / 1000);
      reject(new Error(`Sunucu ${seconds} saniye içinde yanıt vermedi. Fotoğraf/sayfa sayısı fazlaysa tekrar deneyin.`));
    };
    xhr.onabort = () => reject(new Error("İşlem iptal edildi."));

    try {
      xhr.send(formData);
    } catch (err) {
      reject(new Error(`Fotoğraf gönderilemedi: ${err.message || err}`));
    }
  });
}
