let vocabulary = [];

let currentItem = {};

let correct = 0;
let total = 0;

let currentSubject = "english";


// 初期読み込み
loadData("english");


// データ読み込み
function loadData(subject) {

    currentSubject = subject;

    let file;

    if (subject === "biology") {
        file = "biology.json";
    } else {
        file = "vocabulary.json";
    }


    fetch(file + "?v=" + Date.now())

    .then(response => {

        if (!response.ok) {
            throw new Error("File not found");
        }

        return response.json();

    })

    .then(data => {

        vocabulary = data;


        document.getElementById("mode").innerHTML =
        subject === "biology"
        ? "Biology SL"
        : "English B HL";


        nextQuestion();


    })

    .catch(error => {

        console.log(error);

        document.getElementById("word").innerHTML =
        "Loading Error";

    });

}



// 科目変更
function changeSubject() {


    let subject =
    document.getElementById("subject").value;


    correct = 0;
    total = 0;

    updateStatus();


    loadData(subject);


}





// 新しい問題
function nextQuestion() {


    if (vocabulary.length === 0) {
        return;
    }


    currentItem =
    vocabulary[
        Math.floor(Math.random() * vocabulary.length)
    ];



    showCard();

    createQuestion();

    showDefinition();


}






// カード表示
function showCard() {


    let term =
    currentItem.term ||
    currentItem.word;


    let meaning =
    currentItem.japanese ||
    currentItem.meaning;



    document.getElementById("word").innerHTML =
    term;



    document.getElementById("meaning").innerHTML =
    meaning;



}






// カード裏返し
function flipCard() {


    document
    .getElementById("meaning")
    .classList
    .toggle("hidden");


}






// Paper 1問題作成
function createQuestion() {


    let question =
    document.getElementById("question");


    let choices =
    document.getElementById("choices");



    choices.innerHTML = "";


    if (!currentItem.paper1) {


        question.innerHTML =
        "No Paper 1 question available";


        return;

    }



    question.innerHTML =
    currentItem.paper1.question;



    currentItem.paper1.options.forEach(option => {


        let button =
        document.createElement("button");


        button.innerHTML = option;



        button.onclick = function(){

            checkAnswer(option);

        };


        choices.appendChild(button);


    });



}






// 答え確認
function checkAnswer(answer) {


    total++;


    if(answer === currentItem.paper1.answer) {


        correct++;

        document.getElementById("result").innerHTML =
        "⭕ Correct";


    }

    else {


        document.getElementById("result").innerHTML =
        "❌ Correct answer: "
        +
        currentItem.paper1.answer;


    }


    updateStatus();


}






// Definition Writing表示
function showDefinition() {


    let question =
    document.getElementById("definition-question");


    let answer =
    document.getElementById("definition-answer");



    if(currentItem.definition_question) {


        question.innerHTML =
        currentItem.definition_question;


    }

    else {


        question.innerHTML =
        "No definition question";


    }



    answer.innerHTML = "";



}






// 模範解答表示
function showAnswer() {


    let answer =
    document.getElementById("definition-answer");



    if(currentItem.definition) {


        answer.innerHTML =
        currentItem.definition;


    }

    else {


        answer.innerHTML =
        "No answer";


    }


}






// 成績表示
function updateStatus() {


    document.getElementById("correct").innerHTML =
    correct;


    document.getElementById("total").innerHTML =
    total;



    let rate =
    total === 0
    ? 0
    : Math.round(correct / total * 100);



    document.getElementById("accuracy").innerHTML =
    rate + "%";


}
