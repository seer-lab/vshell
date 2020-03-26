

function buildCourseAs(c, prereqs, prereqFor) {
    let as = [];
    let courseCode = c.course_code;
    let courseName = c.course_name;
    let courseDescription = c.description;
    let hasPrereqs = prereqs && prereqs.length > 0;
    let isAPrereq = prereqFor && prereqFor.length > 0;

    as.push(['en',  courseCode + ".desc", courseName + " - " + courseDescription]);
    as.push(['en',  courseCode + ".code", "The code for " + courseName + " is " + courseCode]);

    // Prerequisites
    let keyPrereq = courseCode + ".prereq";
    let answerPrereq = courseName + " ("  + courseCode + ") has no prerequisites.";
    if (hasPrereqs) {
        answerPrereq = "The prerequisites for " + courseName + " ("  + courseCode + ") are:\n";
        prereqs.forEach(p => {
            let prereqCode = p.course_code;
            let prereqName = p.course_name;

            if (prereqs.indexOf(p)) {
                answerPrereq += " and "
            }
            answerPrereq += prereqName + " (" + prereqCode + ")";
        });
    }
    as.push(['en', keyPrereq, answerPrereq]);

    // Prerequisites Reverse
    let keyPrereqReverse = courseCode + ".prereqOf";
    let answerPrereqReverse = courseName + " ("  + courseCode + ") is not a prerequisite for any course.";
    if (isAPrereq) {
        // Course is a perquisite for
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
    as.push(['en', keyPrereqReverse, answerPrereqReverse]);

    return as;
}

module.exports = {
    buildCourseAs: buildCourseAs
};