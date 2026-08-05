let vocabulary = [];
let currentWord = {};
let currentQuestion = {};

let correct = 0;
let total = 0;


// 単語データ読み込み
fetch("vocabulary.json")
.then(response => response.json())
.then(data => {

    vocabulary = data;

    showCard();
    createQuestion();

})
.catch(error => {

    document.getElementById("word").innerHTML =
    "単語データを読み込めません";

    console.log(error);

});



// カード表示
function showCard(){

    currentWord =
    vocabulary[Math.floor(Math.random() * vocabulary.length)];


    document.getElementById("word").innerHTML =
    currentWord.word;


    document.getElementById("meaning").innerHTML =
    currentWord.meaning;


}



// カード裏返し
function flipCard(){

    let meaning =
    document.getElementById("meaning");


    meaning.classList.toggle("hidden");

}



// 問題作成
function createQuestion(){

    if(vocabulary.length === 0){
        return;
    }


    currentQuestion =
    vocabulary[Math.floor(Math.random() * vocabulary.length)];


    document.getElementById("question").innerHTML =
    "「" + currentQuestion.word + "」の意味は？";


    let choices =
    document.getElementById("choices");

    choices.innerHTML = "";


    let answers = [];

    answers.push(currentQuestion.meaning);


    while(answers.length < 4){

        let random =
        vocabulary[Math.floor(Math.random() * vocabulary.length)].meaning;


        if(!answers.includes(random)){
            answers.push(random);
        }

    }


    answers.sort(() => Math.random() - 0.5);



    answers.forEach(answer => {

        let button =
        document.createElement("button");


        button.innerHTML = answer;


        button.onclick = function(){

            checkAnswer(answer);

        };


        choices.appendChild(button);

    });


}



// 答え確認
function checkAnswer(answer){

    total++;


    if(answer === currentQuestion.meaning){

        correct++;

        document.getElementById("result").innerHTML =
        "⭕ 正解！";

    }

    else{

        document.getElementById("result").innerHTML =
        "❌ 正解：" + currentQuestion.meaning;

    }


    updateStatus();

}



// 次の問題
function nextQuestion(){

    document.getElementById("result").innerHTML="";

    showCard();

    createQuestion();

}



// 成績表示
function updateStatus(){

    document.getElementById("correct").innerHTML =
    correct;


    document.getElementById("total").innerHTML =
    total;


    let rate =
    total === 0 ? 0 :
    Math.round(correct / total * 100);


    document.getElementById("accuracy").innerHTML =
    rate + "%";

}
