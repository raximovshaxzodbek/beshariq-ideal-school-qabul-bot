# Ideal Ilm-tarbiya — Telegram Qabul Bot (JavaScript)

Bu loyiha "Ideal Ilm-tarbiya" xususiy maktabi uchun Telegram orqali ro'yxatdan o'tish botini taqdim etadi. Bot quyidagi ma'lumotlarni to'playdi va Google Sheets ga yozadi:

- ism
- izoh
- manba
- manzil
- phone
- qiziqish
- sinf

Ota-onalar ham o'quvchilar ham ro'yxatdan o'tishi mumkin. Telefonni Telegram kontakt sifatida yuborish ham mumkin (telefon tugmasi mavjud).

## Fayllar

- `bot.js` — Telegram bot va savollar oqimi.
- `sheets.js` — Google Sheets ga yozish uchun yordamchi modul.
- `package.json` — loyihaning node dependensiyalari.
- `.env.example` — o'rnatish uchun muhit o'zgaruvchilari namunasi.

## Talablar

- Node.js (14+ tavsiya qilinadi)
- Telegram bot token (BotFather orqali yaratilgan)
- Google Cloud service account bilan Sheets API yoqilgan va spreadsheetga xizmat hisobini «share» qilingan bo'lishi kerak.

## Google Sheets sozlash (tezkor)

1. Google Cloud Console ga kirib yangi loyiha yoki mavjud loyihani tanlang.
2. "APIs & Services" -> "Library" dan Google Sheets API ni yoqing.
3. "Credentials" -> Create service account. Yaratganingizdan so'ng JSON formatdagi kalitni oling.
4. Spreadsheet (Google Sheets) yarating. URL dan `SHEET_ID` ni nusxa oling (https://docs.google.com/spreadsheets/d/<SHEET_ID>/...).
5. Spreadsheet ni service account email manzilingiz bilan bo'lishing (Share -> add email -> Editor).
6. `.env` fayliga quyidagilarni qo'ying: `BOT_TOKEN`, `SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`.
   - Agar `.env` orqali PRIVATE_KEY ni joylasangiz, `\n` (literal slash-n) bilan yangi qatordan belgilang yoki Windows muhitida to'g'ri multiline format qo'ying.

## Ishga tushirish (Windows PowerShell)

1. Dependencies o'rnating:

```powershell
npm install
```

2. Muhit o'zgaruvchilarini `.env` faylga joylang (yoki PowerShell da sozlang). Masalan `.env` nusxasi uchun `.env.example` ni ko'ring.

3. Botni ishga tushiring:

```powershell
npm start
```

Bot ishga tushgach, Telegramda /register buyruqini yuboring va ketma-ket chiqqan savollarga javob bering. Telefon qismida "Kontaktni yuborish (telefon)" tugmasi orqali Telegram kontaktini yuborishingiz mumkin yoki telefon raqamini qo'lda yozishingiz mumkin.

## Test va cheklovlar

- Hozirgi kodda sessiyalar xotirada saqlanadi — server qayta ishga tushsa barcha yarim to'ldirilgan sessiyalar yo'qoladi. Production uchun Redis yoki boshqa DB ga o'tkazish kerak.
- Kiymatik validatsiya yengil; telefon va maydonlarni qo'shimcha tekshiruvlar bilan mustahkamlash tavsiya etiladi.

## Kengaytirish takliflari

- Ma'lumotlarni qayta ishlash va admin panel orqali qarash.
- Sessiyalarni saqlash (Redis) va retry mekanizmi.
- Qo'shimcha maydonlar (ota/onasi ismi, tug'ilgan sana, sinfga qabul qoidalari va h.k.).

Agar konfiguratsiya yoki ishga tushirishda yordam kerak bo'lsa, menga xabar bering — yordam beraman.# ideal-ilm-tarbiya-qabul-boti
# beshariq-ideal-school-qabul-bot
