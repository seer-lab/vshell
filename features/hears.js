/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
module.exports = function(controller) {

    controller.hears(  ['hello', 'hi', 'greetings', 'hey'],
        ['direct_mention', 'mention', 'direct_message'],
        async (bot,message) => {
           await bot.reply(message,'Hello, how can I assist you today?');
        }
    );

    controller.hears(async(message) => message.text && message.text.toLowerCase() === 'where can i book an appointment?',
        ['direct_message'], async (bot, message) => { await bot.reply(message, 'You can book an appointment https://shellywindsor1.youcanbook.me/');
    });

    controller.hears(async(message) => message.text && message.text.toLowerCase() && (message.text.toLowerCase().indexOf('program') > 1 && message.text.toLowerCase().indexOf('review') > 1),
            ['direct_message'], async (bot, message) => {
        await bot.reply(message, 'For a program review, please book an appointment https://shellywindsor1.youcanbook.me/');
    });

};