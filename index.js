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
let enemiesInterval = 500;
let frame = 0;
let numberOfResources = 300;
let gameOver = false;
let score = 0;
const winningScore = 1000;
let selectedUnit = 0;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPosition = [];
const projectiles = [];
const resources = [];
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
proj_0.src = './assets/images/proj_0.png';
projectileTypes.push(proj_0);

const proj_1 = new Image();
proj_1.src = './assets/images/proj_1.png';
projectileTypes.push(proj_1);

const proj_2 = new Image();
proj_2.src = './assets/images/proj_2.png';
projectileTypes.push(proj_2);

//--------------------------------------------

class Projectile {
    constructor(x, y, type, power){
        this.x = x;
        this.y = y;
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
            if(enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])){
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
defender_0.src = './assets/images/crossbowman.png';
defenderTypes.push(defender_0);

const defender_1 = new Image();
defender_1.src = './assets/images/mage.png';
defenderTypes.push(defender_1);

const defender_2 = new Image();
defender_2.src = './assets/images/swordsman.png';
defenderTypes.push(defender_2);

//--------------------------------------------------
class Defender {
    constructor(x, y, health){
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.attack = false;
        this.attackNow = false;
        this.health = health;
        this.projectiles = [];
        this.timer = 0;

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
        ctx.fillStyle = '#354259';
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
            projectiles.push(new Projectile(this.x + 80, this.y + 50, 0, 20)); 
            } else if (this.selectedUnit === 1){
            projectiles.push(new Projectile(this.x + 80, this.y + 50, 2, 40)); 
            } else {
            projectiles.push(new Projectile(this.x + 80, this.y + 50, 1, 10));
            }

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

        if (enemyPosition.indexOf(defenders[i].y) !== -1){
            defenders[i].attack = true;
        } else { 
            defenders[i].attack = false; 
        }

        for (let  j = 0; j < enemies.length; j++){
            if (defenders[i] && collision(defenders[i], enemies[j])){
                enemies[j].movement = 0;
                defenders[i].health -= 1;
                }
            if (defenders[i] && defenders[i].health <= 0){
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
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
const enemyTypes = [];
const enemy_0 = new Image();
enemy_0.src = './assets/images/raider.png';
enemyTypes.push(enemy_0);

const enemy_1 = new Image();
enemy_1.src = './assets/images/gladiator.png';
enemyTypes.push(enemy_1);

// console.log(enemyTypes.length)

class Enemy {
    constructor(verticalPosition){
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;

        this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]; 
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
        }
    }

    draw(){
        // ctx.fillStyle = 'red';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'darkred';
        ctx.font = '20px MedievalSharp';
        ctx.fillText(Math.floor(this.health), this.x, (this.y+20));
        //img, sx, sy, sw, sh, dx, dy, dw, dh
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height); 
    }
}


//-------------------------------------------
function handleEnemies(){
    for (let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        if (enemies[i].x < 0){
            gameOver = true;
        }
        if (enemies[i].health <= 0){
            let gainResources = enemies[i].maxHealth/10;
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
        enemies.push(new Enemy(verticalPosition));
        enemyPosition.push(verticalPosition);
        if (enemiesInterval > 120) enemiesInterval -= 50;
        console.log(enemyPosition)
    }
}



//----------------------------Resources------------------------------------
const amounts = [20, 30, 40]
const fruitTypes = [];
const fruit_0 = new Image();
fruit_0.src = './assets/images/fruit_0.png';
fruitTypes.push(fruit_0);

const fruit_1 = new Image();
fruit_1.src = './assets/images/fruit_1.png';
fruitTypes.push(fruit_1);

const fruit_2 = new Image();
fruit_2.src = './assets/images/fruit_2.png';
fruitTypes.push(fruit_2);


class Resource {
    constructor(){
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25
        this.width = cellSize * 0.6
        this.height = cellSize * 0.6
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
        this.type = fruitTypes[Math.floor(Math.random() * 3)]
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
    if (frame % 500 === 0 && score < winningScore){
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
    ctx.fillText("Score: " + score, 250, 30);
    ctx.fillText("Essence: " + numberOfResources, 250, 50);
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
        defenders.push(new Defender(gridPositionX, gridPositionY, 200));
        numberOfResources -= 100;
    } else if (selectedUnit === 1 && numberOfResources >= 200){
        defenders.push(new Defender(gridPositionX, gridPositionY, 100));
        numberOfResources -= 200;
    } else if (selectedUnit === 2 && numberOfResources >= 50){
        defenders.push(new Defender(gridPositionX, gridPositionY, 500));
        numberOfResources -= 50;
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


//--------------------------------animate-------------------------------
function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBG();
    ctx.fillStyle = '#354259';
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
    if (! gameOver) requestAnimationFrame(animate);
}

animate();

