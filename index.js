// This is a basic program on JavaScript
//
// Try to modify and run it and check out
// the output in the terminal below
//
// Happy coding! :-) xy

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

app.get('/api/json-x/tonconnect-manifest.json', async (req, res) => {
  try {
    // Асинхронная функция для получения данных
    const data = await fetchData();

    // Отправка JSON данных в ответ на запрос
    res.json(data);
  } catch (error) {
    // Если произошла ошибка, отправляем статус 500 (Внутренняя ошибка сервера)
    res.status(500).json({ error: error.message });
  }
});

// Асинхронная функция для получения данных
async function fetchData() {
  // Здесь может быть асинхронный код для получения данных
  return {
    "url": "https://miningwebbot.netlify.app",
    "name": "Meencapsule",
    "iconUrl": "https://i.ibb.co/kqdtY34/Untitled.png",
    "termsOfUseUrl": "https://miningwebbot.netlify.app",
    "privacyPolicyUrl": "https://miningwebbot.netlify.app"
  };
}

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

app.get('/api/miners/:telegramUserId', async (req, res) => {
  try {
    const { telegramUserId } = req.params;

    // Получаем майнера пользователя
    const userMinerQuery = `
      SELECT m.*
      FROM miner m
      JOIN user_miner um ON m.miner_id = um.miner_id
      WHERE um.telegram_user_id = $1;
    `;
    const userMinerResult = await pool.query(userMinerQuery, [telegramUserId]);
    const userMiner = userMinerResult.rows[0];

    // Получаем уровень майнера пользователя
    const userMinerLvl = userMiner ? userMiner.lvl : 0;

    // Получаем список всех майнеров, начиная с уровня следующего за уровнем майнера пользователя
    const otherMinersQuery = `
      SELECT m.*
      FROM miner m
      WHERE m.lvl >= $1 AND m.miner_id != $2
      ORDER BY m.lvl;
    `;
    const otherMinersResult = await pool.query(otherMinersQuery, [userMinerLvl + 1, userMiner?.miner_id]);

    // Создаем список майнеров, начиная с майнера пользователя, если он есть
    let miners = [];
    if (userMiner) {
      miners.push(userMiner);
    }

    // Добавляем все остальные майнеры в список
    miners = miners.concat(otherMinersResult.rows);

    // Отправляем клиенту список майнеров
    res.json(miners);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Маршрут для обновления miner_id пользователя
app.put('/api/user_miner/:telegramUserId', async (req, res) => {
    try {
        const { telegramUserId } = req.params;
        const { minerId } = req.body; // Предполагается, что вы отправляете новый minerId в теле запроса

        // Проверяем, существует ли майнер с указанным minerId
        const minerQuery = 'SELECT * FROM miner WHERE miner_id = $1';
        const minerResult = await pool.query(minerQuery, [minerId]);
        if (minerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Miner not found' });
        }

        // Обновляем miner_id пользователя в таблице user_miner
        const updateQuery = 'UPDATE user_miner SET miner_id = $1 WHERE telegram_user_id = $2';
        await pool.query(updateQuery, [minerId, telegramUserId]);

        // Возвращаем успешный ответ
        res.status(200).json({ message: 'Miner updated successfully' });
    } catch (error) {
        console.error('Error updating miner:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/coins_upgrader/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { coins } = req.body;

    // Проверяем наличие userId и coins в теле запроса
    if (!userId || !coins) {
      return res.status(400).json({ error: 'Missing userId or coins in request body' });
    }

    // Обновляем баланс пользователя в таблице Balance
    const result = await pool.query('UPDATE balance SET coins = $1 WHERE telegram_user_id = $2', [coins, userId]);
    if (result.rowCount > 0) {
      return res.status(200).json({ message: 'User balance updated successfully' });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Обработчик запросов GET на /box/:telegramUserId
app.get('/box/:telegramUserId', async (req, res) => {
  const telegramUserId = req.params.telegramUserId;

  try {
    // Выполнение SQL-запроса для получения значения total по telegram user id
    const query = 'SELECT total FROM box WHERE telegram_user_id = $1';
    const { rows } = await pool.query(query, [telegramUserId]);

    // Проверка наличия результатов запроса
    if (rows.length > 0) {
      res.json({ total: rows[0].total });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обработчик запросов POST на /box/:telegramUserId
app.put('/box/:telegramUserId', async (req, res) => {
  const telegramUserId = req.params.telegramUserId;
  const newTotal = req.body.total;

  try {
    // Выполнение SQL-запроса для обновления значения total по telegram user id
    const query = 'UPDATE box SET total = $1 WHERE telegram_user_id = $2';
    await pool.query(query, [newTotal, telegramUserId]);

    res.json({ message: 'Total updated successfully' });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/orders_nft', async (req, res) => {
  const { telegram_user_id, user_ton_address, nft_id, date } = req.body;

  try {
    // Выполнение SQL-запроса для добавления новой записи в таблицу "orders_nft"
    const query = 'INSERT INTO orders_nft (telegram_user_id, user_ton_address, nft_id, date) VALUES ($1, $2, $3, $4)';
    await pool.query(query, [telegram_user_id, user_ton_address, nft_id, date]);

    res.json({ message: 'New order added successfully' });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get refferals count
app.get('/referral/:referralId', async (req, res) => {
  const referralId = req.params.referralId;

  try {
    const query = 'SELECT COUNT(*) AS total_referrals FROM referral WHERE referral_id = $1';
    const { rows } = await pool.query(query, [referralId]);
    const totalReferrals = rows[0].total_referrals;

    res.json({ totalReferrals });
  } catch (error) {
    console.error('Error executing query', error);
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

const token = '6415454027:AAHNRAdzZnI8udkeyNa_HjBCOCo1zn0C_so'

const bot = new TelegramBot(token, { polling: true })

console.log('Бот запущен..');

bot.onText(/\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const webAppUrl = 'https://t.me/meencapsule_bot/app';

  const opts = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Open', url: webAppUrl }]
      ]
    })
  };

  try {
    // Проверяем, существует ли пользователь в базе данных
    const userQuery = 'SELECT * FROM Balance WHERE telegram_user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      // Добавляем нового пользователя в базу данных
      await pool.query('INSERT INTO Balance (telegram_user_id, coins) VALUES ($1, $2)', [userId, 50]);
      //bot.sendMessage(userId, 'Вы получили монет за регистрацию.');
      sendWelcomePhoto(chatId, webAppUrl); // Отправляем приветственное фото с передачей URL
    } else {
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
    //bot.sendMessage(userId, 'Произошла ошибка при обработке вашего запроса.');
  }

  try {
  // Проверяем, существует ли пользователь в таблице Box
  const userQuery = 'SELECT * FROM Box WHERE telegram_user_id = $1';
  const userResult = await pool.query(userQuery, [userId]);

  if (userResult.rows.length === 0) {
    // Добавляем нового пользователя в таблицу Box с total равным 0
    await pool.query('INSERT INTO Box (telegram_user_id, total, date) VALUES ($1, $2, $3)', [userId, 0, new Date()]);
    // Отправляем приветственное сообщение или фото
  } else {
    // Пользователь уже существует в таблице Box
    // Отправляем приветственное сообщение или фото
  }

} catch (error) {
console.error('Ошибка:', error);
  //bot.sendMessage(userId, 'Произошла ошибка при обработке вашего запроса.');
}


  try {
    // Проверяем, существует ли пользователь в базе данных
    const userMinerQuery = 'SELECT * FROM user_miner WHERE telegram_user_id = $1';
    const userMinerResult = await pool.query(userMinerQuery, [userId]);
    
    if (userMinerResult.rows.length === 0) {
        // Добавляем нового пользователя в базу данных
        await pool.query('INSERT INTO user_miner (telegram_user_id, miner_id, date) VALUES ($1, $2, $3)', [userId, 1, new Date()]);
        //bot.sendMessage(userId, 'Вы присоединились к группе майнеров.');
        //sendWelcomePhoto(chatId, webAppUrl); // Отправляем приветственное фото с передачей URL
    } else {
        sendWelcomePhoto(chatId, webAppUrl);
    }
} catch (error) {
    console.error('Ошибка:', error);
    //bot.sendMessage(userId, 'Произошла ошибка при обработке вашего запроса.');
}
});

// Функция для отправки приветственного фото
function sendWelcomePhoto(chatId, webAppUrl) {
  const photoUrl = 'https://i.ibb.co/HFFKN0M/Untitled.png'; // URL вашего фото
  const photoCaption = ''; // Подпись к фото

  // Отправляем фото вместе с кнопкой "Открыть"
  bot.sendPhoto(chatId, photoUrl, { caption: photoCaption, reply_markup: { inline_keyboard: [[{ text: 'Open', url: webAppUrl }]] } });
}

bot.onText(/\/start r_(\d+)/, async (msg, match) => {
  const userId = msg.from.id;
  const referrerId = match[1]; // ID пользователя, который отправил реферальную ссылку
  const webAppUrl = 'https://t.me/meencapsule_bot/app';
  const chatId = msg.chat.id;
    
  const opts = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Open', url: webAppUrl }]
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
      await pool.query('UPDATE Balance SET coins = coins + $1 WHERE telegram_user_id = $2', [10, referrerId]);
      await pool.query('UPDATE Balance SET coins = coins + $1 WHERE telegram_user_id = $2', [10, userId]);

      //bot.sendMessage(userId, `Вы были приглашены пользователем с ID ${referrerId}. Вам начислено 10 монет за приглашение.`, opts);
    } else {
      //bot.sendMessage(userId, 'Эх, сука... Вы уже были приглашены или ранее присоединились.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    //bot.sendMessage(userId, 'Произошла ошибка при обработке вашего запроса.');
  }
});

const path = require('path');
// Указываем Express, чтобы он обслуживал статические файлы из папки 'videos'
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// Эндпоинт для получения списка видеофайлов
app.get('/api/videos', (req, res) => {
  // Получаем список файлов в папке 'videos'
  fs.readdir(path.join(__dirname, 'videos'), (err, files) => {
    if (err) {
      console.error('Error reading video directory:', err);
      return res.status(500).json({ error: 'Failed to read video directory' });
    }
    // Фильтруем только видеофайлы
    const videoFiles = files.filter(file => {
      const fileExtension = path.extname(file).toLowerCase();
      return ['.mp4', '.webm', '.ogg'].includes(fileExtension);
    });
    // Возвращаем список видеофайлов
    res.json({ videos: videoFiles });
  });
});

'use strict';

console.log('Hello, World!');
