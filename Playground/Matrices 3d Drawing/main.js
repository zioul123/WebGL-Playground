main();

// ------------------------------------------------------------------------
//  Start here        
// ------------------------------------------------------------------------    
function main() {
    const canvas = document.querySelector("#glcanvas"); // or document.getElementById("myGLCanvas");
    
    const gl = WebGLDebugUtils.makeDebugContext(createGLContext(canvas)); // Init the GL context
    const wgl = {};                 // The object to hold all web gl information
    initShaders(gl, wgl);           // Setup the shader program and program info
    initMatrixStack(gl, wgl);       // Setup the stack functionality
    initModels(gl, wgl);            // Build objects to be drawn and their buffers
    initDrawables(gl, wgl);         // Prepare the drawn objects
    initGl(gl, wgl);                // Setup gl properties
    drawScene(gl, wgl);    // Draw the scene
}

// ------------------------------------------------------------------------
// Create a GL context with a given canvas.
// ------------------------------------------------------------------------
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

// ------------------------------------------------------------------------
// Set up the shader program and program info.
// ------------------------------------------------------------------------
function initShaders(gl, wgl) {
    // Initialize shader program with source from vs.vert and fs.frag
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram  = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Alert if it failed
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
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

// ------------------------------------------------------------------------
// Set up the stack functionality of the wgl object.
// ------------------------------------------------------------------------
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

// ------------------------------------------------------------------------
// Creates a shader of given type, uploads the source and compiles it.
// ------------------------------------------------------------------------
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send source to the shader
    gl.shaderSource(shader, source);
    // Compile shader program
    gl.compileShader(shader);

    // Alert if it failed
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error occured compiling the " 
            + (type ==  gl.VERTEX_SHADER ? "vertex" : "fragment") + " shader: " 
            + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// ------------------------------------------------------------------------
// Initializes the models and buffers to be drawn in this scene.
// ------------------------------------------------------------------------
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

// ------------------------------------------------------------------------
// Initialize the gl properties.
// ------------------------------------------------------------------------
function initDrawables(gl, wgl) {
    // ------------------------------------
    // Instructions to draw floor
    // ------------------------------------ 
    floor = {
        draw: function() {
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
        draw: function() {
            wgl.models.cube.setupAttributes();
            wgl.pushMatrix();
                const angle = 30 * Math.PI / 180;
                const axis  = [ 0, 1, 0 ];
                const trans = [ 0, 5, 0 ];
                mat4.rotate(wgl.modelViewMatrix, wgl.modelViewMatrix, angle, axis);
                mat4.translate(wgl.modelViewMatrix, wgl.modelViewMatrix, trans);
                wgl.uploadMvMatrix();

                wgl.models.cube.drawElements();
            wgl.popMatrix();
        }
    };

    // ------------------------------------
    // Instructions to draw table
    // ------------------------------------ 
    table = {
        draw: function() {
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


// ------------------------------------------------------------------------
// Initialize the gl properties.
// ------------------------------------------------------------------------
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
}

// ------------------------------------------------------------------------
// Draw the scene
// ------------------------------------------------------------------------
function drawScene(gl, wgl) {
    // ------------------------------------
    // General GL setup/drawing related
    // ------------------------------------
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(wgl.projectionMatrix, wgl.fovy, wgl.aspect, wgl.zNear, wgl.zFar);
    
    mat4.identity(wgl.modelViewMatrix);
    mat4.lookAt(wgl.modelViewMatrix, wgl.eye, wgl.lookAt, wgl.up);

    wgl.uploadPMatrix();
    wgl.uploadMvMatrix();
    
    // ------------------------------------
    // Draw all objects
    // ------------------------------------    
    for (let i = 0; i < 3; i++) { //wgl.numberOfModels; i++) {
        wgl.listOfDrawables[i].draw();
    }
}
