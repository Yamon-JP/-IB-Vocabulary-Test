// =====================================
// IB Master Trainer Beta 2 Core
// =====================================


let vocabulary = [];

let filteredVocabulary = [];

let currentItem = {};

let correct = 0;

let total = 0;

let currentSubject = "english";





// =====================================
// History
// =====================================


let historyData =
JSON.parse(
    localStorage.getItem("ibHistory")
)
||
{};





// =====================================
// Start
// =====================================


loadData("english");






// =====================================
// Load Data
// =====================================


function loadData(subject){


    currentSubject = subject;


    let file =
    subject === "biology"
    ?
    "biology.json"
    :
    "vocabulary.json";



    fetch(
        file + "?v=" + Date.now()
    )


    .then(response=>{


        if(!response.ok){

            throw new Error(
                "File not found"
            );

        }


        return response.json();


    })


    .then(data=>{


        vocabulary = data;

        filteredVocabulary = data;



        document.getElementById("mode")
        .innerHTML =

        subject === "biology"
        ?
        "Biology SL"
        :
        "English B HL";



        nextQuestion();



    })


    .catch(error=>{


        console.log(error);


        document.getElementById("word")
        .innerHTML =
        "Loading Error";


    });



}








// =====================================
// Subject Change
// =====================================


function changeSubject(){


    let subject =
    document.getElementById("subject")
    .value;



    correct = 0;

    total = 0;


    updateStatus();


    loadData(subject);



}








// =====================================
// All Topics
// =====================================


function startAllTopics(){


    filteredVocabulary =
    vocabulary;


    nextQuestion();


}








// =====================================
// Question
// =====================================


function nextQuestion(){


    if(filteredVocabulary.length===0){

        return;

    }



    currentItem =

    filteredVocabulary[
        Math.floor(
            Math.random()
            *
            filteredVocabulary.length
        )
    ];



    showCard();


    createQuestion();


    showDefinition();



}








// =====================================
// Card
// =====================================


function showCard(){


    document.getElementById("word")
    .innerHTML =

    currentItem.term ||
    currentItem.word;



    document.getElementById("meaning")
    .innerHTML =

    currentItem.japanese ||
    currentItem.meaning;



}








function flipCard(){


    document
    .getElementById("meaning")
    .classList
    .toggle("hidden");


}








// =====================================
// Paper 1
// =====================================


function createQuestion(){


    let q =
    document.getElementById("question");


    let area =
    document.getElementById("choices");



    area.innerHTML="";



    if(!currentItem.paper1){


        q.innerHTML =
        "No Paper 1 question";


        return;


    }



    q.innerHTML =
    currentItem.paper1.question;



    currentItem.paper1.options
    .forEach(option=>{


        let btn =
        document.createElement("button");



        btn.innerHTML =
        option;



        btn.onclick=function(){

            checkAnswer(option);

        };



        area.appendChild(btn);



    });



}








// =====================================
// Answer
// =====================================


function checkAnswer(answer){


    total++;



    if(answer === currentItem.paper1.answer){


        correct++;


        document.getElementById("result")
        .innerHTML =
        "⭕ Correct";


    }
    else{


        document.getElementById("result")
        .innerHTML =

        "❌ Correct answer: "
        +
        currentItem.paper1.answer;


    }



    updateStatus();


}








// =====================================
// Definition
// =====================================


function showDefinition(){


    document.getElementById(
        "definition-question"
    )
    .innerHTML =

    currentItem.definition_question
    ||
    "No definition question";



    document.getElementById(
        "definition-answer"
    )
    .innerHTML="";


}






function showAnswer(){


    document.getElementById(
        "definition-answer"
    )
    .innerHTML =

    currentItem.definition
    ||
    "No answer";


}








// =====================================
// Status
// =====================================


function updateStatus(){


    document.getElementById("correct")
    .innerHTML =
    correct;



    document.getElementById("total")
    .innerHTML =
    total;



    let rate =

    total===0
    ?
    0
    :
    Math.round(
        correct /
        total *
        100
    );



    document.getElementById("accuracy")
    .innerHTML =
    rate + "%";


}
