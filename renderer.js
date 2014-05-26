/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true */
/*global Float32Array, vec2, vec3, mat4 */

function Actor(position, scale, rotation, color)
{
    'use strict';
    this.position = position;
    this.scale    = scale;
    this.rotation = rotation;
    this.color    = color;

    this.worldMatrix = mat4.create();
}

Actor.prototype.updateWorld = function()
{
    'use strict';

    mat4.identity(this.worldMatrix);
    mat4.scale(this.worldMatrix, this.worldMatrix, this.scale);

    var rotation = mat4.create();
    mat4.identity(rotation);
    mat4.rotateZ(rotation, rotation, this.rotation);

    mat4.multiply(this.worldMatrix, rotation, this.worldMatrix);

    this.worldMatrix[12] = this.position[0];
    this.worldMatrix[13] = this.position[1];
    this.worldMatrix[14] = this.position[2];
};

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

function Renderer(canvas)
{
    'use strict';
    
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.initWebGL(canvas);
    
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LESS);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.frontFace(this.gl.CW);
    
    this.initShaders();
    this.initBuffers();
    
    this.cameraPosition = vec3.create();
    this.centerPosition = vec3.create();
    this.up             = vec3.fromValues(0,1,0);

    this.viewMatrix     = mat4.create();
    this.viewProj       = mat4.create();

    this.projectionMatrix = mat4.create();
    //mat4.ortho(this.projectionMatrix, 0, this.width, 0, this.height, 0.1, 100);

    var ratio = this.width/this.height;

    mat4.ortho(this.projectionMatrix, 0, 20, 0, 20/ratio, 0.1, 20);

    this.moveCameraPosition(0,0,0);
}

Renderer.prototype.transformToObjectSpace = function(pos, actor)
{
    'use strict';

    var inverseMatrix = mat4.create();

    inverseMatrix = mat4.multiply(inverseMatrix, this.viewMatrix, actor.worldMatrix);

    mat4.invert(inverseMatrix, inverseMatrix);

    vec3.transformMat4(pos, pos, inverseMatrix);
};

Renderer.prototype.moveCameraPosition = function(x, y, z)
{
    'use strict';
    this.cameraPosition[0] += x;
    this.cameraPosition[1] += y;
    this.cameraPosition[2] = z;

    this.centerPosition[0] = this.cameraPosition[0];
    this.centerPosition[1] = this.cameraPosition[1];
    this.centerPosition[2] = -200;

    mat4.lookAt(this.viewMatrix, this.cameraPosition, this.centerPosition, this.up);

    mat4.multiply(this.viewProj, this.projectionMatrix, this.viewMatrix);
};

Renderer.prototype.setCameraPosition = function(x, y, z)
{
    'use strict';
    this.cameraPosition[0] = x;
    this.cameraPosition[1] = y;
    this.cameraPosition[2] = z;

    this.centerPosition[0] = this.cameraPosition[0];
    this.centerPosition[1] = this.cameraPosition[1];
    this.centerPosition[2] = -200;

    mat4.lookAt(this.viewMatrix, this.cameraPosition, this.centerPosition, this.up);

    mat4.multiply(this.viewProj, this.projectionMatrix, this.viewMatrix);
};

Renderer.prototype.initWebGL = function(canvas)
{
    'use strict';
    
    this.gl = null;

    try
    {
        // Try to grab the standard context. If it fails, fallback to experimental.
        this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}

    // If we don't have a GL context, give up now
    if (!this.gl)
    {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        this.gl = null;
    }
};

Renderer.prototype.getShader = function(id)
{
    'use strict';
    
    var shaderScript = document.getElementById(id);

    // Didn't find an element with the specified ID; abort.

    if (!shaderScript)
    {
        return null;
    }

    // Walk through the source element's children, building the
    // shader source string.

    var theSource = "";
    var currentChild = shaderScript.firstChild;

    while(currentChild)
    {
        if (currentChild.nodeType === 3)
        {
            theSource += currentChild.textContent;
        }
        
        currentChild = currentChild.nextSibling;
    }

    // Now figure out what type of shader script we have,
    // based on its MIME type.

    var shader;

    if (shaderScript.type === "x-shader/x-fragment")
    {
        shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    } else if (shaderScript.type === "x-shader/x-vertex")
    {
        shader = this.gl.createShader(this.gl.VERTEX_SHADER);
    } else
    {
        return null;  // Unknown shader type
    }

    // Send the source to the shader object

    this.gl.shaderSource(shader, theSource);

    // Compile the shader program

    this.gl.compileShader(shader);

    // See if it compiled successfully

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
    {
        alert("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};

Renderer.prototype.initShaders = function()
{
    'use strict';
    
    var fragmentShader = this.getShader("shader-fs");
    var vertexShader = this.getShader("shader-vs");

    // Create the shader program
    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);

    // If creating the shader program failed, alert
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS))
    {
        alert("Unable to initialize the shader program.");
    }

    this.gl.useProgram(this.shaderProgram);

    this.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
    
    this.viewprojUL = this.gl.getUniformLocation(this.shaderProgram, "uVPMatrix");
    this.worldUL  = this.gl.getUniformLocation(this.shaderProgram, "uWMatrix");
    
    this.colorUL  = this.gl.getUniformLocation(this.shaderProgram, "color");
};

Renderer.prototype.initBuffers = function()
{
    'use strict';
    
    this.squareVerticesBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVerticesBuffer);

    var vertices = new Float32Array([
        -0.5,  -0.5,  0.0,
        -0.5, 0.5,  0.0,
        0.5,  -0.5, 0.0,
        0.5, 0.5, 0.0
    ]);

    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
};

Renderer.prototype.setClearColor = function(clearColor)
{
    'use strict';
    this.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
};

Renderer.prototype.clear = function()
{
    'use strict';
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
};

Renderer.prototype.draw = function(actors)
{
    'use strict';

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVerticesBuffer);
    this.gl.vertexAttribPointer(this.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);
    
    this.gl.uniformMatrix4fv(this.viewprojUL, false, this.viewProj);
    
    var i;
    
    for(i = 0; i < actors.length; i++)
    {
        this.gl.uniformMatrix4fv(this.worldUL, false, actors[i].worldMatrix);
        this.gl.uniform4fv(this.colorUL, actors[i].color);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
};
