
const df = require('dateformat');
const { NlpManager } = require('node-nlp');
const mysql = require('mysql');
const sw = require('stopword');

const threshold = 0.25;
const trainedModel = '/model.nlp';

let connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    port     : process.env.DB_PORT || 3306,
    user     : process.env.DB_USER,
    password : process.env.DB_PW,
    database : process.env.DB_NAME
});

const answers = {
    DATE : '{description} is {sdate}',
    DATE_RANGE : '{description} is {sdate} to {edate}',
};
const questionType = {
    COURSE : 'course',
    DATE : 'date',
    GENERAL : 'faq'
};

let manager;

module.exports = async function NaturalAnswerHandleWhenr(input, nlpManager) {
    manager = nlpManager;

    let result = await processInput(input);
    let answer = null;
    let type = result.intent.substr(0, result.intent.indexOf('.'));
    let intent = result.intent.replace(`${type}.`, '');

    switch (type) {
        case questionType.DATE:
            let results = await queryDate(intent);
            if (results && results.length > 0) {
                answer = getDateAnswer(results[0]);
            }
            break;
        default:
            // load answer from trained module
            answer = result.answer ? result.answer : answer;
            break;
    }

    return answer;
};

async function processInput(input) {
    let tokens = sw.removeStopwords(input.split(' '));

    let exactResult = await manager.process(input);
    let tokenizedResult = await manager.process(tokens.join(' '));

    let finalResult = null;
    if ((exactResult.score >= threshold && exactResult.intent !== 'None') && (tokenizedResult.score >= threshold && tokenizedResult.intent !== 'None')) {
        if (exactResult.sentiment.vote !== 'neutral' && tokenizedResult.sentiment.vote !== 'neutral') {
            finalResult = exactResult.score >= tokenizedResult.score ? exactResult : tokenizedResult;
        } else if (exactResult.sentiment.vote !== 'neutral') {
            finalResult = exactResult;
        } else {
            finalResult = tokenizedResult;
        }
    } else if ((exactResult.score >= threshold) && exactResult.intent !== 'None') {
        finalResult = exactResult;
    } else if ((tokenizedResult.score >= threshold) && tokenizedResult.intent !== 'None') {
        finalResult = tokenizedResult
    }

    return finalResult;
}

function queryDate(intent) {
    let today = new Date();
    let year = df(today, 'yyyy');
    let month = parseInt(df(today, 'mm'));

    let semesterCode = month < 4 ? 'w' : month < 9 ? 's' : 'f';

    return new Promise(function(resolve, reject) {
        let q = `SELECT * FROM important_dates i WHERE i.year = '${year}' 
                                  AND i.semester = '${semesterCode}' 
                                  AND i.key = '${intent}' AND i.active = true`;
        connection.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function getDateAnswer(d) {
    let answer = null;
    if (d) {
        let startDate = df(d.start_date, 'dddd, mmmm dS yyyy');
        let endDate = df(d.end_date, 'dddd, mmmm dS yyyy');

        answer = startDate == endDate ? answers.DATE : answers.DATE_RANGE;
        answer = answer.replace('{description}', d.description).replace('{sdate}', startDate).replace('{edate}', endDate);
    }

    return answer;
}