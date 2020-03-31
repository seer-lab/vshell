/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const bot =require('../bot');
const manager = bot.manager;
const NaturalAnswerHandler = require('../handlers/naturalAnswer');

module.exports = function(controller) {

    controller.hears(  ['hello', 'hi', 'greetings', 'hey'],
        ['direct_mention', 'mention', 'direct_message'],
        async (bot,message) => {
           await bot.reply(message,'Hello, how can I assist you today?');
        }
    );

    controller.hears(async(message) => message.text != null && message.text.trim() !== '', ['direct_message'], async (bot, message) => {
        let answer = "I'm sorry, I did not understand what you were trying to ask.";

        try {
            answer = await NaturalAnswerHandler(message, manager);
        } catch (e) {
            console.log(e);
        }

        await bot.reply(message, answer);
    });

};