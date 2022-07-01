
var http = require('http');

const projectName = 'Tonefull'
console.log(`Starting HTTP server, project ${projectName}.`)

http.createServer(function (req, res) 
{
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<html>');
  res.write(`<head><title>${projectName}${req.url}</title></head>`);
  res.write('<body>');
  res.write('<p>Hello word from the server!</p>');
  res.write('</body>');
  res.write('</html>');
  res.end();
}
).listen(8888);
