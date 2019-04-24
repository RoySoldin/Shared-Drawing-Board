// Keep track of our socket connection
var socket;

//Size of canvas
var canvas_x = 1000;
var canvas_y = 500;

//Types of shapes
var square_shape = 1;
var circle_shape = 2;

//Color of shapes
var white_fill = 1;
var green_fill = 2;
var yellow_fill = 3;
var blue_fill = 4;
var red_fill = 5;

//Default values
var curr_shape_type = square_shape;
var curr_shape_color = white_fill;

//Flag for "delete my shapes button"
var delete_my_shapes = {
    x: null,
    y: null
};

function setup() {
    createCanvas(canvas_x, canvas_y);
    background(0);
    // Start a socket connection to the server
    socket = io.connect();
    // Named event called 'click' and an
    // anonymous callback function
    socket.on('click',
        // When we receive data
        function(data) {
            if (typeof data === 'string') { // Message that inform the user that he is out of shapes
                document.getElementById('user_label').innerText = 'No more shapes for today. therefore you only changing your board!';
                console.log("out of shapes");
            } else {
                document.getElementById('user_label').innerText = 'Welcome to shared drawing board';
                console.log("Got: " + data.x + " " + data.y);
                if (data.x != null | data.y != null)
                    draw_shape(data);
                else
                    clean_canvas();
            }
        }
    );
}

function clean_canvas() {
    clear();
    createCanvas(canvas_x, canvas_y);
    background(0);
}

// Draw shape on local board
function draw_shape(data) {
    let c; // the color we are going to use
    switch (data.color) {
        case green_fill:
            c = color(124, 252, 0);
            break;
        case red_fill:
            c = color(200, 0, 0);
            break;
        case yellow_fill:
            c = color(255, 204, 0);
            break;
        case blue_fill:
            c = color(0, 0, 255);
            break;
        default:
            c = color(255, 255, 255);
            break;
    }

    switch (data.shape) {
        case square_shape:
            fill(c);
            rect(data.x, data.y, 20, 20);
            break;
        case circle_shape:
            fill(c);
            ellipse(data.x, data.y, 20, 20);
            break;
    }
}

// When mouse click, draw on local board and sent data to server for other users 
function mouseClicked() {
    if (mouseX < 0 || mouseX > canvas_x)
        return;
    if (mouseY < 0 || mouseY > canvas_y)
        return;
    let data = {
        x: mouseX,
        y: mouseY,
        shape: curr_shape_type,
        color: curr_shape_color
    };

    draw_shape(data);
    // Send the mouse coordinates
    send_shape(data);
}


// Function for sending to the socket
function send_shape(data) {
    // check null for "delete my shapes" button
    if (data.x != null || data.y != null)
        console.log("sendmouse: " + data.x + " " + data.y);

    // Send that object to the socket
    socket.emit('click', data);
}

//------------------------------------------------ Buttons functions -----------------------------------------------------------

function circle_pressed() {
    curr_shape_type = circle_shape;
}

function square_pressed() {
    curr_shape_type = square_shape;
}

function white_pressed() {
    curr_shape_color = white_fill;
}

function green_pressed() {
    curr_shape_color = green_fill;
}

function yellow_pressed() {
    curr_shape_color = yellow_fill;
}

function blue_pressed() {
    curr_shape_color = blue_fill;
}

function red_pressed() {
    curr_shape_color = red_fill;
}

function delete_my_shapes_pressed() {
    send_shape(delete_my_shapes);
}
//p5 function - not needed
function draw() {
    // Nothing
}

