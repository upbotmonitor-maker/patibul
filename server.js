// =======================================================
// PatiBul Trabzon V2.1 - server.js
// Çoklu Fotoğraf, Harita Linki, Aynı Kullanıcı İlanları
// =======================================================

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
app.use(express.static('public'));

const dataPath = path.join(__dirname, 'data.json');

// ========== VERİ OKUMA/YAZMA ==========
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

// ========== BAŞLANGIÇ İLANLARI ==========
function ensureSampleAds() {
  const data = readData();
  if (data.ilanlar.length === 0) {
    console.log('📦 Örnek ilanlar oluşturuluyor...');
    const now = Date.now();
    const birGun = 24 * 60 * 60 * 1000;

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
        tarih: now - (2 * birGun),
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
        tarih: now - (1 * birGun),
        bulundu: false, bulunduTarih: null, bulunduHikaye: '',
        silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
        sikayetSayisi: 0
      },
      {
        id: 3,
        fotolar: ['https://i.imgur.com/28iNrAJ.jpeg'],
        kediAdi: 'Minnoş',
        mahalle: 'Söğütlü',
        aciklama: 'Siyah-beyaz, mavi gözlü.',
        mail: 'lol886275@gmail.com',
        ilce: 'Ortahisar',
        acil: false,
        tarih: now - (3 * birGun),
        bulundu: false, bulunduTarih: null, bulunduHikaye: '',
        silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
        sikayetSayisi: 0
      },
      {
        id: 4,
        fotolar: ['https://i.imgur.com/S5opurd.jpeg'],
        kediAdi: 'Loki',
        mahalle: 'Çukurçayır',
        aciklama: `Süper Acil işaretli gerçek kayıp ilanıdır.

Kedimizin Adı: Loki
Kaybolma Tarihi: 18.04.2026 - Bugün
Kaybolduğu Yer: Trabzon, Çukurçayır Mahallesi
Cinsiyeti: [Dişi/Erkek yaz]
Yaşı: [Yaklaşık yaş yaz]
Tüy Rengi/Özelliği: [Sarman/tekir/siyah vs. + göz rengi yaz]
Tasması Var Mı: [Var / Yok. Varsa rengi]
Kısır Mı: [Evet/Hayır/Bilmiyorum yaz]
Özel İşareti: Bilmiyoruz

Fotoğraf günceldir. Bugün kayboldu.

ÖNEMLİ: Bu hesabın 3 kayıp ilanı daha vardır. Minnoş, Paşa, Duman da aranıyor. 4 arkadaş olarak perişan haldeyiz.

 SADECE GÖREN VE FOTOĞRAF + KONUM ATABİLECEK KİŞİLER YAZSIN.

BULANA VEYA NET KONUM VERENE ÖDÜL VERİLECEKTİR.
İlanı arkadaşım adına ben açıyorum. İletişim Patı Bul üzerinden.`,
        mail: 'b48492401@gmail.com',
        ilce: 'Ortahisar',
        acil: true,
        tarih: now - (2 * 60 * 60 * 1000), // 2 saat önce
        bulundu: false, bulunduTarih: null, bulunduHikaye: '',
        silindi: false, arsiv: false, uyariMailGonderildi: false, eski: false,
        sikayetSayisi: 0
      }
    ];

    data.ilanlar = ornekIlanlar;
    data.sonId = 4;
    data.toplamBulunan = 0;
    writeData(data);
    console.log('✅ 4 örnek ilan eklendi.');
  }
}

ensureSampleAds();

// Küfür listesi
const KUFURLER = ["aq", "amk", "sg", "oç", "s*ktir", "p*ç", "m*k"];
function containsKufur(text) {
  if (!text) return false;
  return KUFURLER.some(k => text.toLowerCase().includes(k));
}

// 30 gün maili
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

// HTML Mail Şablonları (önceki gibi)
function generateComplaintEmail(ilan, count) { /* aynı */ }
function generateAdminEmail(ilan, mesaj) { /* aynı */ }

// ========== API ==========
app.get('/ilanlar', async (req, res) => {
  const data = readData();
  await check30DaysAndMail(data);
  const now = Date.now();
  const archiveThreshold = 7 * 24 * 60 * 60 * 1000;
  data.ilanlar.forEach(i => {
    if (i.bulundu && !i.arsiv && i.bulunduTarih && (now - i.bulunduTarih) > archiveThreshold) i.arsiv = true;
  });
  writeData(data);

  const aktifIlanlar = data.ilanlar.filter(i => !i.silindi && !i.arsiv);
  aktifIlanlar.sort((a, b) => (b.acil ? 1 : 0) - (a.acil ? 1 : 0) || b.tarih - a.tarih);

  const ilceSayac = {};
  aktifIlanlar.filter(i => !i.bulundu).forEach(i => { ilceSayac[i.ilce] = (ilceSayac[i.ilce] || 0) + 1; });

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
  const SORULAR = [ /* aynı */ ];
  res.json(SORULAR[Math.floor(Math.random() * SORULAR.length)]);
});

// POST /ilan-ekle - ÇOKLU FOTOĞRAF DESTEĞİ
app.post('/ilan-ekle', async (req, res) => {
  const data = readData();
  let { fotolar, kediAdi, mahalle, aciklama, mail, ilce, acil, captchaCevap, dogruCevap, onayli } = req.body;

  // Tek fotoğraf gelirse diziye çevir
  if (!Array.isArray(fotolar)) fotolar = fotolar ? [fotolar] : [];

  if (fotolar.length === 0 || !kediAdi || !mahalle || !mail || !ilce) {
    return res.status(400).json({ hata: "En az 1 fotoğraf ve tüm alanlar zorunludur." });
  }
  if (fotolar.length > 3) {
    return res.status(400).json({ hata: "En fazla 3 fotoğraf yükleyebilirsiniz." });
  }
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

// POST /bulundu, /hikaye-ekle, /sikayet, /admin/* aynı

// Yeni endpoint: Kullanıcının diğer ilanları (isteğe bağlı)
app.get('/kullanici-ilanlari/:email', (req, res) => {
  const data = readData();
  const email = req.params.email;
  const digerleri = data.ilanlar.filter(i => i.mail === email && !i.silindi && !i.arsiv && !i.bulundu);
  res.json(digerleri);
});

app.listen(PORT, '0.0.0.0', () => console.log(`🐱 PatiBul V2.1 ${PORT} portunda`));
