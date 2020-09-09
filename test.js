const m5 = 1000 * 60 * 5;

const ms = 300000;

const mins = Math.floor(ms / (60*1000));
const secs = (ms - (mins * 60 * 1000)) / 1000;
console.log(`${mins} : ${secs}`);