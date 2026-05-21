const express = require('express');
const { Resend } = require('resend');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Render'a eklediğin RESEND_API_KEY değişkenini kullanır
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bakım Modu ve Statik Dosyalar
const MAINTENANCE = true;
app.use((req, res, next) => {
    if (MAINTENANCE && req.path !== '/destek-talebi' && !req.path.startsWith('/public')) {
        return res.sendFile(path.join(__dirname, 'public', 'maintenance.html'));
    }
    next();
});
app.use(express.static('public'));

// Destek Talebi Rotası
app.post('/destek-talebi', async (req, res) => {
    const { mail, konu, detay } = req.body;

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev', 
            to: ['patibultrabzon@gmail.com'], // Buraya kendi mailini yaz
            subject: 'YENİ DESTEK TALEBİ: ' + konu,
            html: `
                <h3>Yeni Talep Geldi</h3>
                <p><strong>Gönderen:</strong> ${konu}</p>
                <p><strong>E-posta:</strong> ${mail}</p>
                <p><strong>Detay:</strong> ${detay}</p>
            `
        });

        res.status(200).json({ basarili: true, mesaj: "Talebiniz iletildi!" });
    } catch (error) {
        console.error("Resend Hatası:", error);
        res.status(500).json({ hata: "Mail gönderilirken bir hata oluştu." });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
