main();

//
//  Start here        
//        
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

    // Draw the scene
    drawScene(gl, programInfo, buffers);
}

//
// Initialize the shader program, given a GL context, vector shader and fragmen shader source.
// 
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

//
// Creates a shader of given type, uploads the source and compiles it.
//
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

//
// Initialize the buffers needed
// 
function initBuffers(gl) {
    //-------------------------------------------
    // Position buffer
    //-------------------------------------------
    // Array of positions for square
    const positions = [
        -1.0,  1.0,
         1.0,  1.0,
        -1.0, -1.0,
         1.0, -1.0,
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
    const colors = [
        1.0, 1.0, 1.0, 1.0,     // White
        1.0, 0.0, 0.0, 1.0,     // Red
        0.0, 1.0, 0.0, 1.0,     // Green
        0.0, 0.0, 1.0, 1.0,     // Blue
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

//
// Draw the scene
// 
function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //
    // Projection matrix related
    //
    const fieldOfView = 45 * Math.PI / 180; // 45 deg in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, // Fill the projection matrix
                     fieldOfView, aspect, zNear, zFar);

    //
    // Model view matrix related
    // 
    const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix,    // Destination matrix
                   modelViewMatrix,    // Source matrix
                   [-0.0, 0.0, -6.0]); // amount to translate

    //
    // Instructions to pull positions from position buffer to vertexPosition
    // 
    {
        const numComponents = 2;
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

    //
    // Instructions to pull colors from color buffer to vertexColor
    // 
    {
        const numComponents = 4;
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

    // Use the program
    gl.useProgram(programInfo.program);

    // Set uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
                        false, // "do not transpose"
                        projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
                        false,
                        modelViewMatrix);

    {
        const offset = 0; // start from index 0
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}
