let vocabulary = [];

let currentItem = {};

let correct = 0;
let total = 0;

let currentSubject = "english";



// 初期読み込み

loadData("english");



// データ読み込み

function loadData(subject){

    currentSubject = subject;


    let file = "";


    if(subject === "biology"){

        file = "biology.json";

    }

    else{

        file = "vocabulary.json";

    }



    fetch(file)

    .then(response => response.json())

    .then(data => {


        vocabulary = data;


        document.getElementById("mode").innerHTML =
        subject === "biology"
        ? "Biology SL"
        : "English B HL";



        showCard();

        createQuestion();


    })

    .catch(error => {


        console.log(error);


        document.getElementById("word").innerHTML =
        "Data loading error";


    });

}



// 科目変更

function changeSubject(){


    let subject =
    document.getElementById("subject").value;


    correct = 0;

    total = 0;


    updateStatus();


    loadData(subject);


}





// カード表示

function showCard(){


    if(vocabulary.length === 0){
        return;
    }



    currentItem =
    vocabulary[
        Math.floor(Math.random()*vocabulary.length)
    ];



    document.getElementById("word").innerHTML =
    currentItem.term ||
    currentItem.word;



    let meaning =
    currentItem.japanese ||
    currentItem.meaning;



    document.getElementById("meaning").innerHTML =
    meaning;



    document.getElementById("definition-question").innerHTML =
    currentItem.definition_question ||
    "";



    document.getElementById("definition-answer").innerHTML =
    "";



}






// カード裏表示

function flipCard(){


    document
    .getElementById("meaning")
    .classList
    .toggle("hidden");


}







// Paper 1作成

function createQuestion(){


    if(vocabulary.length === 0){
        return;
    }



    currentItem =
    vocabulary[
        Math.floor(Math.random()*vocabulary.length)
    ];



    let questionData =
    currentItem.paper1;



    if(!questionData){

        document.getElementById("question").innerHTML =
        "No Paper 1 question available";


        return;

    }



    document.getElementById("question").innerHTML =
    questionData.question;



    let choices =
    document.getElementById("choices");


    choices.innerHTML = "";



    questionData.options.forEach(option=>{


        let button =
        document.createElement("button");



        button.innerHTML = option;



        button.onclick=function(){

            checkAnswer(option);

        };



        choices.appendChild(button);


    });


}







// 答え確認

function checkAnswer(answer){


    total++;



    if(answer === currentItem.paper1.answer){


        correct++;


        document.getElementById("result").innerHTML =
        "⭕ Correct";


    }

    else{


        document.getElementById("result").innerHTML =
        "❌ Answer: "
        +
        currentItem.paper1.answer;


    }



    updateStatus();


}






// 次の問題

function nextQuestion(){


    document.getElementById("result").innerHTML="";


    showCard();


    createQuestion();


}






// Definition回答表示

function showAnswer(){


    if(currentItem.definition){


        document.getElementById("definition-answer").innerHTML =
        currentItem.definition;


    }

    else{


        document.getElementById("definition-answer").innerHTML =
        "No answer available";


    }


}







// 成績更新

function updateStatus(){


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
