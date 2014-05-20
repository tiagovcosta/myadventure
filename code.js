/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true*/
/*global $, window, document, 
         vec2, vec3, vec4, mat4, 
         Renderer */

// ......................
function Actor(position, scale, rotation, color)
{
    'use strict';
    this.position = position;
    this.scale    = scale;
    this.rotation = rotation;
    this.color    = color;
    
    this.worldMatrix = mat4.create();
    
    this.updateWorld();
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

function Scene()
{
    'use strict';
    this.actors = [];
}

var scene;

var canvas;
var renderer;

var selected;

var mouseX = null;
var mouseY = null;
var mouseOver = false;

var mouseEventsQueue = [];

var MouseEvents =
    {
        DOWN : 0,
        UP   : 1,
        OUT  : 2,
        OVER: 3
    };

function handleMouseDown(event)
{
    'use strict';
    
    mouseEventsQueue.push(MouseEvents.DOWN);
}

function handleMouseUp(event)
{
    'use strict';
    
    mouseEventsQueue.push(MouseEvents.UP);
}

function handleMouseMove(event)
{
    'use strict';
    
    if(!mouseOver)
    {
        mouseOver = true;
        mouseEventsQueue.push(MouseEvents.OVER);
    }
    
    var rect = canvas.getBoundingClientRect();
    
    mouseX = event.clientX - rect.left;
    mouseY = canvas.height - event.clientY + rect.top;
}

function handleMouseOut(event)
{
    'use strict';
    
    mouseOver = false;
    mouseEventsQueue.push(MouseEvents.OUT);
}

function draw()
{
    'use strict';
    
    renderer.clear();
    
    renderer.draw(scene.actors);
}

function transformToObjectSpace(pos, matrix)
{
    'use strict';
    
    var inverseMatrix = mat4.create();
    
    mat4.invert(inverseMatrix, matrix);
    
    vec3.transformMat4(pos, pos, inverseMatrix);
}

function mouseOverActor(actor)
{
    'use strict';
    
    var mousePos = vec3.fromValues(mouseX, mouseY, 0.0);
    
    transformToObjectSpace(mousePos, actor.worldMatrix);
    
    if(mousePos[0] >= -0.5 && mousePos[0] <= 0.5 &&
       mousePos[1] >= -0.5 && mousePos[1] <= 0.5)
    {
        return true;
    }
    
    return false;
}

function drawSelected()
{
    'use strict';
    
    var size = selected.scale;
    
    var tl = vec3.fromValues(-size[0]/2, size[1]/2,0);
    var tr = vec3.fromValues(size[0]/2, size[1]/2,0);
    var bl = vec3.fromValues(-size[0]/2, -size[1]/2,0);
    var br = vec3.fromValues(size[0]/2, -size[1]/2,0);
    
    var rotation = mat4.create();
    mat4.identity(rotation);
    mat4.rotateZ(rotation, rotation, selected.rotation);
    
    vec3.transformMat4(tl, tl, rotation);
    vec3.transformMat4(tr, tr, rotation);
    vec3.transformMat4(bl, bl, rotation);
    vec3.transformMat4(br, br, rotation);
    
    vec3.add(tl, tl, selected.position);
    vec3.add(tr, tr, selected.position);
    vec3.add(bl, bl, selected.position);
    vec3.add(br, br, selected.position);
    
    tl[2] = -0.1;
    tr[2] = -0.1;
    bl[2] = -0.1;
    br[2] = -0.1;
    
    var actors = [];
    
    actors.push(new Actor(tl, vec3.fromValues(10,10,1),
                          selected.rotation, 
                          vec4.fromValues(1,1,1,1)));
    actors.push(new Actor(tr, vec3.fromValues(10,10,1),
                          selected.rotation, 
                          vec4.fromValues(1,1,1,1)));
    actors.push(new Actor(bl, vec3.fromValues(10,10,1),
                          selected.rotation, 
                          vec4.fromValues(1,1,1,1)));
    actors.push(new Actor(br, vec3.fromValues(10,10,1),
                          selected.rotation, 
                          vec4.fromValues(1,1,1,1)));
    
    var mousePos = vec3.fromValues(mouseX, mouseY, 0.0);
    
    var inverseWorld = mat4.create();
    
    mat4.invert(inverseWorld, actors[0].worldMatrix);
    
    vec3.transformMat4(mousePos, mousePos, inverseWorld);
    
    var flag = false;
    var i;
    for(i = 0; i < actors.length; i++)
    {
        if(mouseOverActor(actors[i]))
        {
            actors[i].color = vec4.fromValues(1,0,0,1);
            flag = true;
        }
    }
    
    if(flag)
    {
        canvas.style.cursor = "nesw-resize";
    } else
    {
        canvas.style.cursor = "default";
    }
    
    renderer.draw(actors);
}

var movingSelected = false;

function processSelected()
{
    'use strict';
    
    while(mouseEventsQueue.length > 0)
    {
        switch(mouseEventsQueue.shift())
        {
            case MouseEvents.DOWN:
                if(mouseOverActor(selected))
                {
                   movingSelected = true;
                }
                break;
            case MouseEvents.UP:
                movingSelected = false;
                break;
            case MouseEvents.OUT:
                movingSelected = false;
                break;
                
        }
    }
    
    if(movingSelected)
    {
        selected.position[0] = mouseX;
        selected.position[1] = mouseY;
        selected.updateWorld();
    }
}

function update()
{
    'use strict';
    
    processSelected();
    
    draw();
    
    drawSelected();
}

function init()
{
    'use strict';
    
    canvas = document.getElementById("canvas");
    
    canvas.onmousedown = handleMouseDown;
    canvas.onmouseup   = handleMouseUp;
    canvas.onmousemove = handleMouseMove;
    canvas.onmouseout  = handleMouseOut;
    
    renderer = new Renderer(canvas);
    renderer.setClearColor(vec4.fromValues(0,0,0,1));
    
    scene = new Scene();
    
    var actor1 = new Actor(vec3.fromValues(300,200,-4), 
                           vec3.fromValues(150,100,1),
                           Math.PI/4,
                           vec4.fromValues(0.0,0.5,0.8,1));
    
    scene.actors.push(actor1);
    
    selected = actor1;
    
    setInterval(update, 33);
}