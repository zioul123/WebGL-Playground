const vsSource = `
    
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;
uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;    // Ka * Ia
uniform vec3 uDiffuseLightColor;    // Kd * Id
uniform vec3 uSpecularLightColor;   // Ks * Is
uniform float shininess;

varying vec3 vLightWeighting;
varying vec4 vColor; 

void main() 
{
    // World coordinates of the vertex
    vec4 worldVertexPos4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vec3 worldVertexPos = worldVertexPos4.xyz / worldVertexPos4.w;

    // N, L, V, R vectors in world coordinates 
    vec3 normalVec  = normalize(uNMatrix * aVertexNormal);          // Normal
    vec3 lightVec = normalize(uLightPosition - worldVertexPos);     // To light
    vec3 viewVec  = normalize(-worldVertexPos);                     // To eye
    vec3 reflectVec = normalize(reflect(-lightVec, normalVec));   // Reflection from vertex

    // Weightage functions
    float nDotL = max(dot(normalVec, lightVec), 0.0);
    float rDotV = max(dot(reflectVec, viewVec), 0.0);

    // Drawing light
    vLightWeighting = uAmbientLightColor
                    + uDiffuseLightColor * nDotL
                    + uSpecularLightColor * pow(rDotV, shininess);

    // Drawing position
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    
    // Drawing color
    vColor = aVertexColor;
}
`;