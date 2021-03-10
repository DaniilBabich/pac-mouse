const plan = [
    '.........x.........',
    '.xxx.xxx.x.xxx.xxx.',
    '.xxx.xxx.x.xxx.xxx.',
    '...................',
    '+xxx.x_xxxxx_x.xxx+',
    '.....x___x___x.....',
    'xxxx.xxx_x_xxx.xxxx',
    'xxxx.x___p___x.xxxx',
    'xxxx.x_xx_xx_x.xxxx',
    '#...._________....#',
    'xxxx.x_xx_xx_x.xxxx',
    'xxxx.xr__g__bx.xxxx',
    'xxxx.x_xxxxx_x.xxxx',
    '.........x.........',
    '+xxx.xxx.x.xxx.xxx+',
    '...x.....@.....x...',
    'xx.x.x.xxxxx.x.x.xx',
    '.....x...x...x.....',
    '.xxxxxxx.x.xxxxxxx.',
    '...................',
];

const scale = 30;

class Level {
    constructor(plan) {
        this.width = plan[0].length;
        this.height = plan.length;
        this.actors = [];
        this.status = null;
        this.score = 0;
        const grid = plan.map(row => row.split(''));
        this.grid = grid.map((row, y) => {
            return row.map((symbol, x) => {
                if (typeof symbols[symbol] === 'string') return symbols[symbol];
                if (symbols[symbol] === Cookie || symbols[symbol] === Cheese) {
                    this.actors.unshift(new symbols[symbol](new Vector(x, y)));
                    return 'empty';
                }
                if (symbols[symbol] === Player || symbols[symbol] === Enemy) {
                    this.actors.push(new symbols[symbol](new Vector(x, y), symbol));
                    return 'empty';
                }
            })
        })
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Actor {
    newPositionX(distance, actor, level) {
        const newX = actor.position.x + distance;
        const actorCenterY = actor.position.y + 0.5;
        const isPassesInHeight =
            actorCenterY - Math.floor(actorCenterY) < 0.5 + Math.abs(distance)
            &&
            actorCenterY - Math.floor(actorCenterY) > 0.5 - Math.abs(distance);

        if (distance < 0) {
            if (newX < 0) return false;
            if (level.grid[Math.floor(actorCenterY)][Math.floor(newX)] === 'empty' && isPassesInHeight) {
                return new Vector(newX, Math.floor(actorCenterY));
            }
            if (actor.type === 'player' && level.grid[Math.floor(actorCenterY)][Math.floor(newX)] === 'gate') {
                return new Vector(Math.floor(newX + 17), actor.position.y);
            }
        }

        if (distance > 0) {
            if (newX > level.width - 1) return false;
            if (level.grid[Math.floor(actorCenterY)][Math.ceil(newX)] === 'empty' && isPassesInHeight) {
                return new Vector(newX, Math.floor(actorCenterY));
            }
            if (actor.type === 'player' && level.grid[Math.floor(actorCenterY)][Math.ceil(newX)] === 'gate') {
                return new Vector(Math.ceil(newX - 17), actor.position.y);
            }
        }
    }

    newPositionY(distance, actor, level) {
        const newY = actor.position.y + distance;
        const actorCenterX = actor.position.x + 0.5;
        const isPassesInWidth =
            actorCenterX - Math.floor(actorCenterX) < 0.5 + Math.abs(distance)
            &&
            actorCenterX - Math.floor(actorCenterX) > 0.5 - Math.abs(distance);

        if (distance < 0) {
            if (newY < 0) return false;
            if (level.grid[Math.floor(newY)][Math.floor(actorCenterX)] === 'empty' && isPassesInWidth) {
                return new Vector(Math.floor(actorCenterX), newY);
            }
        }

        if (distance > 0) {
            if (newY > level.height - 1) return false;
            if (level.grid[Math.ceil(newY)][Math.floor(actorCenterX)] === 'empty' && isPassesInWidth) {
                return new Vector(Math.floor(actorCenterX), newY);
            }
        }
    }
}

class Player extends Actor {
    constructor(position) {
        super();
        this.position = position;
        this.size = new Vector(1, 1);
        this.speed = 4;
        this.type = 'player';
    }
}

class Enemy extends Actor {
    constructor(position, symbol) {
        super();
        this.position = position;
        this.restartPosition = new Vector(9, 9);
        this.touchPosition = new Vector(position.x + 0.4, position.y + 0.4);
        this.touchSize = new Vector(0.2, 0.2);
        this.speed = 4;
        this.status = null;
        this.directionState = {
            now: null,
            back: null,
            unlockCountdown: null,
        };
        this.type = 'enemy';
        this.isWhite = false;
        switch (symbol) {
            case 'r':
                this.color = 'red';
                break;
            case 'g':
                this.color = 'green';
                break;
            case 'b':
                this.color = 'blue';
                break;
            case 'p':
                this.color = 'pink';
                this.subtype = 'chaser';
                break;
        }
    }
}

class Cookie {
    constructor(position) {
        this.position = position;
        this.touchPosition = new Vector(position.x + 0.3, position.y + 0.3);
        this.touchSize = new Vector(0.4, 0.4);
        this.type = 'cookie';
    }
}

class Cheese {
    constructor(position) {
        this.position = position;
        this.touchPosition = new Vector(position.x + 0.2, position.y + 0.2);
        this.touchSize = new Vector(0.6, 0.6);
        this.type = 'cheese';
    }
}

const symbols = {
    '_': 'empty',
    'x': 'wall',
    '#': 'gate',
    '@': Player,
    '.': Cookie,
    '+': Cheese,
    'r': Enemy,
    'g': Enemy,
    'b': Enemy,
    'p': Enemy,
}

class Display {
    constructor(level) {
        this.level = level;
        this.canvas = document.querySelector('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = level.width * scale;
        this.canvas.height = level.height * scale;
    }
}

Display.prototype.clearDisplay = function () {
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

const wallSprite = document.createElement("img");
wallSprite.src = "./img/wall.png";
const gateSprite = document.createElement("img");
gateSprite.src = "./img/gate.png";

Display.prototype.drawBackground = function () {
    for (let y = 0; y < this.level.height; y++) {
        for (let x = 0; x < this.level.width; x++) {
            switch (this.level.grid[y][x]) {
                case 'wall':
                    this.context.drawImage(wallSprite, x * scale, y * scale);
                    break;
                case 'gate':
                    this.context.drawImage(gateSprite, x * scale, y * scale);
                    break;
            }
        }
    }
}

const playerLeftSprite1 = document.createElement("img");
playerLeftSprite1.src = "./img/mouse-left-1.png";
const playerLeftSprite2 = document.createElement("img");
playerLeftSprite2.src = "./img/mouse-left-2.png";
const playerRightSprite1 = document.createElement("img");
playerRightSprite1.src = "./img/mouse-right-1.png";
const playerRightSprite2 = document.createElement("img");
playerRightSprite2.src = "./img/mouse-right-2.png";
const playerUpSprite1 = document.createElement("img");
playerUpSprite1.src = "./img/mouse-up-1.png";
const playerUpSprite2 = document.createElement("img");
playerUpSprite2.src = "./img/mouse-up-2.png";
const playerDownSprite1 = document.createElement("img");
playerDownSprite1.src = "./img/mouse-down-1.png";
const playerDownSprite2 = document.createElement("img");
playerDownSprite2.src = "./img/mouse-down-2.png";

Display.prototype.drawPlayer = function (actor, isChangingFrame) {
    switch (playerDirectionState.now) {
        case 'left':
            if (isChangingFrame) this.context.drawImage(playerLeftSprite1, actor.position.x * scale, actor.position.y * scale);
            else this.context.drawImage(playerLeftSprite2, actor.position.x * scale, actor.position.y * scale);
            break;
        case 'right':
            if (isChangingFrame) this.context.drawImage(playerRightSprite1, actor.position.x * scale, actor.position.y * scale);
            else this.context.drawImage(playerRightSprite2, actor.position.x * scale, actor.position.y * scale);
            break;
        case 'up':
            if (isChangingFrame) this.context.drawImage(playerUpSprite1, actor.position.x * scale, actor.position.y * scale);
            else this.context.drawImage(playerUpSprite2, actor.position.x * scale, actor.position.y * scale);
            break;
        case 'down':
            if (isChangingFrame) this.context.drawImage(playerDownSprite1, actor.position.x * scale, actor.position.y * scale);
            else this.context.drawImage(playerDownSprite2, actor.position.x * scale, actor.position.y * scale);
            break;
        case null:
            if (isChangingFrame) this.context.drawImage(playerRightSprite1, actor.position.x * scale, actor.position.y * scale);
            else this.context.drawImage(playerRightSprite2, actor.position.x * scale, actor.position.y * scale);
    }
}

const cookieSprite = document.createElement("img");
cookieSprite.src = "./img/cookie.png";
const cheeseSprite = document.createElement("img");
cheeseSprite.src = "./img/cheese.png";
const catRedSprite = document.createElement("img");
catRedSprite.src = "./img/cat-red.png";
const catGreenSprite = document.createElement("img");
catGreenSprite.src = "./img/cat-green.png";
const catBlueSprite = document.createElement("img");
catBlueSprite.src = "./img/cat-blue.png";
const catPinkSprite = document.createElement("img");
catPinkSprite.src = "./img/cat-pink.png";
const catWhiteSprite = document.createElement("img");
catWhiteSprite.src = "./img/cat-white.png";

Display.prototype.drawActors = function (unlockCountdown) {
    const isChangingFrame = Math.floor(Date.now() / 250) % 2;
    const catColoring = (actor, sprite) => {
        if (actor.isWhite && actor.status === 'scared' && unlockCountdown < 2 && isChangingFrame) {
            this.context.drawImage(sprite, actor.position.x * scale, actor.position.y * scale);
        } else if (actor.isWhite) {
            this.context.drawImage(catWhiteSprite, actor.position.x * scale, actor.position.y * scale);
        } else this.context.drawImage(sprite, actor.position.x * scale, actor.position.y * scale);
    }
    for (const actor of this.level.actors) {
        switch (actor.type) {
            case 'cookie':
                this.context.drawImage(cookieSprite, actor.position.x * scale, actor.position.y * scale);
                break;
            case 'cheese':
                this.context.drawImage(cheeseSprite, actor.position.x * scale, actor.position.y * scale);
                break;
            case 'player':
                this.drawPlayer(actor, isChangingFrame);
                break;
            case 'enemy':
                switch (actor.color) {
                    case 'red':
                        catColoring(actor, catRedSprite);
                        break;
                    case 'green':
                        catColoring(actor, catGreenSprite);
                        break;
                    case 'blue':
                        catColoring(actor, catBlueSprite);
                        break;
                    case 'pink':
                        catColoring(actor, catPinkSprite);
                        break;
                }
                break;
        }
    }
}

Display.prototype.drawFrame = function (unlockCountdown) {
    this.clearDisplay();
    this.drawBackground();
    this.drawActors(unlockCountdown);
};

const playerDirectionState = {
    now: null,
    new: null
}

addEventListener("keydown", (event) => {
    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            playerDirectionState.new = 'left';
            break;
        case 'ArrowRight':
            event.preventDefault();
            playerDirectionState.new = 'right';
            break;
        case 'ArrowUp':
            event.preventDefault();
            playerDirectionState.new = 'up';
            break;
        case 'ArrowDown':
            event.preventDefault();
            playerDirectionState.new = 'down';
            break;
    }
})

Player.prototype.act = function (timeStep, level) {
    for (let i = 0; i < level.actors.length; i++) {
        if (
            level.actors[i] !== this
            &&
            level.actors[i].touchPosition.x + level.actors[i].touchSize.x > this.position.x
            &&
            level.actors[i].touchPosition.x < this.position.x + this.size.x
            &&
            level.actors[i].touchPosition.y + level.actors[i].touchSize.y > this.position.y
            &&
            level.actors[i].touchPosition.y < this.position.y + this.size.y
        ) {
            switch (level.actors[i].type) {
                case 'cookie':
                    level.score += 10;
                    level.actors.splice(i, 1);
                    if (!level.actors.some(actor => actor.type === 'cookie' || actor.type === 'cheese')) level.status = 'won';
                    break;
                case 'cheese':
                    level.score += 50;
                    level.scoreFactor = 1;
                    level.status = 'reverse';
                    level.actors.splice(i, 1);
                    if (!level.actors.some(actor => actor.type === 'cookie' || actor.type === 'cheese')) level.status = 'won';
                    for (let i = level.actors.length - 2; i >= 0; i--) {
                        if (level.actors[i].type === 'enemy') {
                            if (!level.actors[i].status) {
                                level.actors[i].status = 'scared';
                                level.actors[i].speed = 2;
                                level.actors[i].isWhite = true;
                                level.actors[i].directionState.unlockCountdown = null;
                                switch (level.actors[i].directionState.now) {
                                    case 'left':
                                        level.actors[i].directionState.now = 'right';
                                        level.actors[i].directionState.back = 'left';
                                        break;
                                    case 'right':
                                        level.actors[i].directionState.now = 'left';
                                        level.actors[i].directionState.back = 'right';
                                        break;
                                    case 'up':
                                        level.actors[i].directionState.now = 'down';
                                        level.actors[i].directionState.back = 'up';
                                        break;
                                    case 'down':
                                        level.actors[i].directionState.now = 'up';
                                        level.actors[i].directionState.back = 'down';
                                        break;
                                }
                            }
                        } else break;
                    }
                    break;
                case 'enemy':
                    switch (level.actors[i].status) {
                        case 'scared':
                            level.score += 250 * level.scoreFactor++;
                            level.actors[i].status = 'beaten';
                            level.actors[i].speed = 6;
                            level.actors[i].directionState.now = null;
                            level.actors[i].directionState.back = null;
                            level.actors[i].directionState.unlockCountdown = null;
                            break;
                        case null:
                            level.status = 'lose';
                            break;
                    }
                    break;
            }
            break;
        }
    }

    const calculateNewPosition = (direction) => {
        switch (direction) {
            case 'left':
                return this.newPositionX(-this.speed * timeStep, this, level);
            case 'right':
                return this.newPositionX(this.speed * timeStep, this, level);
            case 'up':
                return this.newPositionY(-this.speed * timeStep, this, level);
            case 'down':
                return this.newPositionY(this.speed * timeStep, this, level);
        }
    }

    let newPosition;
    if (playerDirectionState.new) newPosition = calculateNewPosition(playerDirectionState.new);
    if (newPosition) {
        playerDirectionState.now = playerDirectionState.new;
        playerDirectionState.new = null;
        this.position = newPosition;
    } else if (playerDirectionState.now) {
        newPosition = calculateNewPosition(playerDirectionState.now);
        if (newPosition) this.position = newPosition;
    }
}

Enemy.prototype.act = function (timeStep, level) {
    const directions = {};

    let newPosition;
    newPosition = this.newPositionX(-this.speed * timeStep, this, level);
    if (newPosition) directions.left = newPosition;
    newPosition = this.newPositionX(this.speed * timeStep, this, level);
    if (newPosition) directions.right = newPosition;
    newPosition = this.newPositionY(-this.speed * timeStep, this, level);
    if (newPosition) directions.up = newPosition;
    newPosition = this.newPositionY(this.speed * timeStep, this, level);
    if (newPosition) directions.down = newPosition;

    if (this.directionState.back && Object.keys(directions).length > 1) delete directions[this.directionState.back];

    const chaserNewPosition = (target) => {
        if (this.directionState.unlockCountdown > 0) {
            this.directionState.unlockCountdown--;
        } else if (Object.keys(directions).length > 1) {
            const differenceX = target.x - this.position.x;
            const differenceY = target.y - this.position.y;
            let newDirection;
            if (Math.abs(differenceX) >= Math.abs(differenceY) && differenceX < 0) {
                if (directions['left']) newDirection = 'left';
                else if (directions['up'] && differenceY <= 0) newDirection = 'up';
                else if (directions['down'] && differenceY >= 0) newDirection = 'down';
                else newDirection = this.directionState.now || 'right';
            } else if (Math.abs(differenceX) >= Math.abs(differenceY) && differenceX > 0) {
                if (directions['right']) newDirection = 'right';
                else if (directions['up'] && differenceY <= 0) newDirection = 'up';
                else if (directions['down'] && differenceY >= 0) newDirection = 'down';
                else newDirection = this.directionState.now || 'left';
            } else if (Math.abs(differenceX) <= Math.abs(differenceY) && differenceY < 0) {
                if (directions['up']) newDirection = 'up';
                else if (directions['left'] && differenceX <= 0) newDirection = 'left';
                else if (directions['right'] && differenceX >= 0) newDirection = 'right';
                else newDirection = this.directionState.now || 'down';
            } else if (Math.abs(differenceX) <= Math.abs(differenceY) && differenceY > 0) {
                if (directions['down']) newDirection = 'down';
                else if (directions['left'] && differenceX <= 0) newDirection = 'left';
                else if (directions['right'] && differenceX >= 0) newDirection = 'right';
                else newDirection = this.directionState.now || 'up';
            }
            if (this.directionState.now && this.directionState.now !== newDirection) this.directionState.unlockCountdown = 4;
            this.directionState.now = newDirection;
        } else {
            if (this.directionState.now !== Object.keys(directions)[0]) this.directionState.unlockCountdown = 4;
            this.directionState.now = Object.keys(directions)[0];
        }
        this.position = directions[this.directionState.now];
        this.touchPosition = new Vector(this.position.x + 0.4, this.position.y + 0.4);
    }

    const randomNewPosition = () => {
        const randomDirection = Object.keys(directions)[Math.floor(Math.random() * Object.keys(directions).length)];
        if (this.directionState.unlockCountdown > 0) {
            this.directionState.unlockCountdown--;
        } else if (this.directionState.now !== randomDirection) {
            this.directionState.unlockCountdown = 4;
            this.directionState.now = randomDirection;
        }
        this.position = directions[this.directionState.now];
        this.touchPosition = new Vector(this.position.x + 0.4, this.position.y + 0.4);
    }

    if (this.status === 'beaten') {
        if (
            Math.abs(this.restartPosition.y - this.position.y) < timeStep * this.speed
            &&
            Math.abs(this.restartPosition.x - this.position.x) < timeStep * this.speed
        ) {
            this.position = this.restartPosition;
            this.speed = 4;
            this.status = null;
            this.isWhite = false;
            if (this.subtype === 'chaser') {
                this.directionState.now = null;
                this.directionState.back = null;
                this.directionState.unlockCountdown = null;
            }
        } else chaserNewPosition(this.restartPosition);
    } else if (this.status === 'scared') {
        randomNewPosition();
    } else if (this.subtype === 'chaser') {
        const player = level.actors[level.actors.length - 1];
        chaserNewPosition(player.position);
    } else randomNewPosition();

    switch (this.directionState.now) {
        case 'left':
            this.directionState.back = 'right';
            break;
        case 'right':
            this.directionState.back = 'left';
            break;
        case 'up':
            this.directionState.back = 'down';
            break;
        case 'down':
            this.directionState.back = 'up';
            break;
    }
}

const startGame = (display) => {
    let lastTime = null;
    let unlockCountdown;
    let stop = false;

    const frame = (time) => {
        let timeStep = (time - lastTime) / 1000;
        lastTime = time;
        if (timeStep < 0.1) {
            switch (display.level.status) {
                case 'won':
                    stopGame(display.level);
                    stop = true;
                    break;
                case 'lose':
                    stopGame(display.level);
                    stop = true;
                    break;
                case 'reverse':
                    unlockCountdown = 5;
                    display.level.status = null;
                    break;
                case null:
                    if (unlockCountdown > 0) unlockCountdown -= timeStep;
                    else if (unlockCountdown < 0) {
                        for (let i = display.level.actors.length - 2; i >= 0; i--) {
                            if (display.level.actors[i].type === 'enemy') {
                                if (display.level.actors[i].status === 'scared') {
                                    display.level.actors[i].speed = 4;
                                    display.level.actors[i].status = null;
                                    display.level.actors[i].isWhite = false;
                                    if (display.level.actors[i].subtype === 'chaser') {
                                        display.level.actors[i].directionState.now = null;
                                        display.level.actors[i].directionState.back = null;
                                        display.level.actors[i].directionState.unlockCountdown = null;
                                    }
                                }
                            } else break;
                        }
                        unlockCountdown = undefined;
                    }
                    break;
            }
            for (const actor of display.level.actors) {
                if (actor.act) actor.act(timeStep, display.level);
            }
            display.drawFrame(unlockCountdown);
            score.textContent = `SCORE: ${display.level.score}`;
        }
        if (!stop) requestAnimationFrame(frame);
    }

    start.removeEventListener("click", click);
    document.removeEventListener("keydown", enter);
    title.remove();
    start.remove();
    display.drawFrame();
    gameWrapper.style.display = 'grid';

    const timerId = setInterval(() => {
        countdown.textContent--;
        if (countdown.textContent === '0') {
            clearInterval(timerId);
            countdown.remove();
            requestAnimationFrame(frame);
        }
    }, 1000);
}

const stopGame = (level) => {
    gameWrapper.remove();

    const message = document.createElement('div');
    message.className = 'message';
    document.body.append(message);

    switch (level.status) {
        case 'won':
            message.textContent = 'YOU WON';
            break;
        case 'lose':
            message.textContent = 'YOU LOSE';
            break;
    }

    const finalScore = document.createElement('div');
    finalScore.className = 'finalScore';
    document.body.append(finalScore);
    finalScore.textContent = `SCORE: ${level.score}`;

    setTimeout(() => location.reload(), 3000);
}

const title = document.querySelector('.title');
const start = document.querySelector('.start');
const gameWrapper = document.querySelector('.gameWrapper');
const score = document.querySelector('.score');
const countdown = document.querySelector('.countdown');

const click = () => {
    startGame(new Display(new Level(plan)));
}
start.addEventListener("click", click);

const enter = (event) => {
    if (event.key === 'Enter') startGame(new Display(new Level(plan)));
}
document.addEventListener("keydown", enter);