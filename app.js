const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

let mouseX = undefined;
const balls = [];
const colorSet = [
    '#046975',
    '#401104',
    '#3BCC2A',
    '#FFDF59',
    '#FF1D47'
]




const debounce = func => {
    let timer;
    return event => {
        if(timer) clearTimeout(timer);
        timer = setTimeout(func, 100, event);
    }
}

window.addEventListener('resize', debounce(()=>{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}));

window.addEventListener('mousemove', (event) => {
    mouseX = event.x;
})



const Needle = function(x){
    this.x = x;
    this.y = 0;

    this.draw = function(){
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x+5, this.y+30);
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

const needle = new Needle(window.innerWidth/2);
needle.draw();

const Ball = function(x, y, dx, dy, radius){
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
    this.minRadius = 5;
    this.color = colorSet[Math.floor(Math.random() * colorSet.length)];
    this.hitBox = [];
    this.isPopped = false;

    this.draw = function(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI, true);
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x-this.radius, this.y);
        ctx.bezierCurveTo(this.x-this.radius+this.radius/5, this.y+this.radius*2, this.x+this.radius-this.radius/5, this.y+this.radius*2, this.x+this.radius, this.y);
        ctx.stroke();
        ctx.fill();

        this.hitBox = this.setHitBox()
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
    }
    

    this.update = function(){
        if(!this.isPopped){
            this.y -= this.dy;
            this.x += this.dx;
        }else{
            this.dy += .1;
            this.y += this.dy;
            (this.radius > this.minRadius)&&(this.radius -= .3 );
        }
        this.draw();
    }
}


const launchBall = () => {
    let timeout = 2000;
    const ballMaxRadius = 45;
    const ballMinRadius = 20;
    let velocity = 2;
    let timer = setInterval(()=>{
        const radius = getRandomInt(ballMinRadius, ballMaxRadius);
        const x = getRandomInt(3+radius, window.innerWidth-radius+3);
        const y = window.innerHeight + radius*2;

        const ball = new Ball(x, y, 0, velocity, radius);
        ball.draw();
        ball.setHitBox();
        balls.push(ball);
    }, timeout)
}

const game = () => {
    requestAnimationFrame(game);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    needle.update();
    needle.draw();
    balls.forEach((ball, index, ballArray) => {
        ball.update();
        let hitBox = ball.hitBox.find(box => {
            return box[0] < 30 && box[0] > 25;
        })

       if(hitBox && (needle.x + 3) <= hitBox[1] && (needle.x + 3) >= hitBox[2]){
           ball.setIsPopped();
       }

       if(ball.isPopped && ball.y > window.innerWidth){
           delete ballArray[index];
       }
    })
}

const getRandomInt = (min, max) => {
    return Math.floor(Math.random()*(max-min)+min);
}


const startGame = () => {
    launchBall();
    game();
}


startGame();
