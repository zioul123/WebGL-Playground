main();

// -------------------------------------------------------------------------------------------------
// Variables for animation.
// -------------------------------------------------------------------------------------------------
// Cube drawing related
var cubeAngle    = 0; // Angle of the cube
var cubeScale    = 1; // Scale of the cube
const cubePeriod = 2; // 2s per round
const cubeRadius = 5; // 5 units away

// -------------------------------------------------------------------------------------------------
// ----------------------------------- Interaction functions ---------------------------------------
// -------------------------------------------------------------------------------------------------
// Main function to setup and run the WebGL App.
// -------------------------------------------------------------------------------------------------
function main() {
    var canvas = document.querySelector("#glcanvas"); // or document.getElementById("myGLCanvas");
    canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas);
    
    const gl = WebGLDebugUtils.makeDebugContext(createGLContext(canvas)); // Init the GL context
    const wgl = {};                 // The object to hold all web gl information
    const render = createRenderFunction(gl, wgl, drawScene);

    init(gl, wgl); // Initialize shaders, models/buffers and gl properties

    initListeners(gl, wgl, canvas, render); // Add listeners to the canvas
    initMatrixStack(gl, wgl);               // Setup the stack functionality
    initDrawables(gl, wgl);                 // Prepare the drawn objects
    
    wgl.requestId = requestAnimationFrame(render); // start the render loop
}

// -------------------------------------------------------------------------------------------------
// Function to draw the scene.
// -------------------------------------------------------------------------------------------------
function drawScene(gl, wgl, deltaTime) {
    // ------------------------------------
    // General GL setup/drawing related
    // ------------------------------------
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(wgl.projectionMatrix, wgl.fovy, wgl.aspect, wgl.zNear, wgl.zFar);
    
    mat4.identity(wgl.modelViewMatrix); // Reset to identity
    mat4.lookAt(wgl.modelViewMatrix, wgl.eye, wgl.lookAt, wgl.up); // To eye coordinates
    // Final changes made based on input
    mat4.multiply(wgl.modelViewMatrix, wgl.modelViewMatrix, wgl.viewMatrix); 

    wgl.uploadPMatrix();
    wgl.uploadMvMatrix();
    
    // ------------------------------------
    // Draw all objects
    // ------------------------------------    
    for (let i = 0; i < 3; i++) { //wgl.numberOfModels; i++) {
        wgl.listOfDrawables[i].draw(deltaTime);
    }
}

// -------------------------------------------------------------------------------------------------
// ----------------------------- Initialization Related functions ----------------------------------
// -------------------------------------------------------------------------------------------------
// Create a GL context with a given canvas.
// -------------------------------------------------------------------------------------------------
function createGLContext(canvas) {
    var context = canvas.getContext("webgl");
    if (!context) {
        alert("Unable to initialize WebGL.");
        return;
    }
    context.viewportWidth  = canvas.width;
    context.viewportHeight = canvas.height;
    return context;
}

// -------------------------------------------------------------------------------------------------
// Create a render loop function that holds gl, wgl, and draw function in scope.
// -------------------------------------------------------------------------------------------------
function createRenderFunction(gl, wgl, drawScene) {
    var prevTime = 0; // The previous frame time
    function render(currTime) {
        // Handle timing
        currTime *= 0.001;              // Convert millis to seconds
        const deltaTime = currTime - prevTime;
        prevTime = currTime;
        // Handle keypress events
        handlePressedDownKeys(wgl);
        // Handle mouse movement
        handleMouseMovement(wgl);
        // Draw and request next frame
        drawScene(gl, wgl, deltaTime);
        wgl.requestId = requestAnimationFrame(render);
    }
    return render;
}

// -------------------------------------------------------------------------------------------------
// Creates a shader of given type, uploads the source and compiles it.
// -------------------------------------------------------------------------------------------------
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send source to the shader
    gl.shaderSource(shader, source);
    // Compile shader program
    gl.compileShader(shader);

    // Alert if it failed
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        alert("Error occured compiling the " 
            + (type ==  gl.VERTEX_SHADER ? "vertex" : "fragment") + " shader: " 
            + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// -------------------------------------------------------------------------------------------------
// --------------------------------- Initialization functions --------------------------------------
// -------------------------------------------------------------------------------------------------
// Initialize state that will be affected by lost context.
// -------------------------------------------------------------------------------------------------
function init(gl, wgl) {
    initShaders(gl, wgl);                   // Setup the shader program and program info
    initModels(gl, wgl);                    // Build objects to be drawn and their buffers
    initGl(gl, wgl);                        // Setup gl properties
}
// -------------------------------------------------------------------------------------------------
// Set up the shader program and program info.
// -------------------------------------------------------------------------------------------------
function initShaders(gl, wgl) {
    // Initialize shader program with source from vs.vert and fs.frag
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram  = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Alert if it failed
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
        alert("Unable to initialize shader program: " + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    gl.useProgram(shaderProgram); // Use the program
   
    // Get attribute and uniform locations
    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    const vertexColor    = gl.getAttribLocation(shaderProgram, 'aVertexColor');
    const mvMatrix       = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
    const pMatrix        = gl.getUniformLocation(shaderProgram, 'uPMatrix');

    // Put the program info in the wgl object
    wgl.shaderProgram    = shaderProgram;
    wgl.attribLocations  = { 
        vertexPosition: vertexPosition,
        vertexColor:    vertexColor, 
    };
    wgl.uniformLocations = {
        mvMatrix: mvMatrix,
        pMatrix:  pMatrix,
    };
}

// -------------------------------------------------------------------------------------------------
// Initializes the models and buffers to be drawn in this scene.
// -------------------------------------------------------------------------------------------------
function initModels(gl, wgl) {
    // ------------------------------------
    // Floor model
    // ------------------------------------ 
    floorModel = {};
    // Set up buffers
    floorModel.setupBuffers = function() {
        // Set up data
        floorModel.vertexPositionBuffer         = gl.createBuffer();
        floorModel.vertexPositionBufferItemSize = 3;
        floorModel.vertexPositionBufferNumItems = 4;
        floorModel.vertexIndexBuffer            = gl.createBuffer();
        floorModel.vertexIndexBufferItemSize    = 1;
        floorModel.vertexIndexBufferNumItems    = 4;

        // Fill vertex position buffer
        const floorVertexPositions = [
             5.0, 0.0,  5.0,    // v0
             5.0, 0.0, -5.0,    // v1
            -5.0, 0.0, -5.0,    // v2
            -5.0, 0.0,  5.0,    // v3
        ];
        gl.bindBuffer(gl.ARRAY_BUFFER, floorModel.vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexPositions), gl.STATIC_DRAW);

        // Fill element index buffer
        const floorVertexIndices = [ 0, 1, 2, 3 ];
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorModel.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorVertexIndices), gl.STATIC_DRAW);
    }
    floorModel.setupBuffers();

    // Set up functions
    floorModel.setupAttributes = function(colors) {
        // Constant color for the floor
        {
            var r, g, b, a;
            if (colors == null) {
                r = a = 1.0, g = b = 0.0; // red floor
            } else { 
                r = colors[0]; g = colors[1]; b = colors[2]; a = colors[3];
            }

            gl.disableVertexAttribArray(wgl.attribLocations.vertexColor);
            gl.vertexAttrib4fv(wgl.attribLocations.vertexColor, [ r, g, b, a ]);
        }
        // Vertex positions
        {
            const stride = 0; const offset = 0; const norm   = false;

            gl.enableVertexAttribArray(wgl.attribLocations.vertexPosition);
            gl.bindBuffer(gl.ARRAY_BUFFER, floorModel.vertexPositionBuffer);
            gl.vertexAttribPointer(wgl.attribLocations.vertexPosition,
                                   floorModel.vertexPositionBufferItemSize,
                                   gl.FLOAT, norm, stride, offset);
        }
        // Element indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorModel.vertexIndexBuffer);
    }
    floorModel.drawElements = function() {
        const offset = 0;
        gl.drawElements(gl.TRIANGLE_FAN, floorModel.vertexIndexBufferNumItems,
                        gl.UNSIGNED_SHORT, offset);
    }

    // ------------------------------------
    // Cube model
    // ------------------------------------ 
    cubeModel = {};
    // Set up buffers
    cubeModel.setupBuffers = function() {
        cubeModel.vertexPositionBuffer         = gl.createBuffer();
        cubeModel.vertexPositionBufferItemSize = 3;
        cubeModel.vertexPositionBufferNumItems = 24;
        cubeModel.vertexIndexBuffer            = gl.createBuffer();
        cubeModel.vertexIndexBufferItemSize    = 1;
        cubeModel.vertexIndexBufferNumItems    = 36;

        const cubeVertexPositions = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeModel.vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertexPositions), gl.STATIC_DRAW);

        const cubeVertexIndices = [
            0,  1,   2,      0,  2,  3, // front
            4,  5,   6,      4,  6,  7, // back
            8,  9,  10,      8, 10, 11, // top
            12, 13, 14,     12, 14, 15, // bottom
            16, 17, 18,     16, 18, 19, // right
            20, 21, 22,     20, 22, 23, // left
        ];
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeModel.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    }
    cubeModel.setupBuffers();

    // Set up functions
    cubeModel.setupAttributes = function(colors) {
        // Constant color for the cube
        {
            var r, g, b, a;
            if (colors == null) {
                a = 1.0, r = g = b = 0.10; // dark grey cube
            } else { 
                r = colors[0]; g = colors[1]; b = colors[2]; a = colors[3];
            }

            gl.disableVertexAttribArray(wgl.attribLocations.vertexColor);
            gl.vertexAttrib4fv(wgl.attribLocations.vertexColor, [ r, g, b, a ]);
        }
        // Vertex positions
        {
            const stride = 0; const offset = 0; const norm   = false;

            gl.enableVertexAttribArray(wgl.attribLocations.vertexPosition);
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeModel.vertexPositionBuffer);
            gl.vertexAttribPointer(wgl.attribLocations.vertexPosition,
                                   cubeModel.vertexPositionBufferItemSize,
                                   gl.FLOAT, norm, stride, offset);
        }
        // Element indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeModel.vertexIndexBuffer);
    }
    cubeModel.drawElements = function() {
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, cubeModel.vertexIndexBufferNumItems,
                        gl.UNSIGNED_SHORT, offset);
    }

    // ------------------------------------
    // Put all models into wgl
    // ------------------------------------ 
    wgl.models = {
        floor: floorModel,
        cube:  cubeModel,
    }
}

// -------------------------------------------------------------------------------------------------
// Initialize the gl properties.
// -------------------------------------------------------------------------------------------------
function initGl(gl, wgl) {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // For perspective matrix setup
    wgl.fovy   = 60 * Math.PI / 180;
    wgl.aspect = gl.viewportWidth / gl.viewportHeight;
    wgl.zNear  = 0.1;
    wgl.zFar   = 100.0;

    wgl.eye    = [ 8,   5, -10 ];
    wgl.lookAt = [ 0,   0,   0 ];
    wgl.up     = [ 0,   1,   0 ];

    // Camera movement setup
    wgl.upVec      = vec3.fromValues(0, 1, 0); // Up axis for camera movement
    wgl.rightVec   = vec3.create();            // Right axis for camera movement
    { // "Right vector" for camera movement
        var eyeToOrigin = vec3.fromValues(-wgl.eye[0], -wgl.eye[1], -wgl.eye[2]);
        vec3.normalize(eyeToOrigin, eyeToOrigin);
        vec3.cross(wgl.rightVec, wgl.upVec, eyeToOrigin);
    }
    wgl.viewMatrix = mat4.create(); // For rotation of view
}

// -------------------------------------------------------------------------------------------------
// Initialize and add listeners to the canvas.
// -------------------------------------------------------------------------------------------------
function initListeners(gl, wgl, canvas, render) {
    // ------------------------------------ 
    // Lost context related
    // ------------------------------------ 
    function handleContextLost(event) {
        event.preventDefault(); // Prevent default action that context will not be restored
        cancelAnimationFrame(wgl.requestId);
    }
    function handleContextRestored(event) {
        init(gl, wgl);
        requestAnimationFrame(render);
    }

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    // Uncomment for simulating lost context.
    // window.addEventListener('mousedown', () => canvas.loseContext());
    
    // ------------------------------------ 
    // Mouse related
    // ------------------------------------ 
    wgl.prevX = undefined; wgl.prevY = undefined; // Keep track of position
    wgl.currX = undefined; wgl.currY = undefined;
    wgl.mouseDown = false;
    function handleMouseDown(event) {
        wgl.mouseDown = true;
        wgl.prevX = event.clientX; wgl.prevY = event.clientY;
        wgl.currX = event.clientX; wgl.currY = event.clientY;
        // console.log("mouseDown, clientX=%d, clientY=%d, button=%d", 
        //              event.clientX, event.clientY, event.button);
    }
    function handleMouseUp(event) {
        wgl.mouseDown = false;
        wgl.prevX = undefined; wgl.prevY = undefined;
        wgl.currX = undefined; wgl.currY = undefined;
        // console.log("mouseUp, clientX=%d, clientY=%d, button=%d", 
        //              event.clientX, event.clientY, event.button);
    }
    function handleMouseMove(event) {
        // Update previous mouse position
        wgl.prevX = wgl.currX;     wgl.prevY = wgl.currY;
        // Record current mouse position 
        wgl.currX = event.clientX; wgl.currY = event.clientY;
        // console.log("mouseMove, clientX=%d, clientY=%d, button=%d", 
        //              event.clientX, event.clientY, event.button);
    }
    document.addEventListener('mousedown', handleMouseDown, false);
    document.addEventListener('mouseup', handleMouseUp, false);
    document.addEventListener('mousemove', handleMouseMove, false);

    // ------------------------------------ 
    // Keyboard related
    // ------------------------------------ 

    wgl.listOfPressedKeys = []; // Keep track of pressed down keys
    function handleKeyDown(event) {
        wgl.listOfPressedKeys[event.keyCode] = true;
        // console.log("keydown - keyCode=%d, charCode=%d", event.keyCode, event.charCode);
    }
    function handleKeyUp(event) {
        wgl.listOfPressedKeys[event.keyCode] = false;
        // console.log("keyup - keyCode=%d, charCode=%d", event.keyCode, event.charCode);
    }
    function handleKeyPress(event) {} // Doesn't do anything
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);
    document.addEventListener('keypress', handleKeyPress, false);

    // ------------------------------------ 
    // Provide instructions
    // ------------------------------------ 
    console.log(
            "Controls:\n" +
            "Left click and drag: Rotate view\n" +
            "z/x: zoom in/out\n" +
            "Arrow keys: rotate the view.");
}

// -------------------------------------------------------------------------------------------------
// Set up the stack functionality of the wgl object.
// -------------------------------------------------------------------------------------------------
function initMatrixStack(gl, wgl) {
    wgl.modelViewMatrix  = mat4.create();
    wgl.projectionMatrix = mat4.create();
    wgl.modelViewMatrixStack = [];

    wgl.pushMatrix = function() {
        var copyToPush = mat4.create();
        mat4.copy(copyToPush, wgl.modelViewMatrix);
        wgl.modelViewMatrixStack.push(copyToPush);
    }
    wgl.popMatrix = function() {
        if (wgl.modelViewMatrixStack.length == 0) {
            throw "Error wgl.popMatrix() - Stack was empty ";
        }
        wgl.modelViewMatrix = wgl.modelViewMatrixStack.pop();
    }
    wgl.uploadMvMatrix = function() {
        gl.uniformMatrix4fv(wgl.uniformLocations.mvMatrix, false, wgl.modelViewMatrix);
    }
    wgl.uploadPMatrix = function() {
        gl.uniformMatrix4fv(wgl.uniformLocations.pMatrix, false, wgl.projectionMatrix);
    }
}

// -------------------------------------------------------------------------------------------------
// Initialize the gl properties.
// -------------------------------------------------------------------------------------------------
function initDrawables(gl, wgl) {
    // ------------------------------------
    // Instructions to draw floor
    // ------------------------------------ 
    floor = {
        draw: function(deltaTime) {
            wgl.models.floor.setupAttributes();
            wgl.pushMatrix();
                const trans = [ 0, -1, 0 ];
                mat4.translate(wgl.modelViewMatrix, wgl.modelViewMatrix, trans);
                wgl.uploadMvMatrix();

                wgl.models.floor.drawElements();
            wgl.popMatrix();
        }
    };

    // ------------------------------------
    // Instructions to draw cube
    // ------------------------------------ 
    cube = {
        draw: function(deltaTime) {
            wgl.models.cube.setupAttributes();
            wgl.pushMatrix();
                const axis  = [ 0, 1, 0 ];

                // Animation portion
                cubeAngle += 2 * Math.PI * deltaTime / cubePeriod;
                mat4.rotate(wgl.modelViewMatrix, wgl.modelViewMatrix, cubeAngle, axis);
                mat4.translate(wgl.modelViewMatrix, wgl.modelViewMatrix, [ cubeRadius, 0, 0 ]);

                // Cube default height and angle
                const trans = [ 0, 5, 0 ];
                mat4.rotate(wgl.modelViewMatrix, wgl.modelViewMatrix, -cubeAngle, axis);
                mat4.translate(wgl.modelViewMatrix, wgl.modelViewMatrix, trans);
                
                // User input based scale
                mat4.scale(wgl.modelViewMatrix, wgl.modelViewMatrix, 
                           [ cubeScale, cubeScale, cubeScale ]);

                wgl.uploadMvMatrix();

                wgl.models.cube.drawElements();
            wgl.popMatrix();
        }
    };

    // ------------------------------------
    // Instructions to draw table
    // ------------------------------------ 
    table = {
        draw: function(deltaTime) {
            const brown = [ 0.6, 0.3, 0, 1.0 ];
            wgl.models.cube.setupAttributes(brown);
            // Table top
            wgl.pushMatrix();
                const tableTopYTrans = [ 0, 1, 0 ];
                const tableTopScale  = [ 2.5, 0.25, 2.5 ];
                mat4.translate(wgl.modelViewMatrix, wgl.modelViewMatrix, tableTopYTrans);
                mat4.scale(wgl.modelViewMatrix, wgl.modelViewMatrix, tableTopScale);
                wgl.uploadMvMatrix();

                wgl.models.cube.drawElements();
            wgl.popMatrix();
            // Table legs
            wgl.pushMatrix();
                const angle = 90 * Math.PI / 180;
                const axis  = [  0,  1,  0 ];
                const trans = [  2, 0,  2 ];
                const scale = [  0.25,  1,  0.25 ];
                
                for (var i = 0; i < 4; i++) {
                    mat4.rotate(wgl.modelViewMatrix, wgl.modelViewMatrix, angle, axis);
                    wgl.pushMatrix();
                        mat4.translate(wgl.modelViewMatrix, wgl.modelViewMatrix, trans);
                        mat4.scale(wgl.modelViewMatrix, wgl.modelViewMatrix, scale);
                        wgl.uploadMvMatrix();

                        wgl.models.cube.drawElements();
                    wgl.popMatrix();
                }
            wgl.popMatrix();
        }
    };

    // Put drawables into wgl
    wgl.numberOfDrawables = 3;
    wgl.listOfDrawables = [ floor, cube, table ];
}

// -------------------------------------------------------------------------------------------------
// ----------------------------------- Interaction functions ---------------------------------------
// -------------------------------------------------------------------------------------------------
// Rotate the view by the andle around the specified axis vec3.
// -------------------------------------------------------------------------------------------------
function rotateView(wgl, rads, axisVec) {
    // Get the rotation matrix
    var rotation = mat4.create();
    mat4.fromRotation(rotation, rads, axisVec);
    // Rotate the view matrix
    mat4.multiply(wgl.viewMatrix, rotation, wgl.viewMatrix);
}

// -------------------------------------------------------------------------------------------------
// Handle key presses.
// -------------------------------------------------------------------------------------------------
function handlePressedDownKeys(wgl) {  
    // Zoom functions
    if (wgl.listOfPressedKeys[90]) { // z - zoom in
        wgl.fovy = Math.min(wgl.fovy * 1.1, Math.PI - 0.1);
    } 
    if (wgl.listOfPressedKeys[88]) { // x - zoom out
        wgl.fovy = Math.max(wgl.fovy * 0.9, 0.1);
    } 
    // Cube functions
    if (wgl.listOfPressedKeys[67]) { // c - scale cube up
       cubeScale = Math.min(cubeScale + 0.1, 5);
    } 
    if (wgl.listOfPressedKeys[86]) { // v - scale cube down
       cubeScale = Math.max(cubeScale - 0.1, 0.1);
    } 
    // Camera movement functions
    if (wgl.listOfPressedKeys[37]) { // left
        rotateView(wgl, -5 * Math.PI / 180, wgl.upVec);
    } 
    if (wgl.listOfPressedKeys[39]) { // right
        rotateView(wgl, 5 * Math.PI / 180, wgl.upVec);
    } 
    if (wgl.listOfPressedKeys[38]) { // up
        rotateView(wgl, 5 * Math.PI / 180, wgl.rightVec);
    }
    if (wgl.listOfPressedKeys[40]) { // down
        rotateView(wgl, -5 * Math.PI / 180, wgl.rightVec);
    }  
    if (wgl.listOfPressedKeys[82]) { // r - reset camera
       mat4.identity(wgl.viewMatrix);
    } 
}

// -------------------------------------------------------------------------------------------------
// Handle mouse movement.
// -------------------------------------------------------------------------------------------------
function handleMouseMovement(wgl) {
    if (!wgl.mouseDown) return;
    // Record change in mouse position
    var dX = wgl.currX - wgl.prevX;
    var dY = wgl.currY - wgl.prevY;
    // Rotate accordingly
    rotateView(wgl, dX * Math.PI / 180, wgl.upVec);     // x movement -> rot around up axis
    rotateView(wgl, -dY * Math.PI / 180, wgl.rightVec); // y movement -> rot around right axis
}
