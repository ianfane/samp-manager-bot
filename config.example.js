// Пример конфигурации - скопируйте в config.js и заполните своими данными
export const config = {
  // Telegram Bot Token (получите у @BotFather)
  TOKEN: "YOUR_BOT_TOKEN_HERE",
  
  // SSH настройки для подключения к серверу
  SSH: {
    HOST: "your-server-ip",
    USER: "your-username", 
    PASS: "your-password"
  },
  
  // Настройки базы данных
  DATABASE: {
    HOST: "your-db-host",
    USER: "your-db-username",
    PASS: "your-db-password", 
    NAME: "your-database-name"
  },
  
  // ID чата для автоматических бекапов (устанавливается автоматически)
  AUTO_BACKUP_CHAT_ID: null
};
