//
// Vertex shader program
// 
const vsSource = `
    
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp  vec4 vColor;
varying highp vec2 vTextureCoord;

void main() 
{
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
    vTextureCoord = aTextureCoord;
}

`;