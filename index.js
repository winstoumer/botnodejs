// This is a basic program on JavaScript
//
// Try to modify and run it and check out
// the output in the terminal below
//
// Happy coding! :-) x

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

app.get('/api/miner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT m.lvl, m.time_mined, m.coin_mined, m.price_miner, m.name, m.miner_image_url
      FROM user_miner um
      INNER JOIN miner m ON um.miner_id = m.miner_id
      WHERE um.telegram_user_id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Miner info not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/nextCollectionTime/:telegramUserId', async (req, res) => {
  try { //с
    const { telegramUserId } = req.params;
    const query = `
      SELECT MAX(c.date) AS next_collection_time, MAX(m.time_mined) AS time_mined
FROM collect c
JOIN user_miner um ON c.telegram_user_id = um.telegram_user_id
JOIN miner m ON um.miner_id = m.miner_id
      WHERE c.telegram_user_id = $1;
    `;
    const values = [telegramUserId];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении времени следующего сбора монет:', error);
    res.status(500).json({ error: 'Ошибка при получении времени следующего сбора монет' });
  }
});

app.get('/coinsCollected/:telegramUserId', async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const query = `
      SELECT 
        SUM(collecting) AS total_coins_collected
      FROM 
        collect
      WHERE 
        telegram_user_id = $1;
    `;
    const values = [telegramUserId];
    const result = await pool.query(query, values);
    
    if (result.rows.length > 0 && result.rows[0].total_coins_collected !== null) {
      const coinsCollected = result.rows[0].total_coins_collected;
      res.json({ coinsCollected });
    } else {
      res.status(404).json({ error: 'Coins collected data not found' });
    }
  } catch (error) {
    console.error('Error retrieving coins collected data:', error);
    res.status(500).json({ error: 'Error retrieving coins collected data' });
  }
});

app.get('/totalCoinsToCollect/:telegramUserId', async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const query = `
      SELECT 
        SUM(coin_mined) AS total_coins_to_collect
      FROM 
        miner
      JOIN 
        user_miner ON miner.miner_id = user_miner.miner_id
      WHERE 
        telegram_user_id = $1;
    `;
    const values = [telegramUserId];
    const result = await pool.query(query, values);
    
    if (result.rows.length > 0 && result.rows[0].total_coins_to_collect !== null) {
      const totalCoinsToCollect = result.rows[0].total_coins_to_collect;
      res.json({ totalCoinsToCollect });
    } else {
      res.status(404).json({ error: 'Total coins to collect data not found' });
    }
  } catch (error) {
    console.error('Error retrieving total coins to collect data:', error);
    res.status(500).json({ error: 'Error retrieving total coins to collect data' });
  }
});

// Маршрут для получения всех заданий и выполненных заданий для пользователя
app.get('/api/tasks/:telegram_user_id', async (req, res) => {
  try {
    const { telegram_user_id } = req.params;

    // Получаем все задания для пользователя
    const tasks = await pool.query(`
      SELECT t.*, ct.status AS completed
      FROM Task t
      LEFT JOIN Completed_Task ct ON t.id = ct.task_id AND ct.telegram_user_id = $1;
    `, [telegram_user_id]);

    res.json(tasks.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Маршрут для сохранения выполненного задания пользователем
// Обновление баланса пользователя при выполнении задания
app.post('/api/completed_tasks', async (req, res) => {
  try {
    const { task_id, telegram_user_id } = req.body;

    // Получаем награду за выполненное задание
    const { rows: taskRows } = await pool.query('SELECT coin_reward FROM task WHERE id = $1', [task_id]);
    if (taskRows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const coinReward = parseInt(taskRows[0].coin_reward);

    // Получаем текущий баланс пользователя
    const { rows: balanceRows } = await pool.query('SELECT coins FROM balance WHERE telegram_user_id = $1', [telegram_user_id]);
    if (balanceRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const currentCoins = parseInt(balanceRows[0].coins);

    // Проверяем, существует ли уже запись о выполненном задании для данного пользователя и задания
    const completedTaskExists = await pool.query('SELECT id FROM Completed_Task WHERE task_id = $1 AND telegram_user_id = $2', [task_id, telegram_user_id]);
    if (completedTaskExists.rows.length > 0) {
      return res.status(400).json({ error: 'Task already completed by the user' });
    }

    // Обновляем баланс пользователя, добавляя награду за выполненное задание
    const newCoins = currentCoins + coinReward;
    const updateBalanceResult = await pool.query('UPDATE balance SET coins = $1 WHERE telegram_user_id = $2', [newCoins, telegram_user_id]);

    if (updateBalanceResult.rowCount > 0) {
      // Если баланс успешно обновлен, вставляем запись о выполненном задании
      await pool.query('INSERT INTO Completed_Task (task_id, telegram_user_id, status) VALUES ($1, $2, $3)', [task_id, telegram_user_id, true]);
      return res.status(200).json({ message: 'Coins updated successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to update coins' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/miners/:telegram_user_id', async (req, res) => {
  const telegramUserId = req.params.telegram_user_id;
  try {
    if (isNaN(parseInt(telegramUserId))) {
      return res.status(400).json({ error: 'Invalid telegram_user_id' });
    }

    const result = await pool.query(`
      WITH user_miner_cte AS (
        SELECT m.miner_id, m.lvl, m.time_mined, m.name, m.coin_mined, m.price_mined, m.miner_image_url,
        CASE 
          WHEN um.miner_id IS NULL THEN FALSE 
          ELSE TRUE 
        END AS owned_by_user
        FROM miner m
        LEFT JOIN user_miner um ON m.miner_id = um.miner_id AND um.telegram_user_id = $1
      )
      SELECT * FROM user_miner_cte
      WHERE miner_id IN (
        SELECT miner_id FROM user_miner_cte WHERE owned_by_user = TRUE
        UNION ALL
        SELECT miner_id FROM user_miner_cte WHERE owned_by_user = FALSE
        ORDER BY owned_by_user DESC, lvl ASC
      );
    `, [telegramUserId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/minersg', async (req, res) => {
  try {
    const miners = await pool.query(`
      SELECT * FROM miner ORDER BY lvl ASC;
    `);

    res.json(miners.rows);
  } catch (err) {
    console.error('Error fetching miners:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/minerst/:telegram_user_id', async (req, res) => {
  const telegramUserId = req.params.telegram_user_id;
  try {
    // Получаем информацию о майнере пользователя
    const userMiner = await pool.query(`
      SELECT m.*, um.lvl AS user_lvl
      FROM miner m
      LEFT JOIN user_miner um ON m.miner_id = um.miner_id AND um.telegram_user_id = $1;
    `, [telegramUserId]);

    // Получаем уровень майнера пользователя
    const userLevel = userMiner.rows.length > 0 ? userMiner.rows[0].user_lvl : 0;

    // Получаем список всех майнеров, начиная с уровня, следующего за уровнем майнера пользователя
    const otherMiners = await pool.query(`
      SELECT *
      FROM miner
      WHERE lvl >= $1
      ORDER BY lvl ASC;
    `, [userLevel + 1]);

    // Возвращаем информацию о майнере пользователя и список остальных майнеров
    res.json({ userMiner: userMiner.rows[0], otherMiners: otherMiners.rows });
  } catch (err) {
    console.error('Error fetching miners:', err);
    res.status(500).json({ error: 'Internal Server Error' });
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

bot.onText(/\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const webAppUrl = 'https://t.me/minerweb3_bot/app';

  const opts = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Открыть', url: webAppUrl }]
      ]
    })
  };

  try {
    // Проверяем, существует ли пользователь в базе данных
    const userQuery = 'SELECT * FROM Balance WHERE telegram_user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      // Добавляем нового пользователя в базу данных
      await pool.query('INSERT INTO Balance (telegram_user_id, coins) VALUES ($1, $2)', [userId, 100]);
      bot.sendMessage(userId, 'Вы получили 100 монет за регистрацию.');
      sendWelcomePhoto(chatId, webAppUrl); // Отправляем приветственное фото с передачей URL
    } else {
      sendWelcomePhoto(chatId, webAppUrl);
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
    bot.sendMessage(userId, 'Произошла ошибка при обработке вашего запроса.');
  }

  try {
    // Проверяем, существует ли пользователь в базе данных
    const userMinerQuery = 'SELECT * FROM user_miner WHERE telegram_user_id = $1';
    const userMinerResult = await pool.query(userMinerQuery, [userId]);
    
    if (userMinerResult.rows.length === 0) {
        // Добавляем нового пользователя в базу данных
        await pool.query('INSERT INTO user_miner (telegram_user_id, miner_id, date) VALUES ($1, $2, $3)', [userId, 1, new Date()]);
        bot.sendMessage(userId, 'Вы присоединились к группе майнеров.');
        sendWelcomePhoto(chatId, webAppUrl); // Отправляем приветственное фото с передачей URL
    } else {
        sendWelcomePhoto(chatId, webAppUrl);
    }
} catch (error) {
    console.error('Ошибка:', error);
    bot.sendMessage(userId, 'Произошла ошибка при обработке вашего запроса.');
}
});

// Функция для отправки приветственного фото
function sendWelcomePhoto(chatId, webAppUrl) {
  const photoUrl = 'https://i.ibb.co/rfz1Q9b/Designer-34.jpg'; // URL вашего фото
  const photoCaption = 'Заводи машину!'; // Подпись к фото

  // Отправляем фото вместе с кнопкой "Открыть"
  bot.sendPhoto(chatId, photoUrl, { caption: photoCaption, reply_markup: { inline_keyboard: [[{ text: 'Открыть', url: webAppUrl }]] } });
}

bot.onText(/\/start r_(\d+)/, async (msg, match) => {
  const userId = msg.from.id;
  const referrerId = match[1]; // ID пользователя, который отправил реферальную ссылку
  const webAppUrl = 'https://t.me/minerweb3_bot/app';
  const chatId = msg.chat.id;
    
  const opts = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Открыть', url: webAppUrl }]
      ]
    })
  };

  try {
    // Проверяем, существует ли пользователь в базе данных
    const userQuery = 'SELECT * FROM Balance WHERE telegram_user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    // Проверяем, существует ли уже запись о реферале в таблице referral
    const referralQuery = 'SELECT * FROM referral WHERE telegram_user_id = $1 AND referral_id = $2';
    const referralResult = await pool.query(referralQuery, [userId, referrerId]);
    
    if (userResult.rows.length === 0 && referralResult.rows.length === 0) {
      // Добавляем нового пользователя в базу данных
      await pool.query('INSERT INTO Balance (telegram_user_id, coins) VALUES ($1, $2)', [userId, 100]);

      // Добавляем информацию о реферале в таблицу referral
      await pool.query('INSERT INTO referral (telegram_user_id, referral_id) VALUES ($1, $2)', [userId, referrerId]);

      // Добавляем реферальные бонусы
      await pool.query('UPDATE Balance SET coins = coins + $1 WHERE telegram_user_id = $2', [100, referrerId]);
      await pool.query('UPDATE Balance SET coins = coins + $1 WHERE telegram_user_id = $2', [100, userId]);

      bot.sendMessage(userId, `Вы были приглашены пользователем с ID ${referrerId}. Вам начислено 100 монет за приглашение.`, opts);
    } else {
      bot.sendMessage(userId, 'Эх, сука... Вы уже были приглашены или ранее присоединились.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    bot.sendMessage(userId, 'Произошла ошибка при обработке вашего запроса.');
  }
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
