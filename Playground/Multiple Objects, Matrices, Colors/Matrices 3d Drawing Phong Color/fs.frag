const fsSource = `
precision mediump float;

uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;    // Ka * Ia
uniform vec3 uDiffuseLightColor;    // Kd * Id
uniform vec3 uSpecularLightColor;   // Ks * Is

varying vec4 vColor;
varying vec3 vWorldVertexPos;
varying vec3 vNormalVec;

const float shininess = 32.0;

void main()
{
    // L, V, R vectors in world coordinates 
    vec3 lightVec = normalize(uLightPosition - vWorldVertexPos);   // To light
    vec3 viewVec  = normalize(-vWorldVertexPos);                   // To eye
    vec3 reflectVec = normalize(reflect(-lightVec, vNormalVec));   // Reflection from vertex
    
    // Weightage functions
    float nDotL = max(dot(vNormalVec, lightVec), 0.0);
    float rDotV = max(dot(reflectVec, viewVec), 0.0);

    // Drawing light
    vec3 vLightWeighting = uAmbientLightColor
                         + uDiffuseLightColor * nDotL
                         + uSpecularLightColor * pow(rDotV, shininess);

    gl_FragColor = vec4(vColor.xyz * vLightWeighting, vColor.a);
}
`;
