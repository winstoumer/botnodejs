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
const port = process.env.PORT || 3000; // Set the port to 3000 as 

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
app.use(express.json()); // Для парсинга JSON тела 

// Define API routes
app.get('/api/coins/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { rows } = await pool.query('SELECT coins FROM balance WHERE telegram_user_id = $1', [userId]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Сохранение собранных монет в таблицу Collect
// Сохранение количества монет в таблицу Balance
app.post('/api/coins/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { coins } = req.body;

    // Проверяем наличие userId
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId in request parameters' });
    }

    // Обновляем баланс пользователя в таблице Balance
    const result = await pool.query('UPDATE balance SET coins = $1 WHERE telegram_user_id = $2', [coins, userId]);
    if (result.rowCount > 0) {
      return res.status(200).send('Coins updated');
    } else {
      return res.status(404).send('User not found');
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Сохранение количества собранных монет в таблицу Collect
app.post('/api/collect/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { collecting } = req.body;

    // Проверяем наличие userId и собранных монет
    if (!userId || !collecting) {
      return res.status(400).json({ error: 'Missing required parameters in the request' });
    }

    // Вставляем новую запись в таблицу Collect
    const result = await pool.query('INSERT INTO collect (collecting, telegram_user_id) VALUES ($1, $2)', [collecting, userId]);
    if (result.rowCount > 0) {
      return res.status(200).send('Collecting record added');
    } else {
      return res.status(500).send('Failed to add collecting record');
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

console.log('Бот запущен..');

bot.onText(/\/start r_(\d+)/, (msg, match) => {
  const userId = msg.from.id;
  const referrerId = match[1]; // ID пользователя, который отправил реферальную ссылку
  const webAppUrl = 'https://t.me/minerweb3_bot/app';

    bot.sendMessage(chatId, '<b>Привет!</b>');


  const opts = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Open', web_app: { url: webAppUrl } }]
      ]
    })
  };

  bot.sendMessage(chatId, 'Пора добывать!', opts); 
  // Здесь вы можете добавить логику для обработки реферальной ссылки
  // Например, сохранить информацию о реферере и реферале в базе данных
  // и начислить вознаграждение пользователю, который отправил ссылку
  bot.sendMessage(userId, `Вы были приглашены пользователем с ID ${referrerId}`);
});

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
