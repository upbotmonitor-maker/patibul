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
// Siteyi kapatmak için: MAINTENANCE = true
// Siteyi açmak için: MAINTENANCE = false
const MAINTENANCE = true;

app.use((req, res, next) => {
  if (MAINTENANCE && !req.path.startsWith('/api') && !req.path.startsWith('/admin') && req.path !== '/maintenance.html') {
    return res.sendFile(path.join(__dirname, 'public', 'maintenance.html'));
  }
  next();
});

app.use(express.static('public'));

const dataPath = path.join(__dirname, 'data.json');

function readData() {
  try {
    if (!fs.existsSync(dataPath)) {
      const initial = { ilanlar: [], toplamBulunan: 0, sonId: 0 };
      fs.writeFileSync(dataPath, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const fixed = {
        ilanlar: parsed,
        toplamBulunan: 0,
        sonId: parsed.length > 0 ? Math.max(...parsed.map(i => i.id || 0)) : 0
      };
      fs.writeFileSync(dataPath, JSON.stringify(fixed, null, 2));
      return fixed;
    }
    if (!parsed.ilanlar) parsed.ilanlar = [];
    if (parsed.toplamBulunan === undefined) parsed.toplamBulunan = 0;
    if (parsed.sonId === undefined) parsed.sonId = 0;
    return parsed;
  } catch (e) {
    console.error('data.json hatası:', e.message);
    const fresh = { ilanlar: [], toplamBulunan: 0, sonId: 0 };
    fs.writeFileSync(dataPath, JSON.stringify(fresh, null, 2));
    return fresh;
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('data.json yazma hatası:', e);
  }
}

// Örnek ilanları kontrol et (varsa dokunma)
function ensureSampleAds() {
  const data = readData();

  // Eğer ilanlar boşsa VEYA Zeytin/Loki eksikse örnekleri oluştur
  const lokiVar = data.ilanlar.some(i => i.id === 4);
  const zeytinVar = data.ilanlar.some(i => i.id === 5);

  if (data.ilanlar.length === 0 || !lokiVar || !zeytinVar) {
    console.log('📦 GÜNCEL TARİHLİ örnek ilanlar oluşturuluyor...');

    const simdi = Date.now(); // 🔥 İŞTE SİHİR BURADA! Her seferinde ŞU ANIN zamanını alıyor.
    const birGun = 24 * 60 * 60 * 1000;
    const birSaat = 60 * 60 * 1000;

    const ornekIlanlar = [
      {
        id: 1,
        fotolar: ['https://i.imgur.com/V077wnS.jpeg'],
        kediAdi: 'Duman',
        mahalle: 'Kalkınma',
        aciklama: 'Gri-beyaz tekir, kırmızı tasması var.',
        mail: 'nan619381@gmail.com',
        ilce: 'Ortahisar',
        acil: false,
        tarih: simdi - (2 * birGun),
        bulundu: false, bulunduTarih: null, bulunduHikaye: '',
        silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
        sikayetSayisi: 0
      },
      {
        id: 2,
        fotolar: ['https://i.imgur.com/fUCdV7g.jpeg'],
        kediAdi: 'Paşa',
        mahalle: 'Pelitli',
        aciklama: 'Sarı-beyaz, çok sevecen.',
        mail: 'm76887136@gmail.com',
        ilce: 'Ortahisar',
        acil: true,
        tarih: simdi - (1 * birGun),
        bulundu: false, bulunduTarih: null, bulunduHikaye: '',
        silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
        sikayetSayisi: 0
      },
      {
        id: 3,
        fotolar: ['https://i.imgur.com/YiTdBMP.jpeg'],
        kediAdi: 'Minnoş',
        mahalle: 'Söğütlü',
        aciklama: 'Siyah-beyaz, mavi gözlü.',
        mail: 'lol886275@gmail.com',
        ilce: 'Ortahisar',
        acil: false,
        tarih: simdi - (3 * birGun),
        bulundu: false, bulunduTarih: null, bulunduHikaye: '',
        silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
        sikayetSayisi: 0
      },
      {
        id: 4,
        fotolar: ['https://i.imgur.com/S5opurd.jpeg'],
        kediAdi: 'Loki',
        mahalle: 'Çukurçayır',
        aciklama: 'LÜTFEN YARDIM EDİN - BULANA TEŞEKKÜR HEDİYESİ VAR. Süper Acil işaretli gerçek kayıp ilanıdır.',
        mail: 'b48492401@gmail.com',
        ilce: 'Ortahisar',
        acil: true,
        tarih: simdi - (16 * birSaat),
        bulundu: true, // Loki bulundu
        bulunduTarih: simdi - (2 * birSaat), // 2 saat önce bulundu
        bulunduHikaye: 'Loki, 19 Nisan 2026\'da Çukurçayır\'da bulunarak sahibine kavuştu! Belinay\'ın kucağında uyuyor.',
        silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
        sikayetSayisi: 0
      },
      {
        id: 5,
        fotolar: [
          'https://i.imgur.com/KXrj3w8.jpeg',
          'https://i.imgur.com/hnARa9Q.jpeg',
          'https://i.imgur.com/NtsFF15.jpeg'
        ],
        kediAdi: 'Zeytin',
        mahalle: 'Of',
        aciklama: '👑 İSİM: Zeytin\n🚻 CİNSİYET: Erkek ♂️\n📅 YAŞ: Yavru, tahminen 2-3 aylık\n✂️ KISIRLAŞTIRILMIŞ: Hayır\n🎨 TÜY RENGİ: Gri-Kahve Tekir, alnında M harfi var\n👀 GÖZ RENGİ: Yeşil\n🧶 TÜY: Kısa tüylü, minyon yapılı\n📍 KAYBOLDUĞU TARİH: 19 Nisan 2026 - BUGÜN\n📍 KAYBOLDUĞU YER: Of / Trabzon\n⚠️ NOT: Sadece ilçe yazıldı. Güvenlik için tam adres verilmedi.\n😿 KARAKTERİ: Ürkek ama oyuncu, ismine tepki verir.\n📿 TASMA: Yok\n🙏 ÖNEMLİ NOT: Zeytin daha çok küçük ve ev kedisi. Dışarıda tek başına yapamaz. Gören, koruyan, evine alan Allah rızası için bize ulaşsın.\n⛔ LÜTFEN TELEFON YAZMAYIN ⛔\n✅ SADECE PATİBUL SİTE MESAJ KUTUSU ÜZERİNDEN İLETİŞİM ✅',
        mail: 'yes442562@gmail.com',
        ilce: 'Of',
        acil: true,
        tarih: simdi, // tam şu an kayboldu (bugün)
        bulundu: false, bulunduTarih: null, bulunduHikaye: '',
        silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
        sikayetSayisi: 0
      }
    ];

    data.ilanlar = ornekIlanlar;
    data.sonId = 5;
    data.toplamBulunan = 1; // Loki bulundu
    writeData(data);
    console.log('✅ Güncel tarihli ilanlar başarıyla oluşturuldu.');
  }
}
ensureSampleAds();

const KUFURLER = ["aq", "amk", "sg", "oç", "s*ktir", "p*ç", "m*k"];
function containsKufur(text) {
  if (!text) return false;
  return KUFURLER.some(k => text.toLowerCase().includes(k));
}

async function check30DaysAndMail(data) {
  const now = Date.now();
  const threshold = 30 * 24 * 60 * 60 * 1000;
  let changed = false;
  for (let ilan of data.ilanlar) {
    if (!ilan.silindi && !ilan.bulundu && !ilan.uyariMailGonderildi && (now - ilan.tarih) > threshold) {
      ilan.eski = true;
      ilan.uyariMailGonderildi = true;
      changed = true;
      try {
        await transporter.sendMail({
          from: `"PatiBul Trabzon" <${GMAIL}>`,
          to: ilan.mail,
          subject: `PatiBul: ${ilan.kediAdi} 30 gündür kayıp`,
          text: `Merhaba,\n\n"${ilan.kediAdi}" adlı ilanınız 30 gündür yayında. Durum güncel mi?`
        });
      } catch (err) {}
    }
  }
  if (changed) writeData(data);
}

function generateComplaintEmail(ilan, count) {
  const seviye = count === 1 ? '⚠️ Uyarı' : count === 2 ? '⚠️⚠️ İkinci Uyarı' : '🚨 SON UYARI';
  const renk = count === 1 ? '#f39c12' : count === 2 ? '#e67e22' : '#e74c3c';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 2px solid ${renk}; border-radius: 20px; padding: 20px; background: #fff9f0;">
      <div style="text-align: center;">
        <span style="font-size: 48px;">🐱👮‍♀️</span>
        <h1 style="color: ${renk};">${seviye}</h1>
      </div>
      <p style="font-size: 16px;">Merhaba,</p>
      <p><strong>"${ilan.kediAdi}"</strong> adlı kayıp ilanınız <strong>${count}. kez</strong> şikayet aldı.</p>
      ${count >= 3 ? '<p style="color: red; font-weight: bold;">İlanınız 3 şikayet nedeniyle yayından kaldırılmıştır.</p>' : ''}
      <div style="background: #fdebd0; padding: 15px; border-radius: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>İlan Detayları:</strong><br>
        📍 ${ilan.ilce} - ${ilan.mahalle}<br>
        📅 Kayıp Tarihi: ${new Date(ilan.tarih).toLocaleDateString('tr-TR')}</p>
      </div>
      ${count < 3 ? `
        <p>Lütfen ilanınızın doğruluğunu kontrol edin. 3 şikayette ilan otomatik kaldırılır.</p>
        <a href="https://patibul.onrender.com/ilan/${ilan.id}" style="display: inline-block; background: #e67e22; color: white; padding: 10px 20px; border-radius: 30px; text-decoration: none;">İlanı Görüntüle</a>
      ` : ''}
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: gray;">Bu mail PatiBul Trabzon otomatik sistemi tarafından gönderilmiştir.</p>
    </div>
  `;
}

function generateAdminEmail(ilan, mesaj) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 2px solid #e67e22; border-radius: 20px; padding: 20px; background: #fff9f0;">
      <div style="text-align: center;">
        <span style="font-size: 48px;">🐱📧</span>
        <h1 style="color: #e67e22;">PatiBul Trabzon</h1>
      </div>
      <p style="font-size: 16px;">Merhaba,</p>
      <p><strong>"${ilan.kediAdi}"</strong> adlı kayıp ilanınız hakkında sizinle iletişime geçmek istiyoruz.</p>
      <div style="background: #fdebd0; padding: 15px; border-radius: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Mesaj:</strong><br>${mesaj}</p>
      </div>
      <p>İlanınızı görüntülemek için aşağıdaki butona tıklayabilirsiniz:</p>
      <a href="https://patibul.onrender.com/ilan/${ilan.id}" style="display: inline-block; background: #e67e22; color: white; padding: 10px 20px; border-radius: 30px; text-decoration: none;">İlanı Görüntüle</a>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: gray;">Bu mail PatiBul Trabzon ekibi tarafından gönderilmiştir.</p>
    </div>
  `;
}

app.get('/ilanlar', async (req, res) => {
  const data = readData();
  await check30DaysAndMail(data);
  const now = Date.now();
  const archiveThreshold = 7 * 24 * 60 * 60 * 1000;
  data.ilanlar.forEach(i => {
    if (i.bulundu && !i.arsiv && i.bulunduTarih && (now - i.bulunduTarih) > archiveThreshold) i.arsiv = true;
  });
  writeData(data);

  const aktifIlanlar = data.ilanlar
    .filter(i => !i.silindi && !i.arsiv && !i.bulundu)
    .sort((a, b) => {
      if (a.acil && !b.acil) return -1;
      if (!a.acil && b.acil) return 1;
      return b.tarih - a.tarih;
    });

  const ilceSayac = {};
  aktifIlanlar.forEach(i => { ilceSayac[i.ilce] = (ilceSayac[i.ilce] || 0) + 1; });

  const sonBulunanlar = data.ilanlar.filter(i => i.bulundu && !i.arsiv && !i.silindi).sort((a,b) => b.bulunduTarih - a.bulunduTarih).slice(0,3);
  const mutluSonlar = data.ilanlar.filter(i => i.bulundu && !i.arsiv && !i.silindi && i.bulunduHikaye).slice(-3);

  res.json({ ilanlar: aktifIlanlar, ilceSayac, sonBulunanlar, mutluSonlar });
});

app.get('/istatistik', (req, res) => {
  const data = readData();
  const birHafta = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const yeniKayip = data.ilanlar.filter(i => !i.silindi && i.tarih > birHafta).length;
  res.json({ yeniKayip, toplamBulunan: data.toplamBulunan });
});

app.get('/captcha', (req, res) => {
  const SORULAR = [
    { soru: "Trabzon'un plakası kaçtır?", cevap: "61", tip: "text" },
    { soru: "Uzungöl hangi ilçededir?", secenek: ["Maçka", "Çaykara", "Sürmene", "Of"], cevap: "Çaykara", tip: "radio" },
    { soru: "Aşağıdakilerden hangisi Hamsiköy'e aittir?", secenek: ["Sütlaç", "Köfte", "Pizza"], cevap: "Sütlaç", tip: "radio" },
    { soru: "Vakfıkebir neyi ile meşhurdur?", secenek: ["Ekmek", "Börek", "Lahmacun"], cevap: "Ekmek", tip: "radio" },
    { soru: "61 + 0 kaç eder?", cevap: "61", tip: "text" }
  ];
  res.json(SORULAR[Math.floor(Math.random() * SORULAR.length)]);
});

app.post('/ilan-ekle', async (req, res) => {
  const data = readData();
  let { fotolar, kediAdi, mahalle, aciklama, mail, ilce, acil, captchaCevap, dogruCevap, onayli } = req.body;
  if (!Array.isArray(fotolar)) fotolar = fotolar ? [fotolar] : [];
  if (fotolar.length === 0 || !kediAdi || !mahalle || !mail || !ilce) {
    return res.status(400).json({ hata: "En az 1 fotoğraf ve tüm alanlar zorunludur." });
  }
  if (fotolar.length > 3) return res.status(400).json({ hata: "En fazla 3 fotoğraf yükleyebilirsiniz." });
  for (let foto of fotolar) {
    if (!foto.startsWith('data:image/jpeg') && !foto.startsWith('data:image/png')) {
      return res.status(400).json({ hata: "Sadece JPG/PNG yükleyin." });
    }
  }
  if (!captchaCevap || !dogruCevap || captchaCevap.trim() !== dogruCevap.trim()) {
    return res.status(400).json({ hata: "Bot kontrolü başarısız." });
  }
  if (containsKufur(kediAdi) || containsKufur(aciklama)) {
    return res.status(400).json({ hata: "Uygunsuz kelime." });
  }
  const izinliIlceler = ["Ortahisar","Akçaabat","Araklı","Arsin","Beşikdüzü","Çarşıbaşı","Çaykara","Dernekpazarı","Düzköy","Hayrat","Köprübaşı","Maçka","Of","Şalpazarı","Sürmene","Tonya","Vakfıkebir","Yomra"];
  if (!izinliIlceler.includes(ilce)) return res.status(400).json({ hata: "Geçersiz ilçe." });
  const benzer = data.ilanlar.find(i => !i.silindi && !i.bulundu && i.ilce === ilce && i.kediAdi.toLowerCase() === kediAdi.toLowerCase());
  if (benzer && !onayli) {
    return res.json({ uyari: `Dikkat: ${ilce} ilçesinde "${kediAdi}" adlı aktif ilan var. Yine de ekle?`, onayla: true });
  }
  data.sonId += 1;
  const yeniIlan = {
    id: data.sonId,
    fotolar,
    kediAdi: kediAdi.trim(),
    mahalle: mahalle.trim(),
    aciklama: aciklama ? aciklama.trim() : '',
    mail: mail.trim(),
    ilce,
    acil: acil === true || acil === 'true' || acil === 'on',
    tarih: Date.now(),
    bulundu: false, bulunduTarih: null, bulunduHikaye: '',
    silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
    sikayetSayisi: 0
  };
  data.ilanlar.push(yeniIlan);
  writeData(data);
  res.status(201).json({ basarili: true, id: data.sonId });
});

app.post('/bulundu', (req, res) => {
  const { id, sifre } = req.body;
  if (sifre !== ADMIN_SIFRE) return res.status(403).json({ hata: true, mesaj: "Şifre yanlış." });
  const data = readData();
  const ilan = data.ilanlar.find(i => i.id == id);
  if (!ilan) return res.status(404).json({ hata: true });
  if (ilan.bulundu) return res.status(400).json({ hata: true, mesaj: "Zaten bulunmuş." });
  res.json({ hata: false, hikayeSor: true });
});

app.post('/hikaye-ekle', async (req, res) => {
  const { id, sifre, hikaye } = req.body;
  if (sifre !== ADMIN_SIFRE) return res.status(403).json({ hata: "Yetkisiz." });
  const data = readData();
  const ilan = data.ilanlar.find(i => i.id == id);
  if (!ilan) return res.status(404).json({ hata: "İlan bulunamadı." });
  ilan.bulundu = true;
  ilan.bulunduTarih = Date.now();
  ilan.bulunduHikaye = hikaye ? hikaye.trim() : '';
  data.toplamBulunan += 1;
  writeData(data);
  res.json({ basarili: true });
});

app.post('/sikayet', async (req, res) => {
  const { id } = req.body;
  const data = readData();
  const ilan = data.ilanlar.find(i => i.id == id);
  if (!ilan) return res.status(404).json({ hata: "İlan bulunamadı." });
  ilan.sikayetSayisi = (ilan.sikayetSayisi || 0) + 1;
  const count = ilan.sikayetSayisi;
  try {
    await transporter.sendMail({
      from: `"PatiBul Trabzon" <${GMAIL}>`,
      to: ilan.mail,
      subject: `🐾 PatiBul: ${ilan.kediAdi} hakkında şikayet bildirimi (${count}/3)`,
      html: generateComplaintEmail(ilan, count)
    });
  } catch (e) {}
  if (count >= 3) {
    ilan.silindi = true;
    try {
      await transporter.sendMail({
        to: GMAIL,
        subject: `PatiBul: İlan Silindi (3 Şikayet) - ID ${ilan.id}`,
        text: `${ilan.kediAdi} silindi. Mail: ${ilan.mail}`
      });
    } catch (e) {}
  }
  writeData(data);
  res.json({ basarili: true, sayi: count });
});

app.get('/ilan/:id', (req, res) => {
  const data = readData();
  const ilan = data.ilanlar.find(i => i.id == req.params.id && !i.silindi);
  if (!ilan) return res.status(404).send('İlan bulunamadı.');
  res.json(ilan);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/admin', (req, res) => {
  if (req.body.sifre !== ADMIN_SIFRE) return res.status(401).json({ hata: true });
  res.json({ ilanlar: readData().ilanlar });
});

app.post('/admin/sil', (req, res) => {
  const { id, sifre } = req.body;
  if (sifre !== ADMIN_SIFRE) return res.status(401).json({ hata: true });
  const data = readData();
  const ilan = data.ilanlar.find(i => i.id == id);
  if (!ilan) return res.status(404).json({ hata: "İlan bulunamadı." });
  ilan.silindi = true;
  writeData(data);
  res.json({ basarili: true });
});

app.post('/geri-al', (req, res) => {
  const { id, sifre } = req.body;
  if (sifre !== ADMIN_SIFRE) return res.status(401).json({ hata: true });
  const data = readData();
  const ilan = data.ilanlar.find(i => i.id == id);
  if (!ilan) return res.status(404).json({ hata: "İlan bulunamadı." });
  ilan.silindi = false;
  ilan.sikayetSayisi = 0;
  writeData(data);
  res.json({ basarili: true });
});

app.post('/admin/ornek-ilanlari-yukle', (req, res) => {
  if (req.body.sifre !== ADMIN_SIFRE) return res.status(401).json({ hata: "Yetkisiz" });
  const data = readData();
  data.ilanlar = data.ilanlar.filter(i => !i.silindi);
  ensureSampleAds();
  res.json({ basarili: true });
});

app.post('/admin/mail-gonder', async (req, res) => {
  const { id, sifre, mesaj } = req.body;
  if (sifre !== ADMIN_SIFRE) return res.status(401).json({ hata: "Yetkisiz" });
  const data = readData();
  const ilan = data.ilanlar.find(i => i.id == id);
  if (!ilan) return res.status(404).json({ hata: "İlan bulunamadı." });
  try {
    await transporter.sendMail({
      from: `"PatiBul Trabzon Destek" <${GMAIL}>`,
      to: ilan.mail,
      subject: `🐱 PatiBul: ${ilan.kediAdi} hakkında önemli bilgi`,
      html: generateAdminEmail(ilan, mesaj)
    });
    res.json({ basarili: true });
  } catch (e) {
    res.status(500).json({ hata: "Mail gönderilemedi." });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐱 PatiBul Trabzon ${PORT} portunda çalışıyor.`);
});
