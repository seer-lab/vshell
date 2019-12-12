
class Error {
    constructor() {
        this.message = "Something went wrong";
    }

    badQuestion(classObj, e) {
        this.message = "Sorry, I don't understand your question"
    }

    noAnswer() {
        this.message = "Sorry, I don't have an answer for your question"
    }
}

