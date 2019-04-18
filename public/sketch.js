
// Keep track of our socket connection
var socket;
var curr_shape_type = 1;



function setup() {
  createCanvas(400, 400);
  background(0);
  // Start a socket connection to the server
  socket = io.connect('http://localhost:3000');

  // Named event called 'click' and  an
  // anonymous callback function
  socket.on('click',
    // When we receive data
    function(data) {
      console.log("Got: " + data.x + " " + data.y);
      draw_shape(data);
    }
  );
}

function draw_shape(data) {
  switch(data.shape) {
    case 1:
      rect(data.x, data.y,20, 20);
      break;
    case 2:
      ellipse(data.x,data.y,20,20);
      break;
  }
}

function draw() {
  // Nothing
}

function mouseClicked() {
  let data = {
    x: mouseX,
    y: mouseY,
    shape: curr_shape_type
  };

  draw_shape(data);
  // Send the mouse coordinates
  send_shape(data.x, data.y);
}

// Function for sending to the socket
function send_shape(xpos, ypos) {
  // We are sending!
  console.log("sendmouse: " + xpos + " " + ypos);
  
  // Make a little object with  and y
  var data = {
    x: xpos,
    y: ypos,
    shape: curr_shape_type
  };

  // Send that object to the socket
  socket.emit('click',data);
}
