const sw = require('stopword');

const aBuild = require('./answerBuilder');
const qBuild = require('./questionBuilder');

let db = null;
let faqs = [];
let courses = [];
let dates = [];

module.exports = async function trainnlp(manager, dataSource) {
    // if (fs.existsSync('./model.nlp')) {
    //     manager.load('./model.nlp');
    // }
    if (db == null) {
        db = dataSource;
    }

    db.connect();
    faqs = await getFAQs();
    //course code regex
    //[A-Z]{3,4}\s?[1-6]{1}[0-9]{3}[U|G]
    courses = await courseInfo();
    dates = await loadImportantDates();

    faqs.forEach(f => {
        let key = f.key;
        let tokens = sw.removeStopwords(f.question.split(' ')).join(' ');
        manager.addDocument('en', f.question, key);
        manager.addDocument('en',  tokens, key);
        manager.addAnswer('en', key, f.answer);
    });

    for (let d of dates) {
        let documents = qBuild.buildDateQs(d);

        await documents.forEach(q => {
            manager.addDocument(q[0], q[1], q[2]);
        });
    }

    for (let c of courses) {
        let courseCode = c.course_code;
        // Find prerequisites for course
        let prereqs = await coursePrereqs(courseCode);
        // Find if this course is a prerequisite for any other courses
        let prereqFor = await findCoursesByPrereq(courseCode);
        let hasPrereqs = prereqs != null && prereqs.length > 0;
        let isAPreqreq = prereqFor != null && prereqFor.length > 0;

        let documents = qBuild.buildCourseQs(c, hasPrereqs, isAPreqreq);
        let answers = aBuild.buildCourseAs(c, prereqs);

        await documents.forEach(q => {
            manager.addDocument(q[0], q[1], q[2]);
        });

        await answers.forEach(a => {
            manager.addAnswer(a[0], a[1], a[2]);
        });
    }

    await manager.train();
    await manager.save('./model.nlp', true);
};

function getFAQs() {
    return new Promise(function(resolve, reject) {
        db.query('SELECT * FROM `faq`', function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function loadImportantDates() {
    return new Promise(function(resolve, reject) {
        let q = 'SELECT * FROM important_dates i where i.active = true';
        db.query(q, function (err, results, fields) {
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

        db.query(q, function (err, results, fields) {
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

        db.query(q, function (err, results, fields) {
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

        db.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}