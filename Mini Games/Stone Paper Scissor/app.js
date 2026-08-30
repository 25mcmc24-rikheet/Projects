let userScore=0;
let aiScore=0;

const choices=document.querySelectorAll(".choice");

const user=document.querySelector("#user");
const ai=document.querySelector("#ai");
const genChoice=()=>
{
    const options=["rock","paper","scissors"];
    const choice=Math.floor(Math.random()*3);
    return options[choice];
}

const draw=(userChoice)=>
    {
        console.log(`Draw !! Both selected ${userChoice}`)
        msg.innerText=`Draw !! Both selected ${userChoice}`;
        msg.style.backgroundColor="gray"
    };
const showWinner=(userWin,userChoice,aiChoice)=>
{
    if(userWin)
    {
        console.log(`You Win !! ${userChoice} beats ${aiChoice}` );
        msg.innerText=`You Win !! ${userChoice} beats ${aiChoice}`;
        msg.style.backgroundColor="green";
        userScore++;
        user.innerText=userScore;
    }
    else
    {
        console.log(`You Lose!! ${aiChoice} beats ${userChoice}`);
        msg.innerText=`You Lose !! ${aiChoice} beats ${userChoice}`;
        msg.style.backgroundColor="red";
        aiScore++;
        ai.innerText=aiScore;
    }
}

const playGame =(userChoice)=>
{
    const aiChoice=genChoice();
    if(userChoice===aiChoice)
    {
        draw(userChoice);
    }
    else
    {
        let userWin=true;
        if(userChoice==="rock")
        {
            userWin=aiChoice==="scissors"?true:false;
        }
        else if(userChoice==="scissors")
        {
            userWin=aiChoice==="paper"?true:false;
        }
        else
        {
            userWin=aiChoice==="rock"?true:false;
        }

        showWinner(userWin,userChoice,aiChoice);
    }
};

choices.forEach((choice)=>
{
    choice.addEventListener("click",() =>
    {
        const userChoice=choice.getAttribute("id");
        playGame(userChoice);
    })
});

