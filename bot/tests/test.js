#!/usr/bin/env node
const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const mysql = require('mysql');


require('dotenv').config();
require("../resources/logger")();


//const { BayesNLU, NlpManager } = require('node-nlp');
const {NlpManager} = require('node-nlp');
const testManager = new NlpManager({languages: ['en'], nlu: {log: false}});
const NaturalAnswerHandler = require('../handlers/naturalAnswer');
//const classifier = new BayesNLU({ language: 'en' });

const trainnlp = require('../handlers/train');
const db = mysql.createConnection({
    host     : process.env.DB_HOST,
    port     : process.env.DB_PORT || 3306,
    user     : process.env.DB_USER,
    password : process.env.DB_PW,
    database : process.env.DB_NAME
});

//const threshold = 0.25;

const inputs = [];

const init = async () => {
    console.clear();
    console.log(
        chalk.green(
            figlet.textSync("vshell", {
                font: "Ghost",
                horizontalLayout: "default",
                verticalLayout: "default"
            })
        )
    );
    debug("DEBUG MODE ENABLED");

    //await trainnlp(testManager, classifier);
    trainnlp(testManager, db);
    await run();
};

const askQuestions = (i) => {
    const questions = [
        {
            name: "input",
            type: "input",
            message: "How can I assist you today?"
        }, {
            type: "list",
            name: "CONFIRM",
            message: "What this what you were looking for?",
            choices: ["Yes", "No"],
            filter: function (val) {
                return (val === "Yes")
            }
        }, {
            type: "list",
            name: "NEWQ",
            message: "Ask another question?",
            choices: ["Yes", "No"],
            filter: function (val) {
                return (val === "Yes")
            }
        }
    ];
    return inquirer.prompt(i != null ? questions[i] : questions);
};

const exit = (code) => {
    console.clear();
    console.log("exiting...");
    process.exit(code);
};

const run = async () => {
    // ask questions
    let answers = await askQuestions(0);
    let {input} = answers;


    // if (inputs.length === 0) {
    //
    // }
    inputs.push(input);

    if (input === 'q') {
        exit(0);
    }

    const answer = await NaturalAnswerHandler(input, testManager);
    say(`vshell> ${answer}`);
    // const processedInput = await NaturalAnswerHandler(input, testManager);
    // let result = processedInput[0];
    // let answer = processedInput[1];
    //
    // say(`vshell> ${answer}`);
    //
    // if (resulWhat t.answer && result.sentiment.vote === 'neutral' && result.sentiment.score < threshold) {
    //     answers = await askQuestions(1);
    //     let {CONFIRM} = answers;
    //
    //     if (CONFIRM) {
    //         debug('addDocument');
    //         testManager.addDocument('en', input, result.intent);
    //         testManager.save('./model.nlp', true);
    //     }
    // }
    //
    // if (result.sentiment) {
    //     debug(`      > ${result.sentiment.vote}   (${result.sentiment.score})`);
    // }

    await run();

};

init();

// show success message
// if (response[0] === "error") {
//     console.log(response[1]);
//
// } else {
//     console.log(response[1]);
//
//     answers = await askQuestions(1);
//     let {CONFIRM} = answers;
//
//
//
//
//     console.debug(CONFIRM ? "Glad I could help" : "Sorry");
// }


// say('vshell> How can I assist you today?');
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//     terminal: false,
// });
//
// rl.on('line', async line => {
//     if (line.toLowerCase() === 'quit' || line.toLowerCase() === 'q') {
//         rl.close();
//         exit(0);
//     } else {
//         let tokens = sw.removeStopwords(line.split(' '));
//         //console.log(tokens.join(' '))dean'
//         console.log('filtered: ', tokens.join(' '));
//         const result = await testManager.process(tokens.join(' '));
//         console.log('score', result.score);
//
//         let answer = '';
//         if ((result.score > threshold) && result.answer) {
//             answer = result.answer
//         } else {
//             answer = "Got nuthin ¯\\_(ツ)_/¯";
//         }
//
//         say(`vshell> ${answer}`);
//         say(`      > ${result.sentiment.vote}   (${result.sentiment.score})`);
//
//         if (result.answer && result.sentiment.vote === 'neutral') {
//             // todo: prompt user to see if correct answer
//             say("      > this was a neutral response, eventually i will ask you if this is what you want so i can learn");
//         }
//     }
// });

// const run = async () => {
//     await trainnlp(testManager);
//
//     // ask questions
//     let answers = await askQuestions(0);
//     let {START} = answers;

//     const response = findAnswer(START);
//
//     // show success message
//     if (response[0] === "error") {
//         console.log(response[1]);
//
//
//     } else {
//         console.log(response[1]);
//
//         answers = await askQuestions(1);
//         let {CONFIRM} = answers;
//
//
//         console.log(CONFIRM ? "SHWEET" : "RIP");
//
//     }
//
//
//     answers = await askQuestions(2);
//     let {NEWQ} = answers;
//
//     NEWQ ? run() : exit(0)
// };
