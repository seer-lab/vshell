
const bodyParser = require('body-parser');
const csv = require('fast-csv');
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql');
const path = require('path');
const request = require('request');


const app = express();
const port = process.env.PORT || 3000;
// const upload = multer({dest: 'tmp/uploads'});

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static('public'));

// views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


const CSV_MIMETYPE = 'text/csv';

require('dotenv').config();

let connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    port     : process.env.DB_PORT || 3306,
    user     : process.env.DB_USER,
    password : process.env.DB_PW,
    database : process.env.DB_NAME
});

// const asyncMiddleware = fn => (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
// };

const multerConfig = {
    storage: multer.diskStorage({
        destination: function (req, file, next) {
            next(null, 'tmp/uploads');
        },
        filename: function (req, file, next) {
            const fileExt = file.mimetype.split('/')[1];
            next(null, file.fieldname + '-' + Date.now() + '.' + fileExt);
        }
    }),
    filter: function (req, file, next) {
        if (!file) {
            next();
        }
        const isCSV = file.mimetype.includes('csv');
        if (isCSV) {
            next(null, true);
        } else {
            console.log("File not supported");
            return next();
        }
    }
};
const upload = multer(multerConfig);


app.get('/', function (req, res) {
    res.render('index');
});

app.post('/upload', upload.single('date_upload'), function (req, res) {
    let fileRows = [];
    if (req.file) {
        console.log('file!!!!!' + req.file);

        csv.parseFile(req.file.path)
            .on('error', error => console.error(error))
            .on('data', data => fileRows.push(data))
            .on('end', function () {
                try {
                    updateDates(fileRows)
                } catch (e) {
                    console.log(e)
                }

                fs.unlinkSync(req.file.path);   // remove temp file
                res.redirect('/')
            });
    } else {
        console.log("No file selected");
        res.redirect('/')
    }
});

app.listen(port, function () {
    console.log(`Server listening on ${port}`);
});

function updateDates(postData) {
    console.log(`ghost: ${process.env.HOST}`);
    console.log(JSON.stringify(postData));
    let options = {
        uri: `${process.env.HOST}/updateImportantDates`,
        body: JSON.stringify(postData),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    request(options, function (error, response) {
        if (response) {
            console.log(error, response.body);
        }
        console.log(error);
        return error;
    });

    return true;
}


async function getActiveDates() {
    return new Promise(function(resolve, reject) {
        let q = 'SELECT * FROM important_dates i where i.active = true';
        connection.query(q, function (err, results, fields) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}