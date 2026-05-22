const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 BAKIM MODU AÇIK (true)
const MAINTENANCE = false;  // false yaparsan site normal açılır

app.use((req, res, next) => {
    if (MAINTENANCE) {
        // Destek talebi endpoint'ine izin ver
        if (req.path === '/destek-talebi') {
            return next();
        }
        // Diğer tüm sayfaları (ana sayfa ve .html uzantılılar) bakım sayfasına yönlendir
        if (req.path === '/' || req.path.endsWith('.html')) {
            return res.sendFile(path.join(__dirname, 'public', 'maintenance.html'));
        }
    }
    next();
});

app.use(express.static('public'));

// NODEMAILER - Gmail SMTP (port 587 + TLS, timeout değerleri arttırıldı)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    connectionTimeout: 20000,  // 20 saniye
    greetingTimeout: 20000,
    socketTimeout: 30000
});

// Bağlantıyı test et
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP bağlantı hatası (Gmail):', error);
    } else {
        console.log('✅ SMTP bağlantısı başarılı, mail gönderilebilir.');
    }
});

app.post('/destek-talebi', async (req, res) => {
    const { mail, konu, detay } = req.body;

    if (!mail || !konu || !detay) {
        return res.status(400).json({ hata: 'Eksik alanlar var (mail, konu, detay).' });
    }

    try {
        // 1. Kullanıcıya onay maili
        await transporter.sendMail({
            from: `"PatiBul Destek" <${process.env.GMAIL_USER}>`,
            to: mail,
            subject: 'Talebiniz Alındı ✅ - PatiBul',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb;">🐾 PatiBul</h2>
                    <p>Merhaba, talebiniz başarıyla bize ulaştı!</p>
                    <div style="background: #eff6ff; padding: 15px; border-radius: 8px;">
                        <strong>✅ Talebiniz inceleniyor.</strong>
                    </div>
                    <p>Ekibimiz mesajınızı incelemeye başladı. En kısa sürede size dönüş yapacağız.</p>
                </div>`
        });

        // 2. Size bildirim maili
        await transporter.sendMail({
            from: `"Sistem Bildirimi" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'YENİ DESTEK TALEBİ: ' + konu,
            html: `
                <div style="font-family: sans-serif; border: 1px solid #334155; padding: 20px;">
                    <h2 style="color: #1e293b;">Yeni Talep Geldi!</h2>
                    <p><b>Konu:</b> ${konu}</p>
                    <p><b>E-posta:</b> ${mail}</p>
                    <div style="background: #f8fafc; padding: 10px; border-left: 4px solid #2563eb;">
                        <b>Detay:</b><br>${detay.replace(/\n/g, '<br>')}
                    </div>
                </div>`
        });

        res.status(200).json({ basarili: true, mesaj: "Talebiniz iletildi!" });
    } catch (error) {
        console.error("Nodemailer Hatası:", error);
        res.status(500).json({ hata: "Mail gönderilemedi. Lütfen ayarları kontrol edin." });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Sunucu ${PORT} portunda çalışıyor.`));
