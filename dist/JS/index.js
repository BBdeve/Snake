"use strict";
const controlsMap = new Map([
    ['ArrowUp', document.querySelector('.control-keys__up')],
    ['ArrowDown', document.querySelector('.control-keys__down')],
    ['ArrowLeft', document.querySelector('.control-keys__left')],
    ['ArrowRight', document.querySelector('.control-keys__right')],
]);
let isButtonPressed = false;
window.addEventListener('keydown', evt => {
    evt.preventDefault();
    const currentKey = evt.key;
    if (isButtonPressed)
        return;
    if ((currentKey !== 'ArrowUp' &&
        currentKey !== 'ArrowDown' &&
        currentKey !== 'ArrowLeft' &&
        currentKey !== 'ArrowRight'))
        return;
    const activeButton = controlsMap.get(currentKey);
    activeButton.classList.add('active');
    isButtonPressed = true;
    window.addEventListener('keyup', function keyUpHandler(evt) {
        if (evt.key !== currentKey)
            return;
        activeButton.classList.remove('active');
        isButtonPressed = false;
        this.window.removeEventListener('keyup', keyUpHandler);
    });
});
document.body.addEventListener('load', () => console.log("asdsad"));
