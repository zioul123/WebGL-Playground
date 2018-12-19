main();

// ------------------------------------------------------------------------
//  Start here        
// ------------------------------------------------------------------------    
function main() {
    const canvas = document.querySelector("#glcanvas");
    
    // Initialize the GL context
    const gl = WebGLDebugUtils.makeDebugContext(createGLContext(canvas));

    // Initialize shader program with source from vs.vert and fs.frag
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    
    // Collect the locations for the shader program
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {},
    };

    // Build the objects to be drawn
    const buffers = initBuffers(gl);

    drawScene(gl, programInfo, buffers); 
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
// Initialize the shader program, given a GL context, vector shader and 
// fragmen shader source.
// ------------------------------------------------------------------------
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
        alert("Unable to initialize shader program: " 
            + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
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
// Initialize the buffers needed
// ------------------------------------------------------------------------
function initBuffers(gl) {
    // Hexagon 
    var hexagonVertices = [
        -0.3,  0.6,  0.0, //v0
        -0.4,  0.8,  0.0, //v1
        -0.6,  0.8,  0.0, //v2
        -0.7,  0.6,  0.0, //v3
        -0.6,  0.4,  0.0, //v4
        -0.4,  0.4,  0.0, //v5
        -0.3,  0.6,  0.0, //v6
    ];
    var hexagonVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexagonVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hexagonVertices),
                  gl.STATIC_DRAW);
    var hexagonBuffer = {
        vertexBuffer: hexagonVertexBuffer,
        numComponents: 3,
        vertexCount: 7,
    }
    
    // Triangle
    var triangleVertices = [
        0.3,  0.4,  0.0, //v0
        0.7,  0.4,  0.0, //v1
        0.5,  0.8,  0.0, //v2
    ];
    var triangleVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices),
                  gl.STATIC_DRAW);

    var triangleColors = [
        1.0, 0.0, 0.0, 1.0, //v0
        0.0, 1.0, 0.0, 1.0, //v1
        0.0, 0.0, 1.0, 1.0  //v2
    ];
    var triangleColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors),
                  gl.STATIC_DRAW);

    var triangleBuffer = {
        vertexBuffer: triangleVertexBuffer,
        vertexColorBuffer: triangleColorBuffer,
        numComponents: 3,
        numColorComponents: 4,
        vertexCount: 3,
    }

    // Triangle Strip
    var stripVertices = [
        -0.5,  0.2,  0.0, //v0
        -0.4,  0.0,  0.0, //v1
        -0.3,  0.2,  0.0, //v2
        -0.2,  0.0,  0.0, //v3
        -0.1,  0.2,  0.0, //v4
         0.0,  0.0,  0.0, //v5
         0.1,  0.2,  0.0, //v6
         0.2,  0.0,  0.0, //v7
         0.3,  0.2,  0.0, //v8
         0.4,  0.0,  0.0, //v9
         0.5,  0.2,  0.0, //v10
         // start second strip
        -0.5, -0.3,  0.0, //v11
        -0.4, -0.5,  0.0, //v12
        -0.3, -0.3,  0.0, //v13
        -0.2, -0.5,  0.0, //v14
        -0.1, -0.3,  0.0, //v15
         0.0, -0.5,  0.0, //v16
         0.1, -0.3,  0.0, //v17
         0.2, -0.5,  0.0, //v18
         0.3, -0.3,  0.0, //v19
         0.4, -0.5,  0.0, //v20
         0.5, -0.3,  0.0  //v21    
    ];
    var stripVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, stripVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stripVertices),
                  gl.STATIC_DRAW);

    var stripIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                   10, 10, 11, // 3 extra indices for the degenerate triangles
                   11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    var stripElementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stripElementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(stripIndices),
                  gl.STATIC_DRAW);
    var stripBuffer = {
        vertexBuffer: stripVertexBuffer,
        elementBuffer: stripElementBuffer,
        numComponents: 3,
        vertexCount: 22,
        elementCount: 25,
    }

    return {
        hexagonBuffer: hexagonBuffer,
        triangleBuffer: triangleBuffer,
        stripBuffer: stripBuffer,
    };
}

// ------------------------------------------------------------------------
// Draw the scene
// ------------------------------------------------------------------------
function drawScene(gl, programInfo, buffers) {
    // ------------------------------------
    // General GL setup/drawing related
    // ------------------------------------
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(programInfo.program); // Use the program

    // ------------------------------------
    // Draw the hexagon
    // ------------------------------------
    {
        const stride = 0;
        const offset = 0;
        const first  = 0;
        gl.disableVertexAttribArray(programInfo.attribLocations.vertexColor);
        gl.vertexAttrib4fv(programInfo.attribLocations.vertexColor, [0.0, 0.0, 0.0, 1.0]);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.hexagonBuffer.vertexBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
                               buffers.hexagonBuffer.numComponents,
                               gl.FLOAT, false, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        gl.drawArrays(gl.LINE_STRIP, first, buffers.hexagonBuffer.vertexCount);
    }
    
    // ------------------------------------
    // Draw the triangle
    // ------------------------------------
    {
        const stride = 0;
        const offset = 0;
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.triangleBuffer.vertexColorBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor,
                               buffers.triangleBuffer.numColorComponents,
                               gl.FLOAT, false, stride, offset);

        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.triangleBuffer.vertexBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
                               buffers.triangleBuffer.numComponents, 
                               gl.FLOAT, false, stride, offset);

        gl.drawArrays(gl.TRIANGLES, 0, buffers.triangleBuffer.vertexCount);
    }

    // ------------------------------------
    // Draw the triangle strip
    // ------------------------------------
    {
        const stride = 0;
        const offset = 0;

        gl.disableVertexAttribArray(programInfo.attribLocations.vertexColor);
        gl.vertexAttrib4f(programInfo.attribLocations.vertexColor, 1.0, 0.0, 1.0, 1.0);

        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.stripBuffer.vertexBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
                               buffers.stripBuffer.numComponents,
                               gl.FLOAT, false, stride, offset);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.stripBuffer.elementBuffer);

        gl.drawElements(gl.TRIANGLE_STRIP, buffers.stripBuffer.elementCount,
                        gl.UNSIGNED_SHORT, offset);
    }

    // ------------------------------------
    // Draw the triangle strip outline
    // ------------------------------------
    {
        const start1 = 0;
        const start2 = 11;
        const count  = 11;
        gl.vertexAttrib4f(programInfo.attribLocations.vertexColor, 0.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.LINE_STRIP, start1, count);
        gl.drawArrays(gl.LINE_STRIP, start2, count);
    }   
}
