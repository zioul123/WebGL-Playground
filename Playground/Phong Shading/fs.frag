const fsSource = `

uniform highp vec3 uLightPosition;
uniform highp vec3 uLightColor;

varying highp vec4 vColor;
varying highp vec4 vVertexNormal;
varying highp vec4 worldVertexPos;

void main()
{
    highp vec3 lightVec = normalize(uLightPosition - worldVertexPos.xyz); // L
    highp vec3 viewVec = normalize(-worldVertexPos.xyz);                  // V
    highp vec3 reflecVec = reflect(-lightVec, vVertexNormal.xyz);         // R
    
    // Ambient
    highp vec3 ambtContrib = uLightColor * vColor.xyz*0.3;
    // Diffuse
    highp vec3 diffContrib = uLightColor * vColor.xyz*0.7 
                             * max(dot(vVertexNormal.xyz, lightVec), 0.0);
    // Specular
    highp vec3 specContrib = uLightColor * vColor.xyz*0.7
                             * pow(max(dot(reflecVec, viewVec), 0.0), 16.0);

    gl_FragColor = vec4(specContrib + diffContrib + ambtContrib, 1.0);
}

`;
