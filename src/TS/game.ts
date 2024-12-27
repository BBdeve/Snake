let lastTime: number;
let tickTime: number = 0.7; // in seconds
let tickTimer: number = 0;


// Global variables
const CONTROLS: Map<string, string> = new Map([
  ['ArrowLeft', 'left'],
  ['ArrowUp', 'up'],
  ['ArrowDown', 'down'],
  ['ArrowRight', 'right'],
])


const GAME_WIDTH = 585;
const GAME_HEIGHT = 585;
let gridSize = 10;

interface gameObjectPosition {
  posX: number,
  posY: number
}

interface gameObjectSize {
  width: number,
  height: number
}

interface Vector2D {
  x: number,
  y: number
}
export default class Game{
  ctx: CanvasRenderingContext2D;
  levels: Level[];
  currentLevel: Level;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    this.ctx = canvas.getContext('2d')!;
    this.levels = [new Level(this.ctx)];
    this.currentLevel = this.levels[0];

    this.renderGlobalFrame = this.renderGlobalFrame.bind(this)
    this.renderGameGrid = this.renderGameGrid.bind(this);
    this.start = this.start.bind(this);
    this.pauzeToggle = this.pauzeToggle.bind(this);
    this.restart = this.restart.bind(this);

    window.addEventListener('keydown', (evt: KeyboardEvent) => {
      if(evt.key === 'p') this.pauzeToggle()
      if(evt.key === 'r') this.restart()
    })
  }

  start(): void {
    AddControls(this.currentLevel.snake, CONTROLS);
    requestAnimationFrame(this.renderGlobalFrame);
  }
  
  pauzeToggle(): void {
    if(!this.currentLevel.isPaused) {
      this.ctx.globalAlpha = 0.2
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.ctx.globalAlpha = 1;
      this.ctx.font = '50px "Roboto", Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText("PAUSE", GAME_WIDTH / 2, GAME_HEIGHT / 2);
    } else {
      
    }
      this.currentLevel.isPaused = !this.currentLevel.isPaused;
  }
  
  restart(): void {
    tickTime = 0.7;
    gridSize = 10;
    this.levels = [new Level(this.ctx)];
    this.currentLevel = this.levels[0];
    AddControls(this.currentLevel.snake, CONTROLS);
    const scoreDisplay = document.querySelector('.game__points .red-text')!;
    scoreDisplay.textContent = this.currentLevel.points.toString();
  }

  renderGlobalFrame(timestamp: DOMHighResTimeStamp): void {
    if(lastTime === undefined) lastTime = timestamp
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if(!this.currentLevel.isPaused) this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.renderGameGrid(gridSize);
    this.currentLevel.renderEntities(deltaTime);
    requestAnimationFrame(this.renderGlobalFrame)
  }

  renderGameGrid(rows: number, columns: number | null = null) {
    let currentRow = 1;

    this.ctx.beginPath();

    while(currentRow < rows) {
      const currentY = (currentRow++) * (GAME_HEIGHT / rows);

      this.ctx.moveTo(0, currentY);
      this.ctx.lineTo(GAME_WIDTH, currentY);
      
      if(columns !== null) continue;
      
      this.ctx.moveTo(currentY, 0);
      this.ctx.lineTo(currentY, GAME_HEIGHT);
    }

    if(columns !== null) {
      let currentColumn = 1;

      while(currentColumn < columns) {
        const currentX = (currentColumn++) * (GAME_WIDTH / columns);
  
        this.ctx.moveTo(currentX, 0);
        this.ctx.lineTo(currentX, GAME_HEIGHT);      
      }
    }

    this.ctx.stroke();
    this.ctx.closePath();
  }
}

class Level{
  isPaused: boolean;
  points: number
  _initialEntitySet: GameObject[];
  entities: GameObject[];
  snake: Snake;
  entityScale: Vector2D;
  ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.isPaused = false;
    this.entityScale = {x: GAME_WIDTH / gridSize, y: GAME_HEIGHT / gridSize}
    this._initialEntitySet = [new Snake({posX: 1, posY: 1}, {width: this.entityScale.x, height: this.entityScale.y}, this)];
    this.entities = this._initialEntitySet.slice(0);
    this.ctx = ctx;
    this.snake = this._initialEntitySet[0] as Snake;
    this.points = 0;

    this.spawnFood(new Food({posX: 5, posY: 5}, {width: this.entityScale.x, height: this.entityScale.y}, this));
  }

  updateLevelScaling(): void {
    this.entityScale = {x: GAME_WIDTH / gridSize, y: GAME_HEIGHT / gridSize};
  }

  renderEntities(deltaTime: number): void {
    if(this.isPaused) return;

    this.entities.forEach(entity => {
      if(entity.onRender !== null) entity.onRender(deltaTime)
      entity.draw(this.ctx)
    })
  }

  addEntity(entity: GameObject) {
    this.entities.push(entity);
  }

  spawnFood(food: Food) {
    this.addEntity(food)
  }

  respawnFood() {
    const pointsDisplay = document.querySelector('.game__points .red-text')!;
    this.points += 10;
    pointsDisplay.textContent = this.points.toString();

    this.entities = this.entities.filter(entity => entity.type !== 'Food');

    let newPosX = Math.floor(Math.random() * gridSize);
    let newPosY = Math.floor(Math.random() * gridSize);

    // [... {posX, posY}, ...] === {posX: rand, posY: rand}

    for(let i = 0; i < this.entities.length; i++) {
      if(newPosX === this.entities[i].posX && newPosY === this.entities[i].posY) {
        newPosX = Math.floor(Math.random() * gridSize);
        newPosY = Math.floor(Math.random() * gridSize);
        i--;
      }
    }

    this.spawnFood(new Food({posX: newPosX, posY: newPosY}, {width: this.entityScale.x, height: this.entityScale.y}, this));
  }
}

class GameObject{
  _parentLevel: Level;
  posX: number;
  posY: number;
  width: number;
  height: number;
  direction: string | null;
  bodyColor: string;
  type: string;

  constructor({posX, posY}: gameObjectPosition, {width, height}: gameObjectSize, parentLevel: Level) {
    this._parentLevel = parentLevel;
    this.posX = posX;
    this.posY = posY;
    this.width = width;
    this.height = height;
    this.direction = null;
    this.bodyColor = 'black';
    this.type = this.constructor.name;

    this.draw = this.draw.bind(this);
    if(this.onRender !== null) this.onRender = this.onRender.bind(this);
    this.watchForCollisions = this.watchForCollisions.bind(this);
  }

  get parentLevel() {
    return this._parentLevel;
  }

  onRender(deltaTime: number) {}

  move(direction: string, deltaTime: number) {
    if(direction === 'left') this.posX --;
    if(direction === 'right') this.posX ++;
    if(direction === 'up') this.posY --;
    if(direction === 'down') this.posY ++;
  }

  watchForCollisions() {
    this.parentLevel.entities.forEach(entity => {
      if(entity === this) return;

      if(
        entity.posX === this.posX &&
        entity.posY === this.posY
      ) this.onCollision.apply(this, [entity])
    })
  }

  onCollision(gameObject: GameObject) {}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.bodyColor;
    ctx.fillRect(this.posX * this.parentLevel.entityScale.x, this.posY * this.parentLevel.entityScale.y, this.parentLevel.entityScale.x, this.parentLevel.entityScale.y)
  }
}

class Snake extends GameObject{
  tail: TailSegment[];
  previousDirection: string;

  constructor({posX, posY}: gameObjectPosition, {width, height}: gameObjectSize, parentLevel: Level){
    super({posX, posY}, {width, height}, parentLevel);
    this.direction = "right";
    this.previousDirection = this.direction;
    this.tail = []
    this.bodyColor = 'red';
    this.grow = this.grow.bind(this);

    this.tailUpdate = this.tailUpdate.bind(this);

    this.watchForCollisions = () => {
      if(
        this.posX >= gridSize ||
        this.posY >= gridSize ||
        this.posX < 0 ||
        this.posY < 0
      ) this.onCollision(new TailSegment({posX: -1, posY: -1}, {width: 0, height: 0}, this.parentLevel));
      
      super.watchForCollisions.apply(this)
    }
  }

  onRender(deltaTime: number): void {
    tickTimer += deltaTime;
    
    if(tickTimer < (tickTime * 1000)) return;
    tickTimer = 0;

    this.move(this.direction === null ? "right" : this.direction, deltaTime);
    if(this.tail.length === 0) this.watchForCollisions();

    this.tailUpdate(deltaTime);
    this.previousDirection = this.direction!;
  }

  grow(){
    let tailPosition: gameObjectPosition = this.tail.length === 0 ? {posX: this.posX, posY: this.posY} : {posX: this.tail[this.tail.length -1 ].posX, posY: this.tail[this.tail.length -1 ].posY};

    if(this.tail.length === 0) {
      if(this.direction === 'up') tailPosition.posY++;
      if(this.direction === 'right') tailPosition.posX--;
      if(this.direction === 'down') tailPosition.posY--;
      if(this.direction === 'left') tailPosition.posX++;
    }

    const newTailSegment = new TailSegment(tailPosition, {width: this.width, height: this.height}, this.parentLevel);

    this.tail.push(newTailSegment);
    this.parentLevel.addEntity(newTailSegment);

    tickTime -= tickTime / 10;
    if(this.parentLevel.points > 0 && this.parentLevel.points % 80 === 0) gridSize += 3;
    this.parentLevel.updateLevelScaling();
  }

  tailUpdate(deltaTime: number) {
    if(this.tail.length === 0) return;

    let directionToPass = this.previousDirection;

    this.tail.forEach(tailSegment => {
      [tailSegment.direction, directionToPass] = [directionToPass, tailSegment.direction!];
      
      if(tailSegment.isMovementLocked) tailSegment.isMovementLocked = false;
      else tailSegment.move(tailSegment.direction, deltaTime);
    })
    this.watchForCollisions();
  }

  onCollision(gameObject: GameObject): void {
    if(gameObject.type !== 'Food') {
      this.parentLevel.isPaused = true;
      this.parentLevel.ctx.globalAlpha = 0.2
      this.parentLevel.ctx.fillStyle = 'black';
      this.parentLevel.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.parentLevel.ctx.globalAlpha = 1;
      this.parentLevel.ctx.font = '50px "Roboto", Arial';
      this.parentLevel.ctx.textAlign = 'center';
      this.parentLevel.ctx.fillText("JOBBER", GAME_WIDTH / 2, GAME_HEIGHT / 2);

      return;
    };

    this.grow();
    this.parentLevel.respawnFood();
  }
}

class TailSegment extends GameObject {
  isMovementLocked: boolean;

  constructor({posX, posY}: gameObjectPosition, {width, height}: gameObjectSize, parentLevel: Level) {
    super({posX, posY}, {width, height}, parentLevel)
    this.isMovementLocked = true;
  }
}

class Food extends GameObject {
  constructor({posX, posY}: gameObjectPosition, {width, height}: gameObjectSize, parentLevel: Level) {
    super({posX, posY}, {width, height}, parentLevel);
    this.bodyColor = "green";
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = this.bodyColor;
    
    ctx.arc(
      (this.posX * this.parentLevel.entityScale.x) + (this.parentLevel.entityScale.x / 2), 
      (this.posY * this.parentLevel.entityScale.y) + (this.parentLevel.entityScale.y / 2), 
      this.width / 3,
      0,
      2* Math.PI
    );
    ctx.fill();
  }
}

function AddControls(snake: Snake, controls: Map<string, string>) {
  window.addEventListener("keydown", (evt: KeyboardEvent) => {
    const moveDirection = controls.get(evt.key) || null;
    if(moveDirection === null ) return;
    if(
      snake.tail.length !== 0 &&
      (
        moveDirection === 'up' && (snake.posY - 1 === snake.tail[0].posY) ||
        moveDirection === 'right' && (snake.posX + 1 === snake.tail[0].posX) ||
        moveDirection === 'down' && (snake.posY + 1 === snake.tail[0].posY) ||
        moveDirection === 'left' && (snake.posX - 1 === snake.tail[0].posX)
      )
    ) return;

    snake.direction = moveDirection;
  })
}

function searchValuesInArray(array: any[], elem: any) {
  const typeToString = Object.prototype.toString;

  // If elem is string do this
  if(typeToString.call(elem) === '[object String]') {
    for(let i = 0; i < array.length; i++) {
      if(array[i] === elem) return true;
    }
  }

  // If elem i an array do this
  if(typeToString.call(elem) === '[object Array]') {
    for(let i = 0; i < elem.length; i++) {
      for(let j = 0; j < array.length; j++) {
        if(array[j] === elem[i]) return true;
      }
    }
  }
  
  // If elem i an object do this
  if(typeToString.call(elem) === '[object Object]') {
    for(let i of Object.keys(elem)) {
      for(let j = 0; j < array.length; j++) {
        if (array[j] === elem[i]) return true;
      }
    }
  }

  return false;
}