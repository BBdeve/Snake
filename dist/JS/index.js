import Game from "./game.js";
const controlsMap = new Map([
    ['ArrowUp', document.querySelector('.control-keys__up')],
    ['ArrowDown', document.querySelector('.control-keys__down')],
    ['ArrowLeft', document.querySelector('.control-keys__left')],
    ['ArrowRight', document.querySelector('.control-keys__right')],
]);
window.addEventListener('keydown', evt => {
    evt.preventDefault();
    const currentKey = evt.key;
    if ((currentKey !== 'ArrowUp' &&
        currentKey !== 'ArrowDown' &&
        currentKey !== 'ArrowLeft' &&
        currentKey !== 'ArrowRight'))
        return;
    const activeButton = controlsMap.get(currentKey);
    activeButton.classList.add('active');
    window.addEventListener('keyup', function keyUpHandler(evt) {
        if (evt.key !== currentKey)
            return;
        activeButton.classList.remove('active');
        this.window.removeEventListener('keyup', keyUpHandler);
    });
});
document.body.addEventListener('load', () => console.log("asdsad"));
const game = new Game(document.querySelector('canvas'));
console.log('Bruh 1.0.0 release');
game.start();
