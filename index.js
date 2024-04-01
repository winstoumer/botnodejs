// This is a basic program on JavaScript
//
// Try to modify and run it and check out
// the output in the terminal below
//
// Happy coding! :-)

const TelegramBot = require('node-telegram-bot-api')

const token = 'YOUR_TELEGRAM_BOT_TOKEN'

const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/echo (.+)/, (msg, match) => {

	const chatId = msg.chat.id
	const resp = match[1]

	bot.sendMessage(chatId, resp)
})

'use strict';

console.log('Hello, World!');
