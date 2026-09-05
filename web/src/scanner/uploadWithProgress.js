export function uploadFormData(url, formData, { onUploadProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

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
      } else {
        reject(new Error(body.error || "Tarama başarısız oldu."));
      }
    };

    xhr.onerror = () => reject(new Error("Sunucuya bağlanılamadı."));

    xhr.send(formData);
  });
}
