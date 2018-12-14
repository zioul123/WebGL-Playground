//
// Fragment shader program
// 
const fsSource = `

varying lowp  vec4 vColor;
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main()
{
    gl_FragColor = texture2D(uSampler, vTextureCoord)*0.5 + vColor*0.5;
}

`;
