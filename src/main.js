import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import { config } from './config.js';
import { executeServerCommand, backupDatabase, autoBackupDatabase } from './server-utils.js';

const bot = new TelegramBot(config.TOKEN, { polling: true });
bot.onText(/\/panel/, (msg) => {
  const chatId = msg.chat.id;
  
  if (config.AUTO_BACKUP_CHAT_ID === null) {
    config.AUTO_BACKUP_CHAT_ID = chatId;
  }
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: "▶️ Старт сервера", callback_data: "start_server" },
        { text: "⏹️ Стоп сервера", callback_data: "stop_server" }
      ],
      [
        { text: "🔄 Рестарт сервера", callback_data: "restart_server" },
        { text: "💾 Бекап БД", callback_data: "backup_db" }
      ]
    ]
  };
  
  bot.sendMessage(chatId, 
    "🎮 **Панель управления CRMP сервером**\n\n" +
    "Выберите действие:\n" +
    "🕐 Автоматический бекап каждый час включен",
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    }
  );
});

bot.onText(/\/restart/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, "🔄 Перезапускаю CRMP сервер...");
  
  executeServerCommand(3)
    .then(() => {
      bot.sendMessage(chatId, "✅ Сервер перезапущен!");
    })
    .catch((error) => {
      bot.sendMessage(chatId, `❌ Ошибка при перезапуске: ${error.message}`);
    });
});

bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const messageId = message.message_id;
  const data = callbackQuery.data;
  
  switch (data) {
    case "start_server":
      bot.answerCallbackQuery(callbackQuery.id, { text: "Запускаю сервер..." });
      bot.editMessageText("🔄 Запускаю CRMP сервер...", {
        chat_id: chatId,
        message_id: messageId
      });
      
      executeServerCommand(1)
        .then(() => {
          bot.editMessageText("✅ Сервер запущен!", {
            chat_id: chatId,
            message_id: messageId
          });
        })
        .catch((error) => {
          bot.editMessageText(`❌ Ошибка: ${error.message}`, {
            chat_id: chatId,
            message_id: messageId
          });
        });
      break;
      
    case "stop_server":
      bot.answerCallbackQuery(callbackQuery.id, { text: "Останавливаю сервер..." });
      bot.editMessageText("🔄 Останавливаю CRMP сервер...", {
        chat_id: chatId,
        message_id: messageId
      });
      
      executeServerCommand(2)
        .then(() => {
          bot.editMessageText("✅ Сервер остановлен!", {
            chat_id: chatId,
            message_id: messageId
          });
        })
        .catch((error) => {
          bot.editMessageText(`❌ Ошибка: ${error.message}`, {
            chat_id: chatId,
            message_id: messageId
          });
        });
      break;
      
    case "restart_server":
      bot.answerCallbackQuery(callbackQuery.id, { text: "Перезапускаю сервер..." });
      bot.editMessageText("🔄 Перезапускаю CRMP сервер...", {
        chat_id: chatId,
        message_id: messageId
      });
      
      executeServerCommand(3)
        .then(() => {
          bot.editMessageText("✅ Сервер перезапущен!", {
            chat_id: chatId,
            message_id: messageId
          });
        })
        .catch((error) => {
          bot.editMessageText(`❌ Ошибка: ${error.message}`, {
            chat_id: chatId,
            message_id: messageId
          });
        });
      break;
      
    case "backup_db":
      bot.answerCallbackQuery(callbackQuery.id, { text: "Создаю бекап базы данных..." });
      handleBackupDatabase(chatId, messageId);
      break;
  }
});

async function handleBackupDatabase(chatId, messageId) {
  try {
    const result = await backupDatabase(chatId, messageId);
    if (result) {
      bot.sendDocument(chatId, result.data, {
        caption: result.caption,
        filename: result.filename
      });
    }
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка при создании бекапа: ${error.message}`);
  }
}

async function handleAutoBackup(chatId) {
  try {
    const result = await autoBackupDatabase(chatId);
    if (result) {
      bot.sendDocument(chatId, result.data, {
        caption: result.caption,
        filename: result.filename
      });
    }
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка автоматического бекапа: ${error.message}`);
  }
}

cron.schedule('0 * * * *', () => {
  if (config.AUTO_BACKUP_CHAT_ID !== null) {
    handleAutoBackup(config.AUTO_BACKUP_CHAT_ID);
  }
});

bot.on('error', (error) => {
  console.error('Ошибка бота:', error);
});

bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
});

console.log('🤖 Telegram бот запущен и готов к работе!');
console.log('📋 Доступные команды:');
console.log('  /panel - Панель управления сервером');
console.log('  /restart - Перезапуск сервера');
console.log('🕐 Автоматический бекап настроен на каждый час');
