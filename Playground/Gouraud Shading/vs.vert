//
// Vertex shader program
// 
const vsSource = `
    
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor; // Missing?
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord; // Maybe hide this

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;

varying lowp  vec4 vColor; // Maybe remove
varying highp vec3 vLighting; 
varying highp vec2 vTextureCoord; // Maybe remove

void main() 
{
    // Drawing position
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    // Calculation positions
    highp vec4 normalVec = uNormalMatrix * vec4(aVertexNormal, 1.0);
    highp vec4 worldVertexPos = uModelViewMatrix * aVertexPosition;

    highp vec3 lightVec =  normalize(vec3(0.85, 0.8, 0.75));//normalize(uLightPosition - worldVertexPos.xyz);     // L
    highp vec3 viewVec = normalize(-worldVertexPos.xyz);                      // V
    highp vec3 reflecVec = reflect(-lightVec, normalVec.xyz);                 // R


    // Specular
    highp float spec = max(dot(reflecVec, viewVec), 0.0);      
    spec = pow(spec, 16.0);
    highp vec3 specContrib = uLightColor * spec; 

    // Ambient
    highp vec3 ambientContrib = aVertexColor.xyz * 0.5;

    // Diffuse
    highp vec3 diffContrib = uLightColor * max(dot(normalVec.xyz, lightVec), 0.0);

    vLighting = specContrib + diffContrib + ambientContrib;
    vColor = aVertexColor;
    vTextureCoord = aTextureCoord;
}

`;