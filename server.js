const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// E-posta bilgileri (.env üzerinden çekilir)
const GMAIL = process.env.GMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;

// JSON verilerini okuyabilmek için GEREKLİ (Burası olmadan form gitmez)
app.use(express.json());

// --- MAİL GÖNDERME AYARLARI ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL,
        pass: APP_PASSWORD
    }
});

// --- API ROTASI (BAKIM MODUNDAN ÖNCE OLMALIDIR) ---
app.post('/destek-talebi', async (req, res) => {
    const { isim, mail, detay } = req.body;
    
    if (!isim || !mail || !detay) {
        return res.status(400).json({ hata: "Eksik bilgi gönderildi." });
    }

    try {
        // 1. Sana gelecek bilgilendirme maili
        await transporter.sendMail({
            from: `"PatiBul Sistem" <${GMAIL}>`,
            to: GMAIL,
            subject: `Yeni Destek Talebi: ${isim}`,
            text: `Gönderen: ${isim}\nE-posta: ${mail}\n\nAçıklama:\n${detay}`
        });

        // 2. Kullanıcıya gidecek otomatik yanıt maili
        await transporter.sendMail({
            from: `"PatiBul Destek" <${GMAIL}>`,
            to: mail,
            subject: "Talebiniz Alındı | PatiBul",
            html: `<h3>Merhaba ${isim},</h3><p>Talebiniz ekibimize ulaştı. En kısa sürede inceleyip size dönüş yapacağız.</p>`
        });

        res.json({ basarili: true });
    } catch (error) {
        console.error("Mail Hatası:", error);
        res.status(500).json({ hata: "Mail sunucusunda sorun oluştu." });
    }
});

// --- BAKIM MODU ---
const MAINTENANCE = true;
app.use((req, res, next) => {
    // Bakım modu aktifse ve destek talebi dışında bir yere giriliyorsa maintenance.html göster
    if (MAINTENANCE && !req.path.startsWith('/api') && !req.path.startsWith('/admin')) {
        return res.sendFile(path.join(__dirname, 'public', 'maintenance.html'));
    }
    next();
});

// --- STATİK DOSYALAR (public klasörü) ---
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`PatiBul ${PORT} portunda çalışıyor.`);
});
