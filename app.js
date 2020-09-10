const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

const scoreDisplay = document.querySelector('#score');
const timerDisplay = document.querySelector('#timer');
const startButton = document.querySelector('#start-button');
const gamePanel = document.querySelector('#game-panel');

let gameId;
let score = 0;
let flied = 0;
let gameTimer;
let duration;  
let timers = [];
let balls = [];
let particles = [];
let isGame = false;

let mouseX = undefined;
let needle;
let wind;
let initBallSpeed;
let startIntervalBetweenBalloon;

const colorSet = [
    '#046975',
    '#401104',
    '#3BCC2A',
    '#FFDF59',
    '#FF1D47',
    '#A60400',
    '#090974',
    '#FFE800',
    '#A64D00',
    '#CD0074',
    '#7109AA',
    '#70E500'
]

startButton.addEventListener('click', ()=>{
    initGame();
    startGame();
})

const initGame = (gameDuration = 1000 * 60 * 1, ballSpeed = 1, intervalBetweenBallon = 5000) => {
    needle = new Needle(window.innerWidth/2, 50);
    needle.draw();
    wind = new Wind();
    timers = [];
    balls = [];
    score = 0;
    flied = 0;
    duration = gameDuration;
    initBallSpeed = ballSpeed
    startIntervalBetweenBalloon = intervalBetweenBallon;
}

const startGame = () => {
    gameId && cancelAnimationFrame(gameId);
    isGame = true;
    panelOff();

    setGameTimer();
    setWind();
    setParticles();
    setBalloonLauncher();

    game();
}

window.addEventListener('resize', debounce(()=>{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}));

window.addEventListener('mousemove', (event) => {
    mouseX = event.x;
})

const Needle = function(x, length){
    this.x = x;
    this.y = 0;
    this.length = length

    this.draw = function(){
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x+5, this.y+length);
        ctx.lineTo(this.x+10, this.y);
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.stroke();
        ctx.fill();
    }

    this.update = function(){
        this.x = mouseX;
    }
}

const Ball = function(x, y, dx, dy, radius){
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
    this.minRadius = 10;
    this.color = colorSet[getRandomInt(0, colorSet.length)];
    this.hitBox = [];
    this.isPopped = false;
    this.isFliedAway = false;
    this.delta = 0;
    this.popPosition = undefined;
    this.inertion = 0;

    this.draw = function(){
        
        if(!this.isPopped){
            this.drawBalloon();
        }else{
            this.drawText();
        }   
        this.hitBox = this.setHitBox()
    }

    this.drawBalloon = function(){
        ctx.beginPath();
        // Тело шарика
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI, true);
        ctx.strokeStyle = 'black';
        ctx.moveTo(this.x-this.radius, this.y);
        ctx.bezierCurveTo(  this.x - this.radius+this.radius/5, 
                            this.y + this.radius*2, 
                            this.x+this.radius-this.radius/5, 
                            this.y+this.radius*2, 
                            this.x+this.radius, this.y);
        // Пимпочка снизу
        let pimp = this.radius*2-this.radius/2; //координаты по y для пимпочки шарика
        ctx.moveTo(this.x, this.y+pimp);
        ctx.lineTo(this.x-5, this.y+pimp+5);
        ctx.lineTo(this.x+10, this.y+pimp+5);
        ctx.closePath();
        
        //Градиент для объёмной формы
        let xGrd = this.x+this.radius/3;
        let yGrd = this.y-this.radius/3;
        let grd = ctx.createRadialGradient(xGrd, yGrd, this.radius/20, xGrd-this.radius/3, yGrd-this.radius/3, this.radius*1.5);
        grd.addColorStop(0, 'white');
        grd.addColorStop(1, this.color);
        ctx.fillStyle = grd;

        ctx.stroke();
        ctx.fill();
    }

    this.drawText = function(){
        ctx.font = '30px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.color;
        ctx.fillText('+1', this.x, this.y); 
    }

    this.setHitBox = function(){
        /*
            x = r*cos(fi)
            y = r*sin(fi)
        */
        let hitBox = []
        if(this.y  <= (35 + this.radius)){
            for(let i = 0, j = -180; i >= -90, j<=-90; i--, j++){
                const x1 = this.x + this.radius*Math.cos(i*(Math.PI/180));
                const x2 = this.x + this.radius*Math.cos(j*(Math.PI/180));
                const y = this.y + this.radius*Math.sin(i*(Math.PI/180))
                hitBox = [...hitBox, [y, x1, x2]];
            }
        }
        return hitBox;
    }

    this.setIsPopped = function(){
        this.isPopped = true;
        this.popPosition = this.y - 15;
    }

    this.setDelta = function(){ // функция для расчёта силы действия ветра на шар
        if(this.dx > 0){
            this.delta = (window.innerWidth - this.x)/window.innerWidth
        }
        if(this.dx < 0){
            this.delta = Math.abs((window.innerWidth - this.x)/window.innerWidth - 1)
        }
    }

    this.setInertion = function(){ // добавление небольшой инерции шару
        this.inertion = this.dx*this.delta;
    }

    this.slowDownInertion = function(){
        if(this.inertion > 0.01){
            this.inertion -= 0.01;
        }else if(this.inertion < -0.01){
            this.inertion += 0.01;
        }
    }
    

    this.update = function(){
        this.setDelta();
        if(!this.isPopped){
            this.y -= this.dy;
            if(this.dx != 0){
                this.x += this.dx*this.delta;
                this.setInertion()
            }else{
                this.x += this.inertion;
                this.slowDownInertion();
            }
        }else{
            this.dy = .5;
            this.y -= this.dy;
        }
        this.draw();
    }
}

const Wind = function(){
    this.isBlowing = false;
    this.strength = 0;

    this.startBlow = function(){
        this.strength = getRandomInt(5, -5);
    }
}

const Particle = function(){
    this.x = getRandomInt(-window.innerWidth/2, window.innerWidth + window.innerWidth/2);
    this.y = 0;
    this.dx = 0;
    this.dy = Math.random();
    this.size = getRandomInt(1, 3);
    this.origindy = this.dy;
    this.inertion = 0;

    this.setInertion = function(){
        this.inertion = (this.dx/(3*this.dy))/2;
    }
    this.slowDownInertion = function(){
        if(this.inertion > 0.005){
            this.inertion -= 0.005;
        }else if(this.inertion < -0.005){
            this.inertion += 0.005;
        }
    }

    this.draw = function(){
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }

    this.update = function(){
        if(this.dx != 0){
            this.setInertion();
            this.x += (this.dx/(3*this.dy));
        }else{
            this.x += this.inertion;
            this.slowDownInertion();
        }
        this.y += this.dy;
        

        this.draw();
    }
}

const launchBall = () => {
    const ballMaxRadius = 55;
    const ballMinRadius = 30;
    return function (velocity) {
        const radius = getRandomInt(ballMinRadius, ballMaxRadius);
        const x = getRandomInt(3+radius, window.innerWidth-radius+3);
        const y = window.innerHeight + radius*2;
        const ball = new Ball(x, y, 0, velocity, radius);
        ball.draw();
        balls.push(ball);
    }
}

const game = () => {
    gameId = requestAnimationFrame(game);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    needle.update();
    needle.draw();

    // цикл для шаров
    balls.forEach((ball, index, ballArray) => {
        wind.isBlowing ? ball.dx = wind.strength : ball.dx = 0;
        ball.update();

        // находим возможный хитбокс для иглы
        let hitBox = ball.hitBox.find(box => {
            return box[0] < needle.length && box[0] > 0;
        })

        // опрделение попала игла в хитбокс или нет
       if(isGame && hitBox && (needle.x + 3) <= hitBox[1] && (needle.x + 3) >= hitBox[2]){
           !ball.isPopped && (score += 1);
           scoreDisplay.innerText = 'Score: ' + score;
           ball.setIsPopped();
       }

       // подсчёт улетевших шаров
       if(isGame && !ball.isFliedAway && !ball.isPopped && ball.y < 0){
           flied += 1;
           ball.isFliedAway = true;
       }

       // очистка отработанных шаров
       if(ball.y < -100 || (ball.isPopped && (ball.y < ball.popPosition) )){
           delete ballArray[index]
       }
    })

    // цикл для частичек
    particles.forEach( (particle, index, array) => {
        particle.update();
        wind.isBlowing ? particle.dx = wind.strength/3 : particle.dx = 0;
        if(particle.y > window.innerHeight){
            delete array[index];
            array.push(new Particle());
        }
    })
}

const displayTimer = (ms) => {
    const mins = Math.floor(ms / (60*1000));
    const secs = addZero((ms - (mins * 60 * 1000)) / 1000);
    timerDisplay.innerText = `${mins} : ${secs}`;
}

const gameOver = () => {
    panelOn();
    isGame = false;
    stopTimers(timers);
}

const setGameTimer = () => {
    gameTimer = setInterval(()=>{
        displayTimer(duration);
        duration -= 1000;
        if(duration < 0){
            clearTimeout(gameTimer);
            gameOver();
        }
    }, 1000);

    timers = [...timers, gameTimer];
}

const setWind = () => {
    let windTimer = setInterval(()=>{
        wind.isBlowing = !wind.isBlowing
        wind.isBlowing && wind.startBlow();
    }, 2000);

    timers = [...timers, windTimer];
}

const setParticles = () => {
    let particlesCount = 0;
    particles.length > 300 ? particlesCount = 0 : particlesCount = 300 - particles.length;
    for(let i = 0; i < particlesCount; i++){
        particles.push(new Particle());
    }
}

const setBalloonLauncher = () => {
    let balloonInterval = startIntervalBetweenBalloon;
    let balloonSpeed = initBallSpeed;
    const ballLauncher = launchBall();
    ballLauncher(initBallSpeed);

    let ballTimer = setTimeout(function ball(){
        if(ballTimer) clearTimeout(ballTimer)
        ballLauncher(balloonSpeed);
        if(balloonInterval > 400){
            balloonInterval -= 500;
        }else if(duration < 10000 && balloonInterval > 50){
            balloonInterval -= 50;
        }else if(balloonInterval < 400){ 
            balloonInterval = 400;
        }

        ballTimer = setTimeout(ball, balloonInterval);
        timers = [...timers, ballTimer]
    }, balloonInterval);

    let velocityTimer = setInterval(()=>{
        if(balloonSpeed < 5){
            balloonSpeed += .1;
        }
    }, 1000)
    
    timers = [...timers, velocityTimer];
}

const panelOff = () => { // убрать панель
    let button = gamePanel.querySelector('#start-button');
    scoreDisplay.innerHTML = "Score: 0";
    button.style.visibility = 'hidden';
    gamePanel.style.top = '-100%';

    setTimeout(()=>{
        showTutorial();
    }, 1000);
}

const panelOn = () => { // показать панель
    let button = gamePanel.querySelector('#start-button');
    gamePanel.innerHTML = '';

    const gameOver = document.createElement('h1');
    gameOver.innerHTML = '<h1>Game Over</h1>'

    const scores = document.createElement('h2');
    scores.innerText = `Your scores: ${score}`;

    const fliedAway = document.createElement('h2');
    fliedAway.innerText = `Balloon away: ${flied}`;

    gamePanel.appendChild(scores);
    gamePanel.appendChild(fliedAway);
    gamePanel.appendChild(gameOver);
    gamePanel.appendChild(button);

    gamePanel.style.top = '50%';
    button.style.visibility = 'visible';    
}

const showTutorial = () =>{
    let divEl = document.createElement('div');
    divEl.classList.add('tutorial');
    divEl.innerHTML = 'Move mouse to move the Needle left and right';
    document.body.appendChild(divEl);
    setTimeout(()=>{
        document.body.removeChild(divEl);
    }, 3000)
}



// Служебные функции
const addZero = (num) => {
    if(num < 10){
        num  = '0' + num;
    }
    return num;
}

const stopTimers = (timers) => {
    timers.forEach( timer => {
        clearTimeout(timer);
    })
}

const getRandomInt = (min, max) => {
    return Math.floor(Math.random()*(max-min)+min);
}

const debounce = (func) => {
    let timer;
    return event => {
        if(timer) clearTimeout(timer);
        timer = setTimeout(func, 100, event);
    }
}