// Global var for inside logic (who gets the emit)
var all_users = true;

// How many shapes per user per day
var MAX_SHAPES_PER_DAY = 50;


// Using express: http://expressjs.com/
var express = require('express');
var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('./shapes.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
});


function update_canvas_sql3(socket, all_users) {
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
                shape: row.shapeID,
                color: row.color
            };
            if (all_users)
                socket.broadcast.emit('click', data);
            else socket.emit('click', data);
        });
    });
}

// Create the app
var app = express();


// Set up the server
var server = app.listen(process.env.PORT || 3000, listen);

// This call back just tells us that the server has started
function listen() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server listening at http://' + host + ':' + port);
}

app.use(express.static('public'));


var io = require('socket.io')(server);

io.sockets.on('connection',
    // We are given a websocket object in our function
    function(socket) {

        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        newdate = day + "/" + month + "/" + year;

        const address = String(socket.handshake.headers["x-forwarded-for"]).split(",")[0];
        // console.log(address);

        console.log("We have a new client: " + address + " " + newdate);

        update_canvas_sql3(socket, !all_users);

        // When this user emits, client side: socket.emit('otherevent',some data);
        socket.on('click',
            function(data) {
                // get x,y = null when user wants to delete his shapes
                if (data.x === null && data.y === null) {
                    delete_user_shapes(address, () => {
                        socket.broadcast.emit('click', data);
                        socket.emit('click', data);
                        update_canvas_sql3(socket, all_users);
                        update_canvas_sql3(socket, !all_users);
                    });
                } else {
                    get_num_of_shapes(address, newdate, (num_of_shapes) => {
                        // Data comes in as whatever was sent, including objects
                        console.log("Received: 'click' " + data.x + " " + data.y);

                        if (num_of_shapes + 1 < MAX_SHAPES_PER_DAY) {
                            let sql = `INSERT INTO canvas
                                   VALUES(` + data.shape + `,` + data.x + `,` +
                                data.y + `,` + '"' + address + '"' + ',' + '"' + newdate + '"' + `,` + data.color + `);`
                            db.run(sql, [], function(err) {
                                if (err) {
                                    console.log(err.message);
                                }
                                console.log("shape has been added to db");
                            });
                            console.log(MAX_SHAPES_PER_DAY - (num_of_shapes + 1) + " shapes left for user " + address);
                            // Send it to all other clients
                            // This is a way to send to everyone including sender
                            socket.broadcast.emit('click', data);
                        } else socket.emit('click', "No more shapes for today. therefore you only changing your board !");
                    });
                }
            }
        );


        // update_canvas_sql3(socket);
        socket.on('disconnect', function() {

            console.log("Client " + address + " disconnected");
        });
    }
);

function check_for_user(address, callback) {
    sql = `SELECT * FROM users`;
    db.get(sql,

        function(err, rows) {
            if (err) callback(err.message, null);
            else callback(null, rows);
        });
}

function get_num_of_shapes(address, curr_date, callback) {
    sql = `SELECT COUNT(*) FROM canvas WHERE ip = "` + address + `"` + ` AND date = "` + curr_date + `"`;
    db.get(sql,
        function(err, rows) {
            if (err) console.log(err.message);
            else
                callback(rows['COUNT(*)']);
        });
}

function delete_user_shapes(address, callback) {
    sql = `DELETE FROM canvas WHERE ip = "` + address + `"`;
    db.run(sql, [], (err) => {
        if (err) console.log(err.message);
        else
            callback();
    });
}