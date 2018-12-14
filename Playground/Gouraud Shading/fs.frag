//
// Fragment shader program
// 
const fsSource = `

varying lowp  vec4 vColor;
varying highp vec3 vLighting;
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main()
{
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
    gl_FragColor = vec4(texelColor.xyz * vLighting,
                        texelColor.a);
}

`;
