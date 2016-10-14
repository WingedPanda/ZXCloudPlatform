import http from "http";
import app from "./app";

let server = null;

function setup()
{
    const port = normalizePort(process.env.PORT || '3000')
    app.set("port",port);
    
    server = http.createServer(app);
    server.listen(port);
    server.on('error', onError);
    
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val)
{
    let port = parseInt(val, 10);  
    if (isNaN(port))    
    {
        return val;
    }
    if (port >= 0)
    {
        return port;
    }
    return false;
    
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

export default {
    app,
    server,
    setup
};