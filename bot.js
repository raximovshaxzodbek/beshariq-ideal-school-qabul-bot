require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const sheets = require('./sheets');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Error: BOT_TOKEN not set in environment. Create a .env file or set env vars.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

console.log('BOT_TOKEN present?', !!BOT_TOKEN);


// In-memory sessions (simple). For production, use a DB.
const sessions = new Map();

// Validation helpers
function isValidPhone(s) {
  if (!s) return false;
  const cleaned = s.replace(/\s+/g, '');
  return /^\+?\d{9,15}$/.test(cleaned);
}

function isValidGrade(s) {
  if (!s) return false;
  return /^\d+-sinf$/.test(s) || s === 'Maktabni bitirganman';
}

function normalizeText(s) { return (s || '').trim(); }

// We'll control the question flow in askNextQuestion using step index.

function startRegistration(ctx) {
  const chatId = ctx.chat.id;
  sessions.set(chatId, { step: 0, data: {} });
  ctx.reply("Ro'yxatdan o'tish boshlanadi. Iltimos aniq va to'g'ri javob bering.");
  askNextQuestion(ctx, sessions.get(chatId));
}

bot.start((ctx) => {
  // If a user hits /start during a session, clear the session
  const chatId = ctx.chat && ctx.chat.id;
  if (chatId) sessions.delete(chatId);
  ctx.reply(`Assalomu alaykum! "Ideal Ilm-tarbiya" maktabiga ro'yxatdan o'tish uchun /register buyrug'ini bosing.\nMa'lumot uchun /info ni bosing.`);
});

// Info command: show school info and stop any active registration
bot.command('info', (ctx) => {
  const chatId = ctx.chat && ctx.chat.id;
  if (chatId) sessions.delete(chatId);
  return ctx.reply("1-sinfdan 11-sinfgacha qabul davom etmoqda,\nManzil: Yakkatut MFY\nTelefon: 93-301-62-76");
});

bot.command('register', (ctx) => {
  startRegistration(ctx);
});

bot.command('cancel', (ctx) => {
  const chatId = ctx.chat.id;
  sessions.delete(chatId);
  ctx.reply('Ro\'yxatdan o\'tish bekor qilindi. Istasangiz /register buyruq bilan qayta boshlang.');
});

// Handle contact sharing
bot.on('contact', (ctx) => {
  const chatId = ctx.chat.id;
  const session = sessions.get(chatId);
  if (!session) {
    return ctx.reply('Iltimos avval /register bilan boshlang.');
  }

  const contact = ctx.message.contact;
  // If we are expecting phone (step 1), accept contact
  if (contact && session.step === 1) {
    session.data.phone = contact.phone_number;
    session.step++;
    askNextQuestion(ctx, session);
  } else {
    ctx.reply('Kontakt qabul qilindi.');
  }
});

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text && ctx.message.text.trim();
  const session = sessions.get(chatId);

  // If no active session, offer to start
  // Ignore bot commands (so /info or /start don't get treated as regular answers)
  if (text && text.startsWith('/')) return;

  if (!session) {
    return ctx.reply('Ro\'yxatdan o\'tish uchun /register buyrug\'ini bosing.');
  }

  if (!session) return ctx.reply('Ro\'yxatdan o\'tish uchun /register buyrug\'ini bosing.');

  // Handle responses based on current step
  switch (session.step) {
    case 0:
      // name
      session.data.name = normalizeText(text);
      if (!session.data.name) return ctx.reply('Iltimos, ism va familiyangizni kiriting (masalan: Alisherov Vali)');
      session.step = 1;
      return askNextQuestion(ctx, session);
    case 1:
      // phone typed manually
      if (!isValidPhone(text)) {
        return ctx.reply('Telefon raqami noto\'g\'ri formatda. Iltimos +998... yoki 9 dan 15 gacha raqam kiriting (masalan: +998938496849)');
      }
      session.data.phone = text;
      session.step = 2;
      return askNextQuestion(ctx, session);
    case 2:
      // address
      session.data.address = normalizeText(text);
      if (!session.data.address) return ctx.reply('Iltimos yashash manzilingizni kiriting (masalan: O\'zbekiston tumani, Hamid Olimjon ko\'chasi)');
      session.step = 3;
      return askNextQuestion(ctx, session);
    case 3:
      // subject selection or typed subject
      if (text === 'Boshqa fan') {
        session.data.subject = '';
        // ask to type the subject
        await ctx.reply('Iltimos, qaysi fan (boshqa) ekanligini yozing:');
        session.step = 30; // intermediate step for typed subject
        return;
      }
      // accept typed or button value
      session.data.subject = normalizeText(text);
      if (!session.data.subject) return ctx.reply('Iltimos, fan tanlang yoki yozing.');
      session.step = 4;
      return askNextQuestion(ctx, session);
    case 30:
      // typed subject after choosing Boshqa fan
      session.data.subject = text;
      session.step = 4;
      return askNextQuestion(ctx, session);
    case 4:
      // grade
      if (!isValidGrade(text)) {
        return ctx.reply('Iltimos, to\'g\'ri formatda sinfni tanlang yoki yozing (masalan: 5-sinf yoki Maktabni bitirganman)');
      }
      session.data.grade = text;
      session.step = 5;
      return askNextQuestion(ctx, session);
    case 5:
      // source
      session.data.source = normalizeText(text);
      if (!session.data.source) return ctx.reply('Iltimos, qayerdan bilganingizni tanlang.');
      session.step = 6;
      return askNextQuestion(ctx, session);
    default:
      return ctx.reply('Hech qanday aktiv sorov qolmadi. /register bilan qayta boshlang.');
  }
});

async function askNextQuestion(ctx, session) {
  const chatId = ctx.chat.id;
  if (session.step === 0) {
    await ctx.reply("Assalomu alaykum! Ism va familiyangizni kiriting:\n(Masalan: Alisherov Vali)");
    return;
  }

  if (session.step === 1) {
    return ctx.reply("Iltimos, telefon raqamingizni yuboring.\nPastdagi \"Raqamni yuborish\" tugmasini bosing yoki nomeringizni yozib qoldiring.\nMasalan: +998938496849", Markup.keyboard([[Markup.button.contactRequest('Raqamni yuborish')]]).oneTime().resize());
  }

  if (session.step === 2) {
    await ctx.reply("Yashash manzilingizni kiriting:\n(Masalan: O'zbekiston tumani, Hamid Olimjon ko'chasi)", Markup.removeKeyboard());
    return;
  }

  if (session.step === 3) {
    const subjects = [['Matematika', 'Ingliz tili'], ['Informatika / IT', 'Rus tili'], ['Huquq', 'Boshqa fan']];
    return ctx.reply('Qaysi fanni o\'rganmoqchisiz? (tanlang yoki yozing)', Markup.keyboard(subjects).oneTime().resize());
  }

  if (session.step === 4) {
    // Build grade keyboard rows
    const grades = [];
    for (let i = 1; i <= 11; i += 3) {
      const row = [];
      for (let j = i; j < i + 3 && j <= 11; j++) row.push(`${j}-sinf`);
      grades.push(row);
    }
    grades.push(['Maktabni bitirganman']);
    return ctx.reply('Nechanchi sinfda o\'qiysiz?', Markup.keyboard(grades).oneTime().resize());
  }

  if (session.step === 5) {
    const sources = [['Instagram', 'Telegram', 'Tanishlardan'], ['Ko\'chada bannerlardan', 'Boshqa joydan']];
    return ctx.reply('Biz haqimizda qayerdan eshitdingiz?', Markup.keyboard(sources).oneTime().resize());
  }

  if (session.step === 6) {
    // Completed - append to sheet
    const row = buildRow(ctx, session.data);
    try {
      await sheets.appendRow(row);
      sessions.delete(chatId);
      await ctx.reply("Rahmat! Ma'lumotlaringiz qabul qilindi. Siz bilan tez orada bog'lanamiz. ✅\n\nQo'shimcha savollar uchun\n93-301-62-76", Markup.removeKeyboard());
    } catch (err) {
      console.error('Sheets append error:', err);
      await ctx.reply('Xatolik yuz berdi: ma`lumotlar Google Sheets ga yozilmadi. Iltimos administrator bilan bog\'laning.');
    }
    return;
  }
}

function buildRow(ctx, data) {
  // Build data in the order: timestamp, name, phone, address, subject, grade, source, telegram_username, telegram_id
  const timestamp = new Date().toISOString();
  const username = ctx.from.username || '';
  const telegramId = ctx.from.id;
  return [timestamp, data.name || '', data.phone || '', data.address || '', data.subject || '', data.grade || '', data.source || '', username, telegramId];
}

// Simple help
bot.command('help', (ctx) => {
  ctx.reply("/register - Ro'yxatdan o'tish\n/cancel - Ro'yxatdan o'tishni bekor qilish\n/help - Bu yordam xabari");
});

// Start polling
bot.launch().then(() => console.log('Bot started')).catch((err) => {
  console.error('Bot failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
