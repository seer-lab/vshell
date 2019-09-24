/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
module.exports = function(controller) {

    controller.hears(async(message) => message.text && message.text.toLowerCase() === 'where can i book an appointment?', ['direct_message'], async (bot, message) => {
        await bot.reply(message, 'https://shellywindsor1.youcanbook.me/');
    });

};