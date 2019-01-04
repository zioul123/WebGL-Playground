const vsSource = `
    
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec3 vWorldVertexPos;
varying vec3 vNormalVec;
varying vec4 vColor; 

void main() 
{
    // World coordinates of the vertex
    vec4 worldVertexPos4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vWorldVertexPos = worldVertexPos4.xyz / worldVertexPos4.w;

    // N in world coordinates
    vNormalVec  = normalize(uNMatrix * aVertexNormal);          // Normal

    // Drawing position
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    
    // Drawing color
    vColor = aVertexColor;
}
`;