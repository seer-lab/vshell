const bot = require('../bot');
const crypto = require('crypto');
const sw = require('stopword');

const aBuild = require('../handlers/answerBuilder');
const qBuild = require('../handlers/questionBuilder');

const db = bot.db;
const manager = bot.manager;


module.exports = function(controller) {
    controller.webserver.post('/addFAQs', (req, res) => {
        console.log('updating FAQ!');
        let result = false;
        if (req.body) {
            result = processFAQs(req.body);
        } else {
            console.log('got nothing');
        }
        res.send(result);
    });

    controller.webserver.post('/updateImportantDates', (req, res) => {
        console.log('updating important dates!');
        let result = false;
        if (req.body) {
            result = processDates(req.body);
        } else {
            console.log('got nothing');
        }
        res.send(result);
    });

    controller.webserver.post('/updateCourseInformation', (req, res) => {
        console.log('updating course info!');
        let result = false;
        if (req.body) {
            result = processCourses(req.body);
        } else {
            console.log('got nothing');
        }
        res.send(result);
    });
};

async function processCourses(courses) {
    try {
        // get current active dates to remove from NLP manager
        let curCourses = await getActiveCourses();

        for (let c of curCourses) {
            let courseCode = c.course_code;
            let prereqs = await getCoursePrereqs(courseCode);
            let prereqFor = await findCoursesByPrereq(courseCode);

            let documents = qBuild.buildCourseQs(c);
            let answers = aBuild.buildCourseAs(c, prereqs, prereqFor);

            // remove from NLP manager
            await documents.forEach(q => {
                manager.removeDocument(q[0], q[1], q[2]);
            });
            await answers.forEach(a => {
                manager.removeAnswer(a[0], a[1], a[2]);
            });
        }
        // deactivate current courses
        await deactivateCourses();
        await deactivateCoursesPrereqs();

        // add new courses
        await addCourses(courses);
        await addCourses(pr);

        for (let c of courses) {
            let courseCode = c[0];
            let prereqCodes = null;
            try {
                prereqCodes = c[3].split('|')
            } catch (e) {
                console.log(e);
            }
            await addCoursePrerequisites(courseCode, prereqCodes);
        }

        // add to NLP manager
        curCourses = await getActiveCourses();
        for (let c in curCourses) {
            let courseCode = c.course_code;
            let prereqs = await getCoursePrereqs(courseCode);
            let prereqFor = await getCoursesByPrereq(courseCode);

            let documents = qBuild.buildCourseQs(c);
            let answers = aBuild.buildCourseAs(c, prereqs, prereqFor);

            await documents.forEach(q => {
                manager.addDocument(q[0], q[1], q[2]);
            });
            await answers.forEach(a => {
                manager.addAnswer(a[0], a[1], a[2]);
            });
        }

        // retrain
        await manager.train();

        return true;
    } catch (e) {
        return false;
    }
}

async function processDates(dates) {
    try {
        // get current active dates to remove from NLP manager
        let curDates = await getActiveDates();
        for (let d of curDates) {
            let documents = qBuild.buildDateQs(d);

            // remove from NLP manager
            await documents.forEach(q => {
                manager.removeDocument(q[0], q[1], q[2]);
            });
        }
        // deactivate current dates
        await deactivateDates();

        // add new dates
        await addDates(dates);
        // add to NLP manager
        for (let d of dates) {
            let documents = qBuild.buildDateQs(d);

            // remove from NLP manager
            await documents.forEach(q => {
                manager.addDocument(q[0], q[1], q[2]);
            });
        }

        // retrain
        await manager.train();

        return true;
    } catch (e) {
        return false;
    }
}

async function processFAQs(faqs) {
    try {
        let faqsWKey = [];
        for (let f of faqs) {
            let key = crypto.createHash('md5').update(f[4]).digest("hex");
            faqsWKey.push([f[0], f[1], key]);
        }
        await addFAQs(faqsWKey);

        faqsWKey.forEach(f => {
            let question = f[0];
            let answer = f[1];
            let key = f[2];
            let tokens = sw.removeStopwords(question.split(' ')).join(' ');

            manager.addDocument('en', question, key);
            manager.addDocument('en', tokens, key);
            manager.addAnswer('en', key, answer);
        });

    } catch (e) {
        return false;
    }
}

/* COURSE QUERIES */
async function addCourses(courses) {
    return new Promise(function(resolve, reject) {
        let q = 'INSERT INTO course_info (course_code, course_name, `description`) VALUES ';
        courses.forEach(c => {
            let k = courses.indexOf(c) === courses.length - 1 ?  ';' : ',';
            q += `(${c[0]}, '${c[1]}', '${c[2]}')${k}`;
        });

        db.query(q, function (err, results, fields) {
            if (err) {
                console.log(err);
                return reject(err);
            }
            resolve(results);
        });
    });
}

async function addCoursePrerequisites(courseCode, prereqCodes) {
    return new Promise(function(resolve, reject) {
        let q = 'INSERT INTO course_prerequisite (course_id, prereq_id) VALUES ';
        prereqCodes.forEach(prereqCode => {
            let k = prereqCodes.indexOf(prereqCode) === prereqCodes.length - 1 ?  ';' : ',';
            q += `(${courseCode}, '${prereqCode}')${k}`;
        });

        db.query(q, function (err, results, fields) {
            if (err) {
                console.log(err);
                return reject(err);
            }
            resolve(results);
        });
    });
}

async function deactivateCourses() {
    return new Promise(function(resolve, reject) {
        let q = 'UPDATE course_info c SET c.active = false WHERE c.active = true;';

        db.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

async function deactivateCoursesPrereqs() {
    return new Promise(function(resolve, reject) {
        let q = 'UPDATE course_prerequisite c SET c.active = false WHERE c.active = true;';

        db.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

async function getActiveCourses() {
    return new Promise(function(resolve, reject) {
        let q = 'SELECT * FROM course_info c WHERE c.active = true;';

        db.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function getCoursePrereqs(coursecode) {
    return new Promise(function(resolve, reject) {
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

function getCoursesByPrereq(coursecode) {
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


/* DATE QUERIES */
async function addDates(dates) {
    return new Promise(function(resolve, reject) {
        let q = 'INSERT INTO important_dates (year, semester, start_date, end_date, `description`, `key`) VALUES ';
        dates.forEach(d => {
            let k = dates.indexOf(d) === dates.length - 1 ?  ';' : ',';
            let key = crypto.createHash('md5').update(d[4]).digest("hex");
            q += `(${d[0]}, '${d[1]}', '${d[2]}', '${d[3]}', '${d[4]}', '${key}')${k}`;
        });
        db.query(q, function (err, results, fields) {
            if (err) {
                console.log(err);
                return reject(err);
            }
            resolve(results);
        });
    });
}

async function deactivateDates() {
    return new Promise(function(resolve, reject) {
        let q = 'UPDATE important_dates i SET i.active = false WHERE i.active = true;';

        db.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

async function getActiveDates() {
    return new Promise(function(resolve, reject) {
        let q = 'SELECT * FROM important_dates i WHERE i.active = true;';

        db.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}


/* FAQ QUERIES */
async function addFAQs(faqs) {
    return new Promise(function(resolve, reject) {
        let q = 'INSERT INTO faq (question, answer, `key`) VALUES ';
        faqs.forEach(f => {
            let k = faqs.indexOf() === faqs.length - 1 ?  ';' : ',';
            q += `(${f[0]}, '${f[1]}', '${key}')${k}`;
        });

        db.query(q, function (err, results, fields) {
            if (err) {
                console.log(err);
                return reject(err);
            }
            resolve(results);
        });
    });
}

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