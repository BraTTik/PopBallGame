const timer = (time) => {
    let timeout = time;
    let timerId;
    return function(){
        if(timerId) clearTimeout(timerId);
        timerId = setTimeout(()=>{
            console.log(timeout)
            if(timeout > 0)
                timer(timeout - 100)();
        }, timeout)
    } 
}

const startTimer = timer(2000);

startTimer();