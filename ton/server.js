const projectName = 'Tonefull';
console.log(`Starting ${projectName} API server...`);

const express = require('express');
const app = express();
const { startChannel, stopChannel, getBalance } = require('./mock_backend');

app.get('/startCall', (req, res) => {
    startChannel();
    res.json({ status: 'Ok' });
});

app.get('/endCall', (req, res) => {
    stopChannel();
    res.json({ status: 'Ok' });
});

app.get('/balance', (req, res) => {
    var balance = getBalance();
    res.json({ balance });
});

app.listen(8888, 'localhost', () => {
    console.log(`Server is running.`);});
