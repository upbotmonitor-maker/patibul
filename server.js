const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Çevresel değişkenler (Render üzerinden tanımlanmalı)
const GMAIL = process.env.GMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;

// Gelen JSON verilerini okuyabilmek için gerekli
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// E-posta gönderici ayarı
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { 
      user: GMAIL, 
      pass: APP_PASSWORD 
  }
});

// ========== BAKIM MODU AYARI ==========
const MAINTENANCE = true; // Kapatmak için false yapabilirsin

app.use((req, res, next) => {
  // Bakım modundayken sadece destek talebi rotasının ve public dosyalarının çalışmasına izin ver
  if (MAINTENANCE && !req.path.startsWith('/api') && req.path !== '/destek-talebi') {
    // Tüm sayfalara girenleri maintenance.html sayfasına yönlendirir
    return res.sendFile(path.join(__dirname, 'public', 'maintenance.html'));
  }
  next();
});

// Statik dosyaları (CSS, JS, resimler vb.) sunar
app.use(express.static('public'));

// ========== DESTEK/İTİRAZ TALEBİ ROTASI ==========
app.post('/destek-talebi', async (req, res) => {
  const { mail, konu, detay } = req.body;
  
  // Eksik bilgi kontrolü
  if (!mail || !konu || !detay) {
      return res.status(400).json({ hata: "Lütfen tüm alanları doldurun." });
  }

  try {
    // 1. İşlem: Kullanıcıya "Talebiniz bize ulaştı" maili at
    await transporter.sendMail({
      from: `"PatiBul Destek" <${GMAIL}>`,
      to: mail,
      subject: "PatiBul: Destek talebiniz alındı 🐾",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; color: #333;">
          <h2 style="color: #2563eb;">PatiBul Destek Ekibi</h2>
          <p>Merhaba,</p>
          <p>Talebiniz başarıyla sistemimize ulaştı. Ekibimiz en kısa sürede inceleyip size dönüş yapacaktır.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p><strong>İlettiğiniz Detay:</strong><br> ${detay}</p>
        </div>`
    });

    // 2. İşlem: Sana (Admin) "Yeni bir talep var" maili at
    await transporter.sendMail({
      from: `"PatiBul Sistem" <${GMAIL}>`,
      to: GMAIL,
      subject: "YENİ DESTEK TALEBİ: " + konu,
      text: `PatiBul sitesinden yeni bir destek/itiraz talebi geldi.\n\nGönderen İsim: ${konu}\nGönderen E-posta: ${mail}\n\nAçıklama:\n${detay}`
    });

    // Başarılı yanıtı gönder
    res.status(200).json({ basarili: true, mesaj: "Talebiniz başarıyla iletildi!" });
  } catch (error) {
    console.error("Mail gönderme hatası:", error);
    res.status(500).json({ hata: "Mail gönderilirken sunucu tarafında bir hata oluştu." });
  }
});

// Sunucuyu başlat
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PatiBul ${PORT} portunda çalışıyor.`);
});
