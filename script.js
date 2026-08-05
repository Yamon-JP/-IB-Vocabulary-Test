// =====================================
// IB Master Trainer Beta 2 Final
// Part 1
// =====================================


let vocabulary = [];

let filteredVocabulary = [];

let currentItem = {};

let correct = 0;

let total = 0;


let currentSubject = "english";

let currentTopic = "all";

let testMode = "all";




// =====================================
// Learning History
// =====================================


let historyData =
JSON.parse(
    localStorage.getItem("ibHistory")
)
||
{};





// =====================================
// Initial Load
// =====================================


loadData("english");





// =====================================
// Load JSON
// =====================================


function loadData(subject){


    currentSubject = subject;


    let file;


    if(subject === "biology"){

        file = "biology.json";

    }
    else{

        file = "vocabulary.json";

    }



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


        filteredVocabulary =
        vocabulary;



        document.getElementById("mode")
        .innerHTML =

        subject === "biology"
        ?
        "Biology SL"
        :
        "English B HL";




        if(subject==="biology"){


            document.getElementById(
                "biology-dashboard"
            )
            .style.display="block";


            showAchievements();


        }
        else{


            document.getElementById(
                "biology-dashboard"
            )
            .style.display="none";


        }




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



    currentTopic="all";

    testMode="all";


    loadData(subject);



}






// =====================================
// Topic Select
// =====================================


function selectTopic(topic){


    currentTopic = topic;


    filteredVocabulary =
    vocabulary.filter(item=>{


        return item.topic === topic;


    });



    nextQuestion();



}







// =====================================
// All Topics
// =====================================


function startAllTopics(){


    testMode="all";


    filteredVocabulary =
    vocabulary;


    nextQuestion();


}






// =====================================
// Question
// =====================================


function nextQuestion(){


    if(
        filteredVocabulary.length===0
    ){

        return;

    }



    currentItem =
    chooseQuestion();



    showCard();


    createQuestion();


    showDefinition();


}







// =====================================
// Select Question
// =====================================


function chooseQuestion(){



    if(
        currentSubject !== "biology"
    ){


        return filteredVocabulary[
            Math.floor(
                Math.random()
                *
                filteredVocabulary.length
            )
        ];


    }




    let weakWords =
    filteredVocabulary.filter(item=>{


        let data =
        historyData[item.term];


        if(!data){

            return false;

        }


        let rate =
        data.correct /
        data.attempts *
        100;


        return rate < 70;


    });




    if(
        weakWords.length > 0
        &&
        Math.random()<0.7
    ){


        return weakWords[
            Math.floor(
                Math.random()
                *
                weakWords.length
            )
        ];


    }




    return filteredVocabulary[
        Math.floor(
            Math.random()
            *
            filteredVocabulary.length
        )
    ];



}






// =====================================
// Word Card
// =====================================


function showCard(){


    let term =
    currentItem.term ||
    currentItem.word;



    let meaning =
    currentItem.japanese ||
    currentItem.meaning;



    document.getElementById("word")
    .innerHTML =
    term;



    document.getElementById("meaning")
    .innerHTML =
    meaning;


}

// =====================================
// Card Flip
// =====================================


function flipCard(){


    document
    .getElementById("meaning")
    .classList
    .toggle("hidden");


}






// =====================================
// Paper 1 Question
// =====================================


function createQuestion(){


    let question =
    document.getElementById("question");


    let choices =
    document.getElementById("choices");



    choices.innerHTML = "";



    if(!currentItem.paper1){


        question.innerHTML =
        "No Paper 1 question available";


        return;


    }



    question.innerHTML =
    currentItem.paper1.question;




    currentItem.paper1.options.forEach(option=>{


        let button =
        document.createElement("button");



        button.innerHTML =
        option;



        button.onclick = function(){


            checkAnswer(option);


        };



        choices.appendChild(button);



    });



}








// =====================================
// Answer Check
// =====================================


function checkAnswer(answer){


    total++;



    let result =
    answer === currentItem.paper1.answer;




    if(result){


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



    saveResult(
        currentItem.term,
        result
    );



    updateStatus();



    if(currentSubject==="biology"){


        showAchievements();


    }



}








// =====================================
// Save Result
// =====================================


function saveResult(term,result){



    if(!historyData[term]){


        historyData[term] = {


            attempts:0,


            correct:0,


            wrong:0


        };


    }




    historyData[term].attempts++;





    if(result){


        historyData[term].correct++;


    }
    else{


        historyData[term].wrong++;


    }





    localStorage.setItem(

        "ibHistory",

        JSON.stringify(historyData)

    );



}








// =====================================
// Definition Writing
// =====================================


function showDefinition(){


    let question =
    document.getElementById(
        "definition-question"
    );



    let answer =
    document.getElementById(
        "definition-answer"
    );




    if(currentItem.definition_question){


        question.innerHTML =
        currentItem.definition_question;


    }
    else{


        question.innerHTML =
        "No definition question";


    }



    answer.innerHTML = "";



}







function showAnswer(){


    let answer =
    document.getElementById(
        "definition-answer"
    );



    answer.innerHTML =

    currentItem.definition
    ||
    "No answer";



}








// =====================================
// Weak Words
// =====================================


function startWeakWords(){



    testMode="weak";



    filteredVocabulary =

    vocabulary.filter(item=>{


        let data =
        historyData[item.term];



        if(!data){

            return false;

        }




        let rate =

        data.correct /
        data.attempts *
        100;



        return rate < 70;



    });





    if(filteredVocabulary.length===0){


        alert(
            "No weak words yet!"
        );


        return;


    }




    nextQuestion();



}








// =====================================
// Wrong Answers
// =====================================


function startWrongAnswers(){


    testMode="wrong";



    filteredVocabulary =

    vocabulary.filter(item=>{


        let data =
        historyData[item.term];



        return data && data.wrong>0;



    });





    if(filteredVocabulary.length===0){


        alert(
            "No wrong answers yet!"
        );


        return;


    }




    nextQuestion();



}

// =====================================
// Achievement System
// =====================================


function showAchievements(){


    let area =
    document.getElementById(
        "achievement-list"
    );



    if(!area){

        return;

    }




    area.innerHTML = "";





    let topics =

    [
        ...new Set(
            vocabulary.map(
                item=>item.topic
            )
        )
    ];





    topics.forEach(topic=>{



        let items =

        vocabulary.filter(item=>{

            return item.topic === topic;

        });





        let totalRate = 0;

        let count = 0;






        items.forEach(item=>{


            let data =
            historyData[item.term];



            if(data && data.attempts>0){


                totalRate +=

                data.correct /
                data.attempts *
                100;



                count++;


            }



        });






        let accuracy =

        count===0

        ?

        0

        :

        Math.round(
            totalRate / count
        );






        let badge =
        getBadge(accuracy);




        let card =
        document.createElement("div");




        card.className =

        "topic-card "
        +
        getRankClass(accuracy);






        card.innerHTML =

        `
        <span class="badge">
        ${badge.icon}
        </span>

        <br>

        🧬 ${topic}

        <br>

        ${badge.name}

        <br>

        Accuracy:
        ${accuracy}%

        `;




        area.appendChild(card);




    });



}









// =====================================
// Badge
// =====================================


function getBadge(rate){



    if(rate>=100){


        return {

            icon:"🦉👑✨",

            name:"IB Biology Master"

        };


    }






    if(rate>=95){


        return {

            icon:"🦊🏆✨",

            name:"Biology Expert"

        };


    }






    if(rate>=90){


        return {

            icon:"🐥🌟",

            name:"Biology Explorer"

        };


    }






    if(rate>=80){


        return {

            icon:"🐣✨",

            name:"Biology Learner"

        };


    }







    return {


        icon:"🌱",

        name:"Rookie"


    };



}








// =====================================
// Rank CSS Class
// =====================================


function getRankClass(rate){



    if(rate>=100){


        return "rank-master";


    }





    if(rate>=95){


        return "rank-expert";


    }






    if(rate>=90){


        return "rank-explorer";


    }






    if(rate>=80){


        return "rank-learner";


    }






    return "rank-rookie";



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
