var cubeRotation = 0.0;

main();

// ------------------------------------
//  Start here        
// ------------------------------------      
function main() {
    const canvas = document.querySelector("#glcanvas");
    
    // Initialize the GL context
    const gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Unable to initialize WebGL.");
        return;
    }

    // Initialize shader program
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    
    // Collect the locations for the shader program
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    // Build the objects to be drawn
    const buffers = initBuffers(gl);

    // Draw the scene repeatedly
    var prevTime = 0;
    function render(currTime) {
        currTime *= 0.001; // Convert from millis to seconds
        const deltaTime = currTime - prevTime;
        prevTime = currTime;

        drawScene(gl, programInfo, buffers, deltaTime);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);    
}

// ------------------------------------
// Initialize the shader program, given a GL context, vector shader and fragmen shader source.
// ------------------------------------
function initShaderProgram(gl, vsSource, fsSource) {
    // Compile the shaders
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Attach and link the shaders to a new shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Alert if it failed
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize shader program: " + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// ------------------------------------
// Creates a shader of given type, uploads the source and compiles it.
// ------------------------------------
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send source to the shader
    gl.shaderSource(shader, source);

    // Compile shader program
    gl.compileShader(shader);

    // Alert if it failed
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error occured compiling the shaders: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// ------------------------------------
// Initialize the buffers needed
// ------------------------------------
function initBuffers(gl) {
    //-------------------------------------------
    // Position buffer
    //-------------------------------------------
    // Array of positions for square
    const positions = [
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

    // Create a buffer
    const positionBuffer = gl.createBuffer();
    // Bind the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Create a Float32Array from js array and fill current buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    //-------------------------------------------
    // Color buffer
    //-------------------------------------------
    // The posible colors to choose from
    const faceColors = [
        [1.0, 1.0, 1.0, 1.0],     // White
        [1.0, 0.0, 0.0, 1.0],     // Red
        [0.0, 1.0, 0.0, 1.0],     // Green
        [0.0, 0.0, 1.0, 1.0],     // Blue
        [1.0, 0.0, 1.0, 1.0],     // Magenta
        [0.0, 1.0, 1.0, 1.0],     // Cyan
    ];
    // The final vertex:color mapping to vertices
    var colors = [];
    // Each color is to be repeated 4 times
    for (let i = 0; i < faceColors.length; ++i) {
        const c = faceColors[i];
        colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    //-------------------------------------------
    // Element buffer
    //------------------------------------------- 
    // Each face as two triangles, pointing to the indices in the vertex array
    const indices = [
        0,  1,   2,      0,  2,  3, // front
        4,  5,   6,      4,  6,  7, // back
        8,  9,  10,      8, 10, 11, // top
        12, 13, 14,     12, 14, 15, // bottom
        16, 17, 18,     16, 18, 19, // right
        20, 21, 22,     20, 22, 23, // left
    ];

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

// ------------------------------------
// Draw the scene
// ------------------------------------
function drawScene(gl, programInfo, buffers, deltaTime) {
    // ------------------------------------
    // General drawing/gl related
    // ------------------------------------
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(programInfo.program); // Use the program

    // ------------------------------------
    // Projection matrix related
    // ------------------------------------
    const fieldOfView = 45 * Math.PI / 180; // 45 deg in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, // Fill the projection matrix
                     fieldOfView, aspect, zNear, zFar);
    
    // Set uniform
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
                        false, // "do not transpose"
                        projectionMatrix);

    // ------------------------------------
    // Model view matrix related
    // ------------------------------------
    const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix,     // Destination matrix
                   modelViewMatrix,     // Source matrix
                   [-0.0, 0.0, -6.0]);  // amount to translate
    mat4.rotate(modelViewMatrix,        // Destination matrix
                modelViewMatrix,        // Source matrix
                cubeRotation,           // Amount to rotate in rads
                [1, 1, 1]);             // Axis of rotation
    mat4.rotate(modelViewMatrix,        // Destination matrix
                modelViewMatrix,        // Source matrix
                cubeRotation,           // Amount to rotate in rads
                [0, 1, 0]);             // Axis of rotation

    // Set uniform
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
                        false,
                        modelViewMatrix);

    // ------------------------------------
    // Instructions to pull positions from position buffer to vertexPosition
    // ------------------------------------
    {
        const numComponents = 3;        // How many data points per vertex
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    // ------------------------------------
    // Instructions to pull colors from color buffer to vertexColor
    // ------------------------------------
    {
        const numComponents = 4;        // How many data points per color point
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }

    // ------------------------------------
    // Use the indices to draw the vertices
    // ------------------------------------
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // ------------------------------------
    // Draw
    // ------------------------------------
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0; // start from index 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    // ------------------------------------
    // Update for animations
    // ------------------------------------
    cubeRotation += deltaTime * 1/2*Math.PI; // 4s per rotation
}
