
var objTimer = null;
var justSomeNumber = 10.05643;
const justSomeRate = 0.0001;


function getBalance()
{
    return justSomeNumber;
}

function getCostPerSecond()
{
    return justSomeRate;
}

function startChannel()
{
    var startTimestamp = Date.now();
    objTimer = setTimeout(function() {
        var deltaInMsec = Date.now() - startTimestamp;
        
        var deltaInSeconds = Math.floor(deltaInMsec / 1000);
      
        justSomeNumber -= justSomeRate * deltaInSeconds;

    }, 1000); // update about every second    
}

function stopChannel()
{
    if(objTimer !== null)
    {
        clearTimeout(objTimer);
        objTimer = null;
    }
}

module.exports = { startChannel, stopChannel, getBalance };