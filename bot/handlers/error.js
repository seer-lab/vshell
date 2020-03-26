
class Error {
    constructor() {
        this.message = "Something went wrong :(";
    }

    badQuestion(classObj, e) {
        this.message = "I'm sorry, I did not understand what you were trying to ask"
    }

    noAnswer() {
        this.message = "I'm sorry, I do not have an answer for your question"
    }
}

