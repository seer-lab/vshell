const dateformat = require('dateformat');
const fs = require('fs');
const mysql = require('mysql');
const sw = require('stopword');
const { NlpManager } = require('node-nlp');


let connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'vshell'
});

let faqs = [];
let courses = [];
let dates = [];

module.exports = async function trainnlp(manager) {
    // if (fs.existsSync('./model.nlp')) {
    //     manager.load('./model.nlp');
    // }

    connection.connect();
    faqs = await getFAQs();
    //course code regex
    //[A-Z]{3,4}\s?[1-6]{1}[0-9]{3}[U|G]
    courses = await courseInfo();
    dates = await importantDates();


    //debug("classifier null " + (classifier == null));
    //classifier = classifier == null ? new  BayesNLU({ language: 'en' }) : classifier;

    //debug("# faqs : " +faqs.length);
    faqs.forEach(f => {

        let key = f.key;
        let tokens = sw.removeStopwords(f.question.toLowerCase().split(' ')).join(' ');
        manager.addDocument('en', f.question, key);
        manager.addDocument('en',  tokens, key);
        manager.addAnswer('en', key, f.answer);
        // classifier.add(f.question, key);
        // classifier.add(tokens, key);
    });

    //debug("# dates : " +dates.length);
    dates.forEach(d => {
        let key = d.key;

        let startDate = d.start_date.toISOString().substr(0, 10);
        let endDate = d.end_date.toISOString().substr(0, 10);
        manager.addDocument('en', "When is " + d.description, key);
        manager.addDocument('en', "When do " + d.description, key);
        manager.addDocument('en', "When does " + d.description, key);
        manager.addDocument('en', "When  " + d.description, key);

        if (d.key === 'study.week') {
            let readingW = d.description.replace('Study', 'Reading');
            manager.addDocument('en', "When is " + readingW, key);
            manager.addDocument('en', "When do " + readingW, key);
            manager.addDocument('en', "When does " + readingW, key);
            manager.addDocument('en', "When  " + readingW, key);
        }

        //let dateRange = startDate;
        let answer = d.description + " is ";
        startDate = startDate.toString() + 'T00:00:00-0500';
        endDate = endDate.toString() + 'T00:00:00-0500';
        startDate = Date.parse(startDate);
        endDate = Date.parse(endDate);
        if (startDate != endDate) {
            answer += "from " + dateformat(startDate, 'dddd, mmmm dS yyyy') + " to " + dateformat(endDate, 'dddd, mmmm dS yyyy');
        } else {
            answer += "on " + dateformat(startDate, 'dddd, mmmm dS yyyy');
        }
        manager.addAnswer('en', key, answer);

        // classifier.add(d.description, key);
    });

    //debug("# courses : " +courses.length);
    for (const c of courses) {
        let courseCode = c.course_code;
        let prereqs = await coursePrereqs(courseCode);
        let prereqFor = await findCoursesByPrereq(courseCode);

        let courseName = c.course_name;
        let courseDescription = c.description;

        manager.addDocument('en', "What is " + courseCode, courseCode + ".desc");
        manager.addDocument('en', courseCode, courseCode + ".desc");
        manager.addDocument('en', "What is the course code for " + courseName, courseCode + ".code");
        manager.addDocument('en', "course code for " + courseName, courseCode + ".code");

        manager.addAnswer('en',  courseCode + ".desc", courseName + " - " + courseDescription);
        manager.addAnswer('en',  courseCode + ".code", "The code for " + courseName + " is " + courseCode);


        // Find prerequisites
        let keyPrereq = courseCode + ".prereq";
        let answerPrereq = courseName + " ("  + courseCode + ") has no prerequisites.";

        let isUpperYear = courseCode.match('[3-4]{1}[0-9]{3}[U|G]') != null;
        if (prereqs && prereqs.length) {

            manager.addDocument('en', "What is the prerequisite for " + courseCode, keyPrereq);
            manager.addDocument('en', "What is the prerequisite for " + courseName, keyPrereq);
            manager.addDocument('en', "What classes do I need to take " + courseCode, keyPrereq);
            manager.addDocument('en', "What classes do I need to take " + courseName, keyPrereq);

            answerPrereq = "The prerequisites for " + courseName + " ("  + courseCode + ") are:\n";
            prereqs.forEach(p => {
                let prereqCode = p.course_code;
                let prereqName = p.course_name;

                if (prereqs.indexOf(p)) {
                    answerPrereq += " and "
                }
                answerPrereq += prereqName + " (" + prereqCode + ")";
            });
        } else if (isUpperYear) {
            // is upper year, but not specific prerequisites
        }
        manager.addAnswer('en', keyPrereq, answerPrereq);

        // Find if this course is a prerequisite for any other courses
        let keyPrereqReverse = courseCode + ".prereqOf";
        manager.addDocument('en', "What is " + courseCode + " a prerequisite for", keyPrereqReverse);
        manager.addDocument('en', "What classes need " + courseCode, keyPrereqReverse);

        manager.addDocument('en', "What is " + courseName + " a prerequisite for", keyPrereqReverse);
        manager.addDocument('en', "What classes need " + courseName, keyPrereqReverse);

        let answerPrereqReverse = courseName + " ("  + courseCode + ") is not a prerequisite for any course.";

        if (prereqFor && prereqFor.length) {
            answerPrereqReverse =  courseName + " ("  + courseCode + ") is a prerequisite for:\n";

            prereqFor.forEach(p => {
                let prereqCode = p.course_code;
                let prereqName = p.course_name;

                if (prereqFor.indexOf(p)) {
                    answerPrereqReverse += " and "
                }
                answerPrereqReverse += prereqName + " (" + prereqCode + ")";
            });
        }
        manager.addAnswer('en', keyPrereqReverse, answerPrereqReverse);
    }

    await manager.train();

    //debug(classifier.getBestClassification("what is gpa"));

    await manager.save('./model.nlp', true);
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

function courseInfo() {
    return new Promise(function(resolve, reject) {
        let q = "SELECT c.* FROM course_info c where active = true";

        connection.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function coursePrereqs(coursecode) {
    return new Promise(function(resolve, reject) {
        //let q = "SELECT c.*, '' as prereqs FROM course_info c where active = true";
        let q = "select c.course_code, c.course_name from course_info c " +
            " INNER JOIN course_prerequisite p " +
            " ON c.course_code = p.prereq_id AND p.course_id = '" + coursecode + "'";

        connection.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function findCoursesByPrereq(coursecode) {
    return new Promise(function(resolve, reject) {
        let q = "select c.course_code, c.course_name  from course_info c " +
            "        INNER JOIN  course_prerequisite p ON c.course_code = p.course_id AND p.prereq_id = '" + coursecode + "'";

        connection.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}