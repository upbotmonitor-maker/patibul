const express = require('express');
const { Resend } = require('resend');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bakım Modu Ayarı
const MAINTENANCE = true; 

app.use((req, res, next) => {
    // Bakım modundayken sadece destek talebi rotasına ve public dosyalara izin ver
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
        // 1. Kullanıcıya Gidecek Şık Onay Maili
        await resend.emails.send({
            from: 'PatiBul Destek <onboarding@resend.dev>',
            to: [mail],
            subject: 'Talebiniz Alındı ✅ - PatiBul',
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h1 style="color: #2563eb;">🐾 PatiBul</h1>
                    <p>Merhaba, talebiniz başarıyla bize ulaştı!</p>
                    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; text-align: center;">
                        <h2 style="color: #2563eb; margin: 0;">✅ Talebiniz Alındı</h2>
                    </div>
                    <p>Ekibimiz mesajınızı incelemeye başladı. En kısa sürede size bu e-posta adresi üzerinden dönüş yapacağız.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b;">PatiBul Destek Ekibi | Trabzon</p>
                </div>`
        });

        // 2. Sana Gidecek Şirket Görünümlü Bildirim
        await resend.emails.send({
            from: 'Sistem Bildirimi <onboarding@resend.dev>',
            to: ['patibultrabzon@gmail.com'], // KENDİ MAİLİNİ BURAYA YAZ
            subject: 'YENİ DESTEK TALEBİ: ' + konu,
            html: `
                <div style="font-family: sans-serif; max-width: 500px; border: 1px solid #334155; border-radius: 12px; overflow: hidden;">
                    <div style="background: #1e293b; color: white; padding: 15px;">
                        <h2 style="margin: 0;">Yeni Destek Talebi</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p><strong>Gönderen İsim:</strong> ${konu}</p>
                        <p><strong>E-posta:</strong> ${mail}</p>
                        <div style="border-left: 4px solid #2563eb; padding-left: 15px; background: #f8fafc; padding: 10px;">
                            <strong>Açıklama:</strong><br>${detay}
                        </div>
                    </div>
                    <div style="background: #f1f5f9; padding: 10px; font-size: 11px; text-align: center;">
                        PatiBul Yönetim Paneli - Bildirim Servisi
                    </div>
                </div>`
        });

        res.status(200).json({ basarili: true, mesaj: "Talebiniz iletildi!" });
    } catch (error) {
        console.error("Resend Hatası:", error);
        res.status(500).json({ hata: "Mail gönderilemedi." });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Sunucu ${PORT} portunda çalışıyor.`));
