#!/usr/bin/env node
const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");

const sw = require('stopword');


require('dotenv').config();
require("../resources/logger")();


//const { BayesNLU, NlpManager } = require('node-nlp');
const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['en'], nlu: { log: false }});
//const classifier = new BayesNLU({ language: 'en' });

const trainnlp = require('./train');

const threshold = 0.25;

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

    //await trainnlp(manager, classifier);
    trainnlp(manager);
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
            filter: function(val) {
                return (val === "Yes")
            }
        }, {
            type: "list",
            name: "NEWQ",
            message: "Ask another question?",
            choices: ["Yes", "No"],
            filter: function(val) {
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

const findAnswer = async (line) => {
        let tokens = sw.removeStopwords(line.split(' '));

        debug('tokens: ' + tokens.join(' '));

        const exactResult = await manager.process(line);
        const result = await manager.process(tokens.join(' '));

        debug('score: ' + result.score);

    return [exactResult, result];
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

    const results = await findAnswer(input);
    const exact = results[0];
    const result = results[1];

    let out = "notfound";
    if ((exact.score >= threshold && exact.answer) && (result.score >= threshold && result.answer)) {
        if (exact.sentiment.vote !== 'neutral' && result.sentiment.vote !== 'neutral') {
            out = exact.score >= result.score ? exact.answer : result.answer
        } else if (exact.sentiment.vote !== 'neutral') {
            out = exact.answer;
        } else {
            out = result.answer;
        }
    }
    else if ((exact.score >= threshold) && exact.answer) {
        out = exact.answer
    } else if ((result.score >= threshold) && result.answer) {
        out = result.answer
    }

    debug("exactRes.an="+ exact.answer);
    debug("result.an="+ result.answer);

    say(`vshell> ${out}`);

    // if (result.answer && result.sentiment.vote === 'neutral') {
    //     answers = await askQuestions(1);
    //     let {CONFIRM} = answers;
    //
    //     if (CONFIRM) {
    //         debug('addDocument');
    //         manager.addDocument('en', input, result.intent);
    //         manager.save('./model.nlp', true);
    //     }
    // }
    if (result.sentiment){
        debug(`      > ${result.sentiment.vote}   (${result.sentiment.score})`);
    }


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
//         const result = await manager.process(tokens.join(' '));
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
//     await trainnlp(manager);
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
