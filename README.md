# SAMP MANAGER BOT

Telegram бот для управления CRMP сервером с функциями автоматического бекапа базы данных.

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка конфигурации

Отредактируйте файл `src/config.js` и укажите ваши настройки:

```javascript
export const config = {
  TOKEN: "YOUR_BOT_TOKEN",
  
  SSH: {
    HOST: "your-server-ip",
    USER: "username",
    PASS: "password"
  },
  
  DATABASE: {
    HOST: "your-db-host",
    USER: "db_username",
    PASS: "db_password",
    NAME: "database_name"
  }
};
```

### 3. Сборка проекта

```bash
npm run build
```

### 4. Запуск бота

```bash
npm start
```

## Команды бота

- `/panel` - Открыть панель управления сервером
- `/restart` - Перезапустить сервер

## Требования

- Node.js 18+
- MySQL/MariaDB сервер
- Telegram Bot Token
