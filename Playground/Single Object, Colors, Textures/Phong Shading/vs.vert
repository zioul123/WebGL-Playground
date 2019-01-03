const vsSource = `
    
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

varying highp vec4 vColor; 
varying highp vec4 vVertexNormal;
varying highp vec4 worldVertexPos;

void main() 
{
    // Drawing position
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    // World position
    worldVertexPos = uModelViewMatrix * aVertexPosition;
    // Calculation positions
    vVertexNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
    
    vColor = aVertexColor;
}

`;