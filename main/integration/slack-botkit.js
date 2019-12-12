"use strict";

let BotKit = require('botkit');

module.exports = SlackBotkit;

let VShell = BotKit.slackbot({
    debug: false,
    storage: undefined
});

function SlackBotkit(token) {
    this.scopes = [
        'direct_mention',
        'direct_message',
        'mention'
    ];

    // if we haven't defined a token, get the token from the session variable.
    if (Bot.token == undefined) {
        this.token = token;
    }
}

SlackBotkit.prototype.listen = function() {
    console.log('TOKEN: ' + this.token);
    this.bot = Bot.spawn({
        token: this.token
    }).startRTM();
    return this;
}

SlackBotkit.prototype.hear = function(pattern, callback) {
    Bot.hears(pattern, this.scopes, callback);
    return this;
};