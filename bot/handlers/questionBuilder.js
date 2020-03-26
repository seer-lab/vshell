

/** take course and build NLP manager params
 * [locale, utterance, intent]
 * @param c
 * @returns {[]}
 */
function buildCourseQs(c) {
    let qs = [];
    let courseCode = c.course_code;
    let courseName = c.course_name;
    let courseDescription = c.description;

    qs.push(['en', "What is " + courseCode, courseCode + ".desc"]);
    qs.push(['en', courseCode, courseCode + ".desc"]);
    qs.push(['en', "What is the course code for " + courseName, courseCode + ".code"]);
    qs.push(['en', "course code for " + courseName, courseCode + ".code"]);


    let keyPrereq = courseCode + ".prereq";
    qs.push(['en', "What is the prerequisite for " + courseCode, keyPrereq]);
    qs.push(['en', "What is the prerequisite for " + courseName, keyPrereq]);
    qs.push(['en', "What classes do I need to take " + courseCode, keyPrereq]);
    qs.push(['en', "What classes do I need to take " + courseName, keyPrereq]);


    let keyPrereqReverse = courseCode + ".prereqOf";
    qs.push(['en', "What is " + courseCode + " a prerequisite for", keyPrereqReverse]);
    qs.push(['en', "What classes need " + courseCode, keyPrereqReverse]);
    qs.push(['en', "What is " + courseName + " a prerequisite for", keyPrereqReverse]);
    qs.push(['en', "What classes need " + courseName, keyPrereqReverse]);
    
    return qs;
}


/** take date and build NLP manager params
 * [locale, utterance, intent]
 * @param d
 * @returns {[]}
 */
function buildDateQs(d) {
    let qs = [];
    
    let key = 'date.' + d.key;
    qs.push(['en', "When is " + d.description, key]);
    qs.push(['en', "When do " + d.description, key]);
    qs.push(['en', "When does " + d.description, key]);
    qs.push(['en', "When " + d.description, key]);

    if (d.description.toLowerCase().includes('study') && d.start_date != d.end_date) {
        let readingW = d.description.replace('Study', 'Reading');
        qs.push(['en', "When is " + readingW, key]);
        qs.push(['en', "When do " + readingW, key]);
        qs.push(['en', "When does " + readingW, key]);
        qs.push(['en', "When  " + readingW, key]);
    } else if (d.description.toLowerCase().includes('examination')) {
        let exams = d.description.replace('examination', 'exam').replace('period', '');
        qs.push(['en', "When is " + exams, key]);
        qs.push(['en', "When are " + exams, key]);
        qs.push(['en', "When do " + exams, key]);
        qs.push(['en', "When does " + exams, key]);
        qs.push(['en', "When  " + exams, key]);
    }
    
    
    
    return qs;
}

module.exports = {
    buildCourseQs: buildCourseQs,
    buildDateQs: buildDateQs
};


