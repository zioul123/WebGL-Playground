const fsSource = `
precision mediump float;

uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;    // Ka * Ia
uniform vec3 uDiffuseLightColor;    // Kd * Id
uniform vec3 uSpecularLightColor;   // Ks * Is
uniform float shininess;

varying vec4 vColor;
varying vec3 vWorldVertexPos;
varying vec3 vNormalVec;

const float att0      =  1.0;
const float att1      =  0.1;
const float att2      =  0.0005; // Normally 0.05, but distance is 20 instead of 1

void main()
{
    // L, V, R vectors in world coordinates 
    vec3 lightVec = normalize(uLightPosition - vWorldVertexPos);   // To light
    vec3 viewVec  = normalize(-vWorldVertexPos);                   // To eye
    vec3 reflectVec = normalize(reflect(-lightVec, vNormalVec));   // Reflection from vertex
    
    // Weightage functions
    float nDotL = max(dot(vNormalVec, lightVec), 0.0);
    float rDotV = max(dot(reflectVec, viewVec), 0.0);

    // Attenuation function
    float distance = length(vec3(uLightPosition - vWorldVertexPos));
    float att      = 1.0 / (att0 + att2 * distance * distance);

    // Drawing light
    vec3 vLightWeighting = uAmbientLightColor
                         + att * uDiffuseLightColor * nDotL
                         + att * uSpecularLightColor * pow(rDotV, shininess);

    gl_FragColor = vec4(vColor.xyz * vLightWeighting, vColor.a);
}
`;
