require('dotenv').config();

let DEBUG = process.env.DEBUG;
module.exports = function() {

    this.debug = function(message) {
        if (DEBUG) {
            console.log(message);
        }
    };
    this.say = function(message) {
        console.log(message);
    };
};
