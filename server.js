const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

const GMAIL = process.env.GMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;
const ADMIN_SIFRE = process.env.ADMIN_SIFRE || 'admin123';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL, pass: APP_PASSWORD }
});

app.use(express.json({ limit: '10mb' }));

// ========== BAKIM MODU ==========
const MAINTENANCE = true;

app.use((req, res, next) => {
  // Bakım modunda olsa bile api, admin ve destek rotaları çalışmaya devam eder
  if (MAINTENANCE && !req.path.startsWith('/api') && !req.path.startsWith('/admin') && 
      !req.path.startsWith('/destek-talebi') && req.path !== '/maintenance.html') {
    return res.sendFile(path.join(__dirname, 'public', 'maintenance.html'));
  }
  next();
});

app.use(express.static('public'));

// --- MAİL ŞABLONLARI ---
function generateDestekMaili(konu, detay) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 2px solid #3498db; border-radius: 20px; padding: 25px; background: #f4f9ff;">
      <div style="text-align: center;">
        <h1 style="color: #2c3e50;">PatiBul Destek</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Merhaba,</p>
      <p>Destek talebiniz ekibimize ulaştı. İnceleyip size en kısa sürede dönüş yapacağız. 🐾</p>
      <div style="background: white; padding: 15px; border-radius: 10px; border-left: 5px solid #3498db;">
        <p style="margin: 0; color: #555;"><strong>Konu:</strong> ${konu}</p>
        <p style="margin: 0; color: #555;"><strong>Detay:</strong> ${detay}</p>
      </div>
      <br>
      <p style="font-size: 14px;">Sabrınız için teşekkürler.<br><strong>PatiBul Destek Ekibi</strong></p>
      <hr>
      <p style="font-size: 12px; color: gray; text-align: center;">Bu bir otomatik bilgilendirme mailidir.</p>
    </div>
  `;
}

// --- DESTEK TALEBİ ROTASI ---
app.post('/destek-talebi', async (req, res) => {
  const { mail, konu, detay } = req.body;
  if (!mail || !konu || !detay) return res.status(400).json({ hata: "Tüm alanlar zorunlu." });

  try {
    await transporter.sendMail({
      from: `"PatiBul Destek" <${GMAIL}>`,
      to: mail,
      subject: "PatiBul: Destek talebiniz alındı 🐾",
      html: generateDestekMaili(konu, detay)
    });

    await transporter.sendMail({
      from: `"PatiBul Sistem" <${GMAIL}>`,
      to: GMAIL,
      subject: "Yeni Destek Talebi: " + konu,
      text: `Kullanıcı: ${mail}\nKonu: ${konu}\nDetay: ${detay}`
    });

    res.json({ basarili: true, mesaj: "Talebiniz alındı! Mailinizi kontrol edin." });
  } catch (e) {
    res.status(500).json({ hata: "Mail gönderilemedi." });
  }
});

// --- VERİ İŞLEMLERİ ---
const dataPath = path.join(__dirname, 'data.json');

function readData() {
  if (!fs.existsSync(dataPath)) return { ilanlar: [], toplamBulunan: 0, sonId: 0 };
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// --- DİĞER ROTALAR ---
app.get('/ilanlar', (req, res) => {
  const data = readData();
  const aktifIlanlar = data.ilanlar.filter(i => !i.silindi && !i.arsiv && !i.bulundu);
  res.json({ ilanlar: aktifIlanlar });
});

app.post('/ilan-ekle', (req, res) => {
    // ... mevcut ilan ekleme kodun ...
    res.status(201).json({ basarili: true });
});

app.post('/sikayet', async (req, res) => {
    // ... mevcut şikayet kodun ...
    res.json({ basarili: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐱 PatiBul Trabzon ${PORT} portunda çalışıyor.`);
});
      
