
// Global
var MAX_USERS = 5;
var num_of_users = 0;

// Using express: http://expressjs.com/
var express = require('express');
// Create the app
var app = express();

// Load sqlite3 database (shapes.db)
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./shapes.db', sqlite3.OPEN_READWRITE, (err) => {
	if(err){
		console.log(err.message);
	}
	console.log('Connected to the in-memory SQlite database.');
});

// Set up the server
// process.env.PORT is related to deploying on heroku
var server = app.listen(process.env.PORT || 3000, listen);

// This call back just tells us that the server has started
function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server listening at http://' + host + ':' + port);
}

// Permission for public directory
app.use(express.static('public'));

// Pick behavior for user connecting to server
var io = require('socket.io')(server);
io.sockets.on('connection',connection_handler);

function connection_handler(socket) {

	var address = socket.handshake.address;
	console.log(address);
	// New/Old client just connected
	console.log("We have a new client: " + socket.id);
    update_canvas_sql3(socket);

    socket.on('click', function(data) {
    	// Data comes in as whatever was sent, including objects
        console.log("Received: 'click' " + data.x + " " + data.y);
        if(data.shape != 3){
	      	let sql = `INSERT INTO canvas
	        			VALUES(`+ data.shape + `,` + data.x + `,` + data.y + `);`
			db.run(sql, [], function(err) {
								if (err){
									console.log(err.message);
								}
								console.log("shape has been added to db");
			});
		}
        // Send it to all other clients
        socket.broadcast.emit('click', data);
        
        // This is a way to send to everyone including sender
        // io.sockets.emit('message', "this goes to everyone");
    });

    socket.on('disconnect', function() {
    	console.log("Client has disconnected");
    });
}



function update_canvas_sql3(socket) {
	// db = sqlite3.open('/shapes.db');
	db.serialize(() => {
	  db.each(`SELECT *
	           FROM canvas`, (err, row) => {
	    if (err) {
	      console.error(err.message);
	    }
	    data = {
	    	x: row.posx,
	    	y: row.posy,
	    	shape: row.shapeID 
	    };
	    // console.log(data);
	    socket.emit('click', data);
	  });
	});
}






