const fs = require('fs');
const mysql = require('mysql');
const sw = require('stopword');
const { BayesNLU, NlpManager } = require('node-nlp');


let connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'vshell'
});

let faqs = [];
let dates = [];

module.exports = async function trainnlp(manager, classifier) {
    // if (fs.existsSync('./model.nlp')) {
    //     manager.load('./model.nlp');
    // }

    connection.connect();
    faqs = await getFAQs();
    dates = await importantDates();
    // getFAQs().then(function(rows) {
    //     if (rows && rows.length > 0) {
    //         faqs = rows.filter(faq => faq != null);
    //     }
    //     debug(".")
    // }).catch((err) => setImmediate(() => { throw err; }));

    // importantDates().then(function(rows) {
    //     if (rows && rows.length > 0) {
    //         dates = rows.filter(faq => faq != null);
    //     }
    //     debug("..")
    // }).catch((err) => setImmediate(() => { throw err; }));

    debug("classifier null " + (classifier == null));
    classifier = classifier == null ? new  BayesNLU({ language: 'en' }) : classifier;

    debug("# faqs : " +faqs.length)
    faqs.forEach(f => {

        let key = f.key;
        let tokens = sw.removeStopwords(f.question.toLowerCase().split(' ')).join(' ');
        manager.addDocument('en', f.question, key);
        manager.addDocument('en',  tokens, key);
        manager.addAnswer('en', key, f.answer);
        classifier.add(f.question, key);
        classifier.add(tokens, key);
    });

    // manager.addDocument('en', 'book appointment', 'appointment.book');
    // manager.addDocument('en', 'make appointment', 'appointment.book');
    // manager.addDocument('en', 'schedule appointment', 'appointment.book');
    // manager.addDocument('en', 'book Shelly', 'appointment.book');
    //
    // manager.addDocument('en', 'Where is Shelly\'s office', 'appointment.location');
    // manager.addDocument('en', 'Shelly\'s office', 'appointment.location');
    // manager.addDocument('en', 'advisor office', 'appointment.location');
    //
    // manager.addAnswer('en', 'appointment.book', 'You can book an appointment online at https://shellywindsor1.youcanbook.me/');
    // manager.addAnswer('en', 'appointment.location', 'Shelly\'s office is UA 4013');

    await classifier.train();

    debug(classifier.getBestClassification("what is gpa"));
    manager.save('./model.nlp', true);

};

function getFAQs() {
    return new Promise(function(resolve, reject) {
        connection.query('SELECT * FROM `faq`', function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function importantDates(keys) {
    return new Promise(function(resolve, reject) {
        let q = 'SELECT * FROM `important_dates`';
        if (keys != null && keys.length) {
            q += ' WHERE description like ;';
            keys.forEach(key => {
                q += `'${key}%' OR `
            });

            q = q.substr(0, q.lastIndexOf("OR"));
        }
        connection.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}