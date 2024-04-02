// This is a basic program on JavaScript
//
// Try to modify and run it and check out
// the output in the terminal below
//
// Happy coding! :-)

const TelegramBot = require('node-telegram-bot-api')

const token = '7168048896:AAGc2xd799o8ISeVv3Rg_Am2lLO1PUXfGp0'

const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = 'https://t.me/firstchuv_bot/chuvtestv2';

  const opts = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Открыть Web App', web_app: { url: webAppUrl } }]
      ]
    })
  };

  bot.sendMessage(chatId, 'Жми скорее! CLO ждет!!!', opts);
});

console.log('Бот запущен..');

bot.onText(/\/echo (.+)/, (msg, match) => {

	const chatId = msg.chat.id
	const resp = match[1]

	bot.sendMessage(chatId, resp)
})

'use strict';

console.log('Hello, World!');
