const { Telegraf, Scenes, session, Markup } = require("telegraf");
const { google } = require("googleapis");

// --- SOZLAMALAR ---
const BOT_TOKEN = "8663818855:AAHaHxVCz0FoQliqcxUJqEFPDO78dyHfZhQ";
const ADMIN_ID = "5946990742";
const SPREADSHEET_ID = "1lFG2VqOGUQT0UJNNTP8ou-qj6cG6FqaetrPH80--YP0";

const bot = new Telegraf(BOT_TOKEN);

// --- GOOGLE SHEETS SOZLAMASI ---
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function appendToSheet(values) {
  const sheets = google.sheets({ version: "v4", auth });
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:G", // Ustunlar soni ko'paydi
      valueInputOption: "USER_ENTERED",
      resource: { values: [values] },
    });
  } catch (err) {
    console.error("Google Sheets Error:", err);
  }
}

const registrationWizard = new Scenes.WizardScene(
  "REGISTRATION_SCENE",

  // 1. Ism
  (ctx) => {
    ctx.reply("👤 Farzandingizning ism va familiyasini kiriting:\n\n*Masalan: Toshpo'latov Alisher");
    return ctx.wizard.next();
  },

  // 2. Saqlash + category ga qarab start
  (ctx) => {
    ctx.wizard.state.name = ctx.message.text;
    const cat = ctx.scene.state.category;

    if (cat === "prep") {
      ctx.reply(
        "🎂 Farzandingiz yoshini tanlang:",
        Markup.keyboard([
          ["3 yosh", "4 yosh"],
          ["5 yosh", "6 yosh"],
          ["7 yosh"],
        ]).resize(),
      );
    }

    if (cat === "school") {
      ctx.reply(
        "🏫 Farzandingiz nechanchi sinfda o'qiydi:",
        Markup.keyboard([
          ["1-sinf", "2-sinf", "3-sinf"],
          ["4-sinf", "5-sinf", "6-sinf"],
          ["7-sinf"],
        ]).resize(),
      );
    }

    if (cat === "tutor") {
      ctx.reply(
        "📚 Qaysi yo'nalishda tahsil olishini istaysiz?",
        Markup.keyboard([
          ["Aniq fanlar 📐", "Tabiiy fanlar 🧪"],
          ["Xorijiy tillar 🌍", "Ijtimoiy fanlar ⚖️"],
        ]).resize(),
      );
    }

    return ctx.wizard.next();
  },

  // 3. Dynamic step (prep/school/tutor)
  (ctx) => {
    const cat = ctx.scene.state.category;
    ctx.wizard.state.step1 = ctx.message.text;

    if (cat === "prep") {
      ctx.reply(
        "📊 Hozirgi daraja qanday:",
        Markup.keyboard([
          ["Hech narsa bilmaydi"],
          ["Harf-son biladi"],
          ["O‘qiydi lekin sust"],
        ]).resize(),
      );
    }

    if (cat === "school") {
      ctx.reply(
        "📊Farzandingiz bilim darajasi qanday?",
        Markup.keyboard([["Past"], ["O‘rtacha"], ["Yaxshi"]]).resize(),
      );
    }

    if (cat === "tutor") {
      const val = ctx.message.text;

      if (val.includes("Aniq")) {
        ctx.reply(
          "📐 Fan tanlang:",
          Markup.keyboard([["Matematika", "Fizika"]]).resize(),
        );
      } else if (val.includes("Tabiiy")) {
        ctx.reply(
          "🧪 Fan tanlang:",
          Markup.keyboard([["Kimyo", "Biologiya"]]).resize(),
        );
      } else if (val.includes("Xorijiy")) {
        ctx.reply(
          "🌍 Fan tanlang:",
          Markup.keyboard([["Ingliz tili", "Rus tili"]]).resize(),
        );
      } else {
        ctx.reply(
          "⚖️ Fan tanlang:",
          Markup.keyboard([["Tarix", "Ona tili"]]).resize(),
        );
      }
    }

    return ctx.wizard.next();
  },

  // 4. Pain point
  (ctx) => {
    ctx.wizard.state.step2 = ctx.message.text;

    ctx.reply(
      "⚠️ Asosiy muammo nima?",
      Markup.keyboard([
        ["Tushunmaydi"],
        ["O'zlashtira olmaydi"],
        ["Telefon ko‘p o'ynaydi"],
        ["E’tibor yo‘q"],
      ]).resize(),
    );

    return ctx.wizard.next();
  },

  // 5. Goal
  (ctx) => {
    ctx.wizard.state.pain = ctx.message.text;

    ctx.reply(
      "🎯 Qanday natija xohlaysiz?",
      Markup.keyboard([
        ["Bahoni ko‘tarishni"],
        ["O'zlashtirishi yuqori bo'lishini"],
        ["Imtihonga tayyorlov"],
        ["Prezident maktabi va boshqa grantlar"],
      ]).resize(),
    );

    return ctx.wizard.next();
  },

  // 6. Phone
  (ctx) => {
    ctx.wizard.state.goal = ctx.message.text;

    ctx.reply(
      "📞 Telefon raqam:",
      Markup.keyboard([Markup.button.contactRequest("📲 Yuborish")]).resize(),
    );

    return ctx.wizard.next();
  },

  // 7. Save
  async (ctx) => {
    const contact = ctx.message.contact;
    const phone = contact ? contact.phone_number : ctx.message.text;

    const data = ctx.wizard.state;
    const cat = ctx.scene.state.category;

    const row = [
      new Date().toLocaleString("uz-UZ"),
      cat,
      data.name,
      data.step1,
      data.step2,
      data.pain,
      data.goal,
      phone,
    ];

    await appendToSheet(row);

    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `🚀 Yangi lead:\n\n👤 ${data.name}\n📂 ${cat}\n📊 ${data.step1}\n⚠️ ${data.pain}\n🎯 ${data.goal}\n📞 ${phone}`,
    );

    await ctx.reply("✅ Rahmat! Tez orada bog‘lanamiz.");
    return ctx.scene.leave();
  },
);

// --- 2. ASOSIY LOGIKA ---
const stage = new Scenes.Stage([registrationWizard]);
bot.use(session());
bot.use(stage.middleware());

const mainButtons = Markup.keyboard([
  ["🎒 Maktabga tayyorlov", "🎓 1–7-sinflar"],
  ["📚 Repetitorlik", "ℹ️ Ma’mulot olish"],
]).resize();

bot.start((ctx) => {
  ctx.reply(
    "Assalomu alaykum! 👋\nBeshariq Ideal School 2026 botiga xush kelibsiz! \n\n Farzandingizni qaysi sinfga yoki yo'nalishga yozdirmoqchisiz?",
    mainButtons,
  );
});

// Bo'lim tanlanganda "category"ni saqlab qo'yamiz va sahnaga kiramiz
bot.hears("🎒 Maktabga tayyorlov", (ctx) => {
  ctx.reply(
    "🎒 MAKTABGA TAYYORLOV (PRE-SCHOOL)\n\n" +
      "Farzandingizning ilk ta'lim qadamlari ishonchli bo'lsin! ✨\n\n" +
      "✅ Bizda nimalar bor?\n" +
      "— 🥣 3 mahal sog'lom va mazali issiq ovqat\n" +
      "— 🧠 O'yin orqali mantiqiy fikrlashni rivojlantirish\n" +
      "— 🇬🇧 Ingliz tili va rus tili poydevori\n" +
      "— 🎨 Ijodiy va intellektual mashg'ulotlar\n\n" +
      "🕒 Farzandingiz kun davomida pedagoglar nazoratida bo'ladi!",
    Markup.inlineKeyboard([
      Markup.button.callback("🔘 Ro‘yxatdan o‘tish", "reg_prep"),
    ]),
  );
});

bot.hears("🎓 1–7-sinflar", (ctx) => {
  ctx.reply(
    "🎓 1–7-SINFLAR: SIFATLI TA'LIM MAKONI\n\n" +
      "Kelajak yetakchilarini tayyorlaymiz! 🏆\n\n" +
      "✅ Nega aynan Ideal School?\n" +
      "— 📈 Dars + Test + Tahlil (DTX) tizimi\n" +
      "— 💻 Zamonaviy jihozlangan innovatsion xonalar\n" +
      "— 👨‍🏫 Tajribali va o'z ishining ustalari bo'lgan ustozlar\n" +
      "— 📊 Har bir o'quvchining shaxsiy natijalari monitoringi\n\n" +
      "🚀 Biz bilan farzandingiz orzulariga bir qadam yaqinroq!",
    Markup.inlineKeyboard([
      Markup.button.callback("🔘 Ro‘yxatdan o‘tish", "reg_school"),
    ]),
  );
});

bot.hears("📚 Repetitorlik", (ctx) => {
  ctx.reply(
    "📚 REPETITORLIK: NATIJA UCHUN ISHLAYMIZ!\n\n" +
      "Imtihonlardan qo'rqishni unuting! ✨ Biz bilan talaba bo'lish yanada oson.\n\n" +
      "🌍 Ta'lim tillari: O'zbek va Rus tillarida\n\n" +
      "📌 Bizning yo'nalishlar:\n\n" +
      "📐 Aniq fanlar:\n" +
      "— Matematika, Fizika\n\n" +
      "🧪 Tabiiy fanlar:\n" +
      "— Kimyo, Biologiya (Tibbiyotga kafolatli tayyorlov)\n\n" +
      "🌍 Xorijiy tillar:\n" +
      "— IELTS / CEFR (Intensiv Speaking va Grammar)\n" +
      "— Rus tili (Noldan o'rganish va so'zlashuv)\n\n" +
      "⚖️ Ijtimoiy fanlar:\n" +
      "— Tarix, Ona tili va adabiyot\n\n" +
      "🔥 Nega bizni tanlashadi?\n" +
      "✅ Har oyda bepul MOCK exam (sinov testlari)\n" +
      "✅ Natijalar monitoringi va ota-onalarga hisobot\n" +
      "✅ Zamonaviy metodika va kuchli ustozlar\n\n" +
      "🚀 O'z kelajagingizni bugundan quring!",
    Markup.inlineKeyboard([
      Markup.button.callback("🔘 Ro‘yxatdan o‘tish", "reg_tutor"),
    ]),
  );
});

// Ro'yxatdan o'tishni boshlashda kategoriyani aniqlash
bot.action("reg_prep", (ctx) => {
  ctx.answerCbQuery();
  return ctx.scene.enter("REGISTRATION_SCENE", { category: "prep" });
});
bot.action("reg_school", (ctx) => {
  ctx.answerCbQuery();
  return ctx.scene.enter("REGISTRATION_SCENE", { category: "school" });
});
bot.action("reg_tutor", (ctx) => {
  ctx.answerCbQuery();
  return ctx.scene.enter("REGISTRATION_SCENE", { category: "tutor" });
});

// --- MA'LUMOT OLISH (Rasm bilan) ---
bot.hears("ℹ️ Ma’mulot olish", async (ctx) => {
  const photoUrl =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToZP7BBMk1hblr9MW096dy3aTWybdsIAVz1g&s";
  const infoMsg =
    `🏢 BESHARIQ IDEAL SCHOOL\n\n` +
    `Farzandingiz kelajagi uchun eng to'g'ri tanlov! Biz haqimizda barcha ma'lumotlar:\n\n` +
    `📞 Bog'lanish uchun raqamlar:\n` +
    `└ 📱 [+998 88 730 00 40](tel:+998887300040)\n` +
    `└ 📱 [+998 88 733 00 40](tel:+998887330040)\n\n` +
    `📍 Manzil:\n` +
    `Beshariq tumani, Hamid Olimjon MFY, Sirdaryo ko'chasi, 129-uy.\n\n` +
    `🗺 Mo'ljal:\n` +
    `Davr to'yxonasi va Family park ro'parasida.\n\n` +
    `🔗 [Google Xaritada ko'rish](https://maps.app.goo.gl/TJJRcwWfvVnZ9AjZ7)\n\n` + // Koordinatalarni aniqrog'iga almashtirishingiz mumkin
    `🕒 Ish vaqti: Dushanba — Shanba (08:00 - 18:00)\n\n` +
    `🚀 Hoziroq ro'yxatdan o'ting va bizning katta oilamizga qo'shiling!`;

  await ctx.replyWithPhoto(
    { url: photoUrl },
    {
      caption: infoMsg,
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.url(
            "📍 Xarita",
            "https://maps.app.goo.gl/TJJRcwWfvVnZ9AjZ7",
          ),
        ],
      ]),
    },
  );
});

bot.launch();
console.log("🚀 Ideal School Boti ishga tushdi!");
