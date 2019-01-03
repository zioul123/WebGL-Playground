const vsSource = `
    
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;

varying highp vec3 vColor; 

void main() 
{
    // Drawing position
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    // Calculation positions
    highp vec4 normalVec = uNormalMatrix * vec4(aVertexNormal, 1.0);
    highp vec4 worldVertexPos = uModelViewMatrix * aVertexPosition;

    highp vec3 lightVec = normalize(uLightPosition - worldVertexPos.xyz); // L
    highp vec3 viewVec = normalize(-worldVertexPos.xyz);                  // V
    highp vec3 reflecVec = reflect(-lightVec, normalVec.xyz);             // R
    
    // Ambient
    highp vec3 ambtContrib = uLightColor * aVertexColor.xyz*0.3;
    // Diffuse
    highp vec3 diffContrib = uLightColor * aVertexColor.xyz*0.7 
                             * max(dot(normalVec.xyz, lightVec), 0.0);
    // Specular
    highp vec3 specContrib = uLightColor * aVertexColor.xyz*0.7
                             * pow(max(dot(reflecVec, viewVec), 0.0), 16.0);
    // Final color    
    vColor = specContrib + diffContrib + ambtContrib;
}

`;