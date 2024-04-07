// This is a basic program on JavaScript
//
// Try to modify and run it and check out
// the output in the terminal below
//
// Happy coding! :-)

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Set the port to 3000 as required

// Настройка пула соединений с PostgreSQL
//const pool = new Pool({
  //user: process.env.DB_USER,
 // host: process.env.DB_HOST,
 // database: process.env.DB_NAME,
  //password: process.env.DB_PASSWORD,
  //port: process.env.DB_PORT,
//});

// Создаем новый пул соединений
const pool = new Pool({
  user: 'koyeb-adm',
  host: 'ep-spring-breeze-a2fb6o41.eu-central-1.pg.koyeb.app',
  database: 'koyebdb',
  password: '9b6vxTfkZuPg',
  port: 5432,
  ssl: {
    require: true,
    rejectUnauthorized: true // Это не рекомендуется для продакшена, так как это может создать уязвимость безопасности
  }
});

app.use(cors()); // Use CORS middleware
app.use(express.json()); // Для парсинга JSON тела запросов

// Функция для получения количества монет пользователя
async function getCoins(telegramUserId) {
  try {
    const query = 'SELECT coins FROM balance WHERE telegram_user_id = $1';
    const values = [telegramUserId];

    // Здесь мы выполняем запрос, используя плейсхолдер $1 для параметра
    const res = await pool.query(query, values);
    return res.rows;
  } catch (err) {
    console.error('Error executing query', err.stack);
    throw err;
  }
}

// Пример использования функции
const telegramUserId = '935718482';

// Define API routes
app.get('/api/coins/935718482', async (req, res) => {
  try {
    // const { ʼ } = req.params;
    const { rows } = await pool.query('SELECT coins FROM balance WHERE telegram_user_id = $1', ['935718482']);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Сохранение количества монет
app.post('/api/coins/935718482', async (req, res) => {
  try {
    // const { userId } = req.params;
    const { coins } = req.body;
    const result = await pool.query('UPDATE balance SET coins = $1 WHERE telegram_user_id = $2', [coins, ʼ935718482ʼ]);
    if (result.rowCount > 0) {
      res.status(200).send('Coins updated');
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const TelegramBot = require('node-telegram-bot-api')

const token = '6306257543:AAG4VxHk9JiuxTb3-LweaDJfvpcdZRNgD5A'

const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = 'https://t.me/minerweb3_bot/app';

  const opts = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Open', web_app: { url: webAppUrl } }]
      ]
    })
  };

  bot.sendMessage(chatId, 'Пора добывать!', opts);
});

console.log('Бот запущен..');

// Обработчик для команды '/getuserid'.
bot.onText(/\/getuserid/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Отправляем ID пользователя обратно в чат.
  bot.sendMessage(chatId, `Ваш Telegram ID: ${userId}`);
});

bot.onText(/\/echo (.+)/, (msg, match) => {

	const chatId = msg.chat.id
	const resp = match[1]

	bot.sendMessage(chatId, resp)
})

'use strict';

console.log('Hello, World!');
