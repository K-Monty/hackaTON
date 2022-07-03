
const fs = require('fs').promises;
const express = require('express');

const app = express();
const projectName = 'Tonefull';
console.log(`Starting HTTP server, project ${projectName}...`);

app.use(express.static('call_buttons/static'));

app.get('/', (req, res) => {
    fs.readFile("./call_buttons/animation/call.html").then(contents => {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
    //    res.write('<link rel="stylesheet" type="text/css" href="call_buttons/to_call_button/button.css" />');
        res.end(contents);
    });
  });

app.listen(8888, 'localhost', () => {
    console.log(`Server is running.`);});
