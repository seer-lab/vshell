const { NlpManager } = require('node-nlp');
const bot = require('../bot');
const crypto = require('crypto');
const mysql = require('mysql');
const sw = require('stopword');
const qBuild = require('../handlers/questionBuilder');

let manager = bot.manager;


let connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    port     : process.env.DB_PORT || 3306,
    user     : process.env.DB_USER,
    password : process.env.DB_PW,
    database : process.env.DB_NAME
});

module.exports = function(controller) {
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
        console.log('updating important dates!');
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
            let documents = qBuild.buildCourseQs(c);

            // remove from NLP manager
            await documents.forEach(q => {
                manager.removeDocument(q[0], q[1], q[2]);
            });
        }
        // deactivate current dates
        await deactivateCourses();

        // add new dates
        await addCourses(courses);
        // add to NLP manager
        for (let c of courses) {
            let documents = qBuild.buildCourseQs(c);

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


/* COURSE QUERIES */
async function addCourses(courses) {
    return new Promise(function(resolve, reject) {
        let q = 'INSERT INTO course_info (course_code, course_name, `description`) VALUES ';
        courses.forEach(c => {
            let k = courses.indexOf(c) === courses.length - 1 ?  ';' : ',';
            q += `(${c[0]}, '${c[1]}', '${c[2]}')${k}`;
        });

        connection.query(q, function (err, results, fields) {
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

        connection.query(q, function (err, results, fields) {
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

        connection.query(q, function (err, results, fields) {
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
        let q = 'INSERT INTO important_dates (year, semester, start_date, end_date, description, `key`) VALUES ';
        dates.forEach(d => {
            let k = dates.indexOf(d) === dates.length - 1 ?  ';' : ',';
            let key = crypto.createHash('md5').update(d[4]).digest("hex");
            q += `(${d[0]}, '${d[1]}', '${d[2]}', '${d[3]}', '${d[4]}', '${key}')${k}`;
        });
        connection.query(q, function (err, results, fields) {
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

        connection.query(q, function (err, results, fields) {
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

        connection.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}


