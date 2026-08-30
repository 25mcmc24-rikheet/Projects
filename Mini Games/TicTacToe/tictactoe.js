let boxes=document.querySelectorAll(".box");
let reset=document.querySelector("#reset");
let newgame=document.querySelector("#newgame");
let message=document.querySelector(".message");
let msg=document.querySelector("#msg");
let count=0


let turnO=false;
const winning=[
    [0,1,2],
    [0,3,6],
    [0,4,8],
    [1,5,7],
    [2,6,8],
    [2,4,6],
    [3,4,5],
    [6,7,8],
];

const disableBox=()=>
{
    for(let box of boxes)
    {
        box.disabled=true;
    }
}

const enableBoxes=()=>
{
    for(let box of boxes)
    {
        box.disabled=false;
        box.innerText="";
    }
}

boxes.forEach((box)=>{
    box.addEventListener("click",()=>{
        console.log("x");
        if(turnO)
        {
            box.innerText="O";
            box.style.color="red";
            turnO=false;
        }
        else
        {
            box.innerText="X";
            turnO=true;
            box.style.color="green"
        }
        box.disabled=true;
        count++;
        winner();
        draw(count);
    })
})

const displayWinner=(pos1)=>
{
    msg.innerText=`${pos1} wins`;
    message.classList.remove("hide");
    disableBox();
}

const winner=()=>
{
    for(pattern of winning)
    {
        let pos1=boxes[pattern[0]].innerText;
        let pos2=boxes[pattern[1]].innerText;
        let pos3=boxes[pattern[2]].innerText;

        if(pos1!="" && pos2!="" && pos3!="")
        {
            if(pos1===pos2 && pos2===pos3)
            {
                console.log("winner");
                displayWinner(pos1);
            }
        }

    }
}
const draw=(count)=>
{
    if(count===9)
    {
        msg.innerText=`Game Tied`;
        message.classList.remove("hide");
        disableBox();
    }
}

const resetGame=()=>
{
    turn0=false;
    enableBoxes();
    message.classList.add("hide");
}

newgame.addEventListener("click",resetGame);
reset.addEventListener("click",resetGame);