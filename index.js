const canvas = document.getElementById("canvas__main");
const ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 600;


function drawBG() {
  const background = new Image();
  background.src = './assets/images/bg.png';
  ctx.drawImage(background, 0, 60);
}
 

const cellSize = 100;
const cellGap = 3;
let level = 1;
let maxLevel = 20;
let enemiesInterval = 800 - (level * 20);
let frame = 0;
let numberOfResources = 300;
let gameOver = false;
let gameWon = false;
let score = 0;
let winningScore = 500;
let selectedUnit = 0;


let gameGrid = [];
let defenders = [];
let enemies = [];
let enemyPosition = [];
let projectiles = [];
let resources = [];


function restartGame(type){
    gameGrid.length = 0;
    defenders.length = 0;
    enemies.length = 0;
    enemyPosition.length = 0;
    projectiles.length = 0;
    resources.length = 0;

    level += type;
    enemiesInterval = 800 - (level*20);
    frame = 0;
    numberOfResources = 300;
    gameOver = false;
    gameWon = false;
    score = 0;
    winningScore = 500 + (level*100);

    createGrid();
}
 
//----------------------------mouse------------------------
const mouse = {
    x: undefined,
    y: undefined,
    width: 0.1,
    height: 0.1,
    clicked: false
}

canvas.addEventListener('mousedown', function(){
    mouse.clicked = true;
});
canvas.addEventListener('mouseup', function(){
    mouse.clicked = false;
});


let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function(e){
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', function(){
    mouse.x = undefined;
    mouse.y = undefined;
});

console.log(canvasPosition)


//------------------------------board------------------------------
const controlsBar = {
    width: canvas.width,
    height: cellSize,
}

//-----------------------------------------------------------------
class Cell {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw(){
        if (mouse.x && mouse.y && collision(this, mouse)){
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

//---------------------------draw grid-----------------------------
function createGrid(){
    for (let y = cellSize; y < canvas.height; y += cellSize){
        for (let x = 0; x < canvas.width; x += cellSize){
            gameGrid.push(new Cell(x, y));
        }
    }
}


createGrid();

//-------------------------------------------
function handleGameGrid(){
    for (let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();
    }
}


//------------------------------projectiles------------------------------
const projectileTypes = [];
const proj_0 = new Image();
proj_0.src = './assets/images/projectiles/proj_0.png';
projectileTypes.push(proj_0);

const proj_1 = new Image();
proj_1.src = './assets/images/projectiles/proj_1.png';
projectileTypes.push(proj_1);

const proj_2 = new Image();
proj_2.src = './assets/images/projectiles/proj_2.png';
projectileTypes.push(proj_2);

//--------------------------------------------

class Projectile {
    constructor(x, y, type, power, hostile){
        this.x = x;
        this.y = y;
        this.hostile = hostile
        this.type = projectileTypes[type]
        this.width = 20;
        this.height = 20;
        this.power = power;
        this.speed = 5;
    }
    update(){
        this.x += this.speed;
        
    }
    draw(){
        // ctx.fillStyle = 'black';
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.drawImage(this.type, this.x, this.y-10, this.width, this.height);
        // ctx.fill();
        
    }
}


//-------------------------

function handleProjectiles(){
    for (let i = 0; i < projectiles.length; i++){
        projectiles[i].update();
        projectiles[i].draw();


        for (let j = 0; j < enemies.length; j++){
            if(enemies[j] && projectiles[i] && projectiles[i].hostile === false && collision(projectiles[i], enemies[j])){
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }

        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize){
            projectiles.splice(i, 1)
            i--;
        }
    }
}


//------------------------------defenders------------------------------
const defenderTypes = [];

const defender_0 = new Image();
defender_0.src = './assets/images/characters/crossbowman.png';

const defender_1 = new Image();
defender_1.src = './assets/images/characters/mage.png';

const defender_2 = new Image();
defender_2.src = './assets/images/characters/swordsman.png';

defenderTypes.push(defender_0, defender_1, defender_2);

//--------------------------------------------------
class Defender {
    constructor(x, y, health, type, might){
        this.x = x
        this.y = y
        this.might = might
        this.type = type
        this.width = cellSize - cellGap * 2
        this.height = cellSize - cellGap * 2
        this.attack = false
        this.attackNow = false
        this.health = health
        this.projectiles = []
        this.timer = 0

        this.selectedUnit = selectedUnit;

        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 4;
        this.spriteWidth = 64; //size of img in px
        this.spriteHeight = 64;

    }

    draw(){
        // ctx.fillStyle = 'blue';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '20px MedievalSharp';
        ctx.fillText(Math.floor(this.health), this.x, (this.y+20));

        if (this.selectedUnit === 0){
            ctx.drawImage(defender_0, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height); 
        } else if (this.selectedUnit === 1){
            ctx.drawImage(defender_1, (this.frameX * this.spriteWidth)+8, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height); 
        } else if (this.selectedUnit === 2){
            ctx.drawImage(defender_2, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height); 
        }
    }

    update(){
        if(frame % 20 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
            
            if (this.frameX === 4) this.attackNow = true;
        }

        if (this.attack){
            this.minFrame = 0;
            this.maxFrame = 4;
        } else {
            this.minFrame = 0;
            this.maxFrame = 1;
        }


        if (this.attack && this.attackNow){
            if(this.selectedUnit === 0) {
            projectiles.push(new Projectile(this.x + 80, this.y + 50, 0, 20, false)); 
            } else if (this.selectedUnit === 1){
            projectiles.push(new Projectile(this.x + 80, this.y + 50, 2, 40, false)); 
            } //else {
            // projectiles.push(new Projectile(this.x + 80, this.y + 50, 1, 10, false));
            // }

            this.attackNow = false;
        }
    }
}
            // this.timer++; 
            // if (this.timer % 100 === 0){
                //projectiles.push(new Projectile(this.x + 50, this.y + 50));
                // }
            // } else {
            //     this.timer = 0;
            // }
    

//--------------------------------------------------------------------------
function handleDefenders(){
    for (let i = 0; i < defenders.length; i++){
        defenders[i].draw();
        defenders[i].update();

        if (enemyPosition.indexOf(defenders[i].y) !== -1 && defenders[i].type === "ranged"){
            defenders[i].attack = true; 
        } else { 
            defenders[i].attack = false; 
        }

        //-----------------------------------------
        for (let  j = 0; j < enemies.length; j++){

            if (defenders[i] && collision(defenders[i], enemies[j])){
                enemies[j].movement = 0;
                enemies[j].speed = 0;
                enemies[j].attack = true;
                defenders[i].attack = true;
                defenders[i].health -= Math.round(enemies[j].might);
                } else { 
                    enemies[j].movement = enemies[j].maxSpeed; 
                    enemies[j].attack = false;
                }

            if (defenders[i] && defenders[i].type === "melee" && collision(defenders[i], enemies[j])){
                enemies[j].health -= Math.round(defenders[i].might);
            }

            if (defenders[i] && defenders[i].health <= 0){
                defenders.splice(i, 1);
                i--;
            }
        }
    }
}
//---------------------manageDefenders------------------------------ 
const card_0 = {
    x: 10,
    y: 10,
    width: 70,
    height: 85,
    colorStroke: 'black'
}

const card_1 = {
    x: 90,
    y: 10,
    width: 70,
    height: 85,
    colorStroke: 'black'
}

const card_2 = {
    x: 170,
    y: 10,
    width: 70,
    height: 85,
    colorStroke: 'black'
}
//------------------------------------------------------------------

function manageDefenders(){
    ctx.linewidth = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';

    if(collision(mouse, card_0) && mouse.clicked){
        selectedUnit = 0;
    } else if (collision(mouse, card_1) && mouse.clicked){
        selectedUnit = 1;
    } else if (collision(mouse, card_2) && mouse.clicked){
        selectedUnit = 2;
    } 

    if (selectedUnit === 0){
        card_0.colorStroke = 'gold';
        card_1.colorStroke = 'black';
        card_2.colorStroke = 'black';
    } else if (selectedUnit === 1){
        card_0.colorStroke = 'black';
        card_1.colorStroke = 'gold';
        card_2.colorStroke = 'black';
    } else if (selectedUnit === 2){
        card_0.colorStroke = 'black';
        card_1.colorStroke = 'black';
        card_2.colorStroke = 'gold';
    } else {
        card_0.colorStroke = 'black';
        card_1.colorStroke = 'black';
        card_2.colorStroke = 'black';
    }


    ctx.fillRect(card_0.x, card_0.y, card_0.width, card_0.height);
    ctx.strokeStyle = card_0.colorStroke;
    ctx.strokeRect(card_0.x, card_0.y, card_0.width, card_0.height)
    ctx.drawImage(defenderTypes[0], 0, 0, 64, 64, 0, 5, 85, 85);

    ctx.fillRect(card_1.x, card_1.y, card_1.width, card_1.height);
    ctx.strokeStyle = card_1.colorStroke;
    ctx.strokeRect(card_1.x, card_1.y, card_1.width, card_1.height)
    ctx.drawImage(defenderTypes[1], 0, 0, 64, 64, 80, 5, 85, 85);

    ctx.fillRect(card_2.x, card_2.y, card_2.width, card_2.height);
    ctx.strokeStyle = card_2.colorStroke;
    ctx.strokeRect(card_2.x, card_2.y, card_2.width, card_2.height)
    ctx.drawImage(defenderTypes[2], 0, 0, 64, 64, 160, 5, 85, 85);
}




//-------------------------------enemy------------------------------
const enemyImg = [];
const img_0 = new Image();
img_0.src = './assets/images/characters/raider.png';
 
const img_1 = new Image();
img_1.src = './assets/images/characters/gladiator.png';

enemyImg.push(img_0, img_1);

// console.log(enemyTypes.length)

class Enemy {
    constructor(verticalPosition, health, speed, img, might){
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + speed;
        this.maxSpeed = this.speed;
        this.movement = this.speed;
        this.health = health;
        this.might = might;
        this.maxHealth = this.health;
        this.attack = false
        this.attackNow = false

        this.enemyImg = img;
//enemyImg[Math.floor(Math.random() * enemyImg.length)]; 
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 1;
        this.spriteWidth = 64; //size of img in px
        this.spriteHeight = 64;
    }
    update(){
        this.x -= this.movement;
 
        if(frame % 20 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;

            if (this.frameX === 4) this.attackNow = true;
        }
  
        if (this.attack){
            this.minFrame = 2;
            this.maxFrame = 4;
        } else {
            this.minFrame = 0;
            this.maxFrame = 1;
        }
    }

    draw(){
        // ctx.fillStyle = 'red';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'darkred';
        ctx.font = '20px MedievalSharp';
        ctx.fillText(Math.floor(this.health), this.x, (this.y+20));
        //img, sx, sy, sw, sh, dx, dy, dw, dh
        ctx.drawImage(this.enemyImg, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height); 
    }
}

//-----------------enemYTypes---------------
// let enemyTypes = []

// let raider = new Enemy (verticalPosition, 100, 0.4, enemyImg[0])
// let gladiator = new Enemy (verticalPosition, 120, 0.3, enemyImg[1])

// enemyTypes.push(raider, gladiator);
 
 

//-------------------------------------------
function handleEnemies(){
    for (let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        if (enemies[i].x < 0){
            gameOver = true;
        }
        if (enemies[i].health <= 0){
            let gainResources = Math.floor(enemies[i].maxHealth/10);
            numberOfResources += gainResources;
            score += gainResources;
            floatingMessages.push(new floatingMessage('+' + gainResources, 400, 50, 30, 'gold'));
            floatingMessages.push(new floatingMessage('+' + gainResources, enemies[i].x, enemies[i].y, 30, 'black'));

            const findThisIndex = enemyPosition.indexOf(enemies[i].y);
            enemyPosition.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
            console.log(enemyPosition)
        }
    }


    if (frame % enemiesInterval === 0 && score < winningScore){
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        let rndEnemy =  Math.floor(Math.random() * 2) 

        //----------enemy selector----------------
        if (rndEnemy === 0) {enemies.push(new Enemy (verticalPosition, 100, 0.4, enemyImg[0], 1))}  
        else if (rndEnemy === 1) {enemies.push(new Enemy (verticalPosition, 120, 0.35, enemyImg[1], 1))}
        // enemies.push(new Enemy(verticalPosition));

        enemyPosition.push(verticalPosition);

        if (enemiesInterval > 100) {enemiesInterval -= 20};
        console.log(enemyPosition)
    }
}


//----------------------------Resources------------------------------------
const amounts = [20, 30, 40, 50]
const fruitTypes = [];
const fruit_0 = new Image();
fruit_0.src = './assets/images/collectables/fruit_0.png';

const fruit_1 = new Image();
fruit_1.src = './assets/images/collectables/fruit_1.png';

const fruit_2 = new Image();
fruit_2.src = './assets/images/collectables/fruit_2.png';

const fruit_3 = new Image();
fruit_3.src = './assets/images/collectables/fruit_3.png';

const fruit_4 = new Image();
fruit_4.src = './assets/images/collectables/fruit_4.png';

const fruit_5 = new Image();
fruit_5.src = './assets/images/collectables/fruit_5.png';

const fruit_6 = new Image();
fruit_6.src = './assets/images/collectables/fruit_6.png';
fruitTypes.push(fruit_0,fruit_1,fruit_2,fruit_3,fruit_4, fruit_5, fruit_6);

class Resource {
    constructor(){
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25
        this.width = cellSize * 0.6
        this.height = cellSize * 0.6
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
        this.type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)]
}           
    draw(){
        // ctx.fillStyle = "yellow"; 
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.type, this.x, this.y, this.width, this.height); 
        ctx.fillStyle = 'black';
        ctx.front = '20px MedievalSharp';
        ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
}

//-----------------------------------------------
function handleResources(){
    if (frame % 550 === 0 && score < winningScore){
        resources.push(new Resource())
    }
    for (let i = 0; i < resources.length; i++){
        resources[i].draw();
        if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
            numberOfResources += resources[i].amount;
            floatingMessages.push(new floatingMessage('+' + resources[i].amount, resources[i].x, resources[i].y, 30, 'black'));
            floatingMessages.push(new floatingMessage('+' + resources[i].amount, 400, 50, 30, 'gold'));
            resources.splice(i, 1);
            i--;
        }
    }
}


//------------------------------UI-----------------------------
function handleGameStatus(){
    ctx.fillStyle = 'gold';
    ctx.font = '20px MedievalSharp';
    ctx.fillText("Score: " + score, canvas.width - cellSize*1.5, 30);
    ctx.fillText("Essence: " + numberOfResources, canvas.width - cellSize*1.5, 50);
    ctx.fillText("Level: " + level, canvas.width - cellSize*1.5, 70);
    
    // ctx.fillText(enemiesInterval, canvas.width - cellSize*2,30);
    // ctx.fillText(winningScore, canvas.width - cellSize*2,50);

    ctx.font = '16px MedievalSharp';
    ctx.fillText("100", card_0.x, card_0.y+15);
    ctx.fillText("200", card_1.x, card_1.y+15);
    ctx.fillText("120", card_2.x, card_2.y+15);

    if (gameOver){
        ctx.fillStyle = 'gold';
        ctx.font = '60px MedievalSharp';
        ctx.fillText("Our defences are breached!", 100, 300);
    }

    if (score >= winningScore && enemies.length === 0){
        ctx.fillStyle = 'gold';
        ctx.font = '60px MedievalSharp';
        ctx.fillText("We are victorious!", 100, 300);
        ctx.font = '40px MedievalSharp';
        ctx.fillText("Your score is: " + score, 100, 340);

        gameWon = true;
    }

     
}
 
//--------------------------floating message-------------------------
const floatingMessages = [];

class floatingMessage {
    constructor(value, x, y, size, color){
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;   
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;
    }
    update(){
        this.y -= 0.3;
        this.lifeSpan += 1;
        if (this.opacity > 0.03) this.opacity -= 0.03;
    }
    draw(){
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px MedievalSharp';
        ctx.fillText(this.value, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

//--------------------------------
function handleFloatingMessages(){
    for (let i = 0; i < floatingMessages.length; i++){
        floatingMessages[i].update();
        floatingMessages[i].draw();

        if (floatingMessages[i].lifeSpan >= 50){
            floatingMessages.splice(i, 1);
            i--;
        }   
    }
}


//-----------------------------add defender----------------------------- 
canvas.addEventListener('click', function(){
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if (gridPositionY < cellSize) return;
//--------------------------no multiple grids---------------------------
    for (let i = 0; i < defenders.length; i++){
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
        return;
    }
//----------------------------------------------------------------------
    // let defenderCost = 100;
    if(selectedUnit === 0 && numberOfResources >= 100){
        defenders.push(new Defender(gridPositionX, gridPositionY, 100, "ranged", 1));
        numberOfResources -= 100;
    } else if (selectedUnit === 1 && numberOfResources >= 200){
        defenders.push(new Defender(gridPositionX, gridPositionY, 100, "ranged", 1));
        numberOfResources -= 200;
    } else if (selectedUnit === 2 && numberOfResources >= 120){
        defenders.push(new Defender(gridPositionX, gridPositionY, 200, "melee", 1));
        numberOfResources -= 120;
    } else {
        floatingMessages.push(new floatingMessage('Not enough essence!', mouse.x, mouse.y, 20, 'blue'));
    }
});


//-----------------------------collisions-----------------------------
function collision(first, second){
    if (    !(first.x > second.x + second.width ||
             first.x + first.width < second.x  ||  
             first.y > second.y + second.height  || 
             first.y + first.height < second.y)
    ) {
        return true;
    }    
}


//-------------------------------window resize-----------------------------
window.addEventListener('resize', function(){
    canvasPosition = canvas.getBoundingClientRect();
})

//----------------------------debug-----------------------------------
function debug(data){
    console.log(data)
}

 
//--------------------------------animate-------------------------------
function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#354259';
    drawBG();
    
    // console.log(enemiesInterval)
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleResources();
    handleDefenders();
    handleProjectiles();
    handleEnemies();
    manageDefenders();
    handleGameStatus();
    handleFloatingMessages();
    frame++;
    // console.log(frame);

    if(gameWon){
        document.getElementById("btnNext").style.display = "flex";
    } else {
        document.getElementById("btnNext").style.display = "none";
    }

    // console.log(gameWon)
    if (! gameOver) requestAnimationFrame(animate);
}
 
animate();
 


