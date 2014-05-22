/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true*/
/*global $, window, document, Math,
         vec2, vec3, vec4, mat4, 
         Renderer, MouseManager, MouseEvents */

var scene;

var canvas;
var renderer;

var selectedActor;

var boxScalingActors;
var sphereScalingActor;
var rotationActor;

var movingSelected = false;
var rotatingSelected = false;
var scalingSelected = false;

var modOriginX;
var modOriginY;

var scalingOriginX;
var scalingOriginY;

var mouseManager;

function Actor(position, scale, rotation, color)
{
    'use strict';
    this.position = position;
    this.scale    = scale;
    this.rotation = rotation;
    this.color    = color;
    
    this.worldMatrix = mat4.create();
}

Actor.prototype.updateWorld = function(parent)
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
    
    if(parent !== null && parent !== undefined)
    {
        mat4.multiply(this.worldMatrix, parent, this.worldMatrix);
    }
};

function Scene()
{
    'use strict';
    this.actors = [];
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
    
    var mousePos = vec3.fromValues(mouseManager.mouseX, mouseManager.mouseY, 0.0);
    
    transformToObjectSpace(mousePos, actor.worldMatrix);
    
    if(mousePos[0] >= -0.5 && mousePos[0] <= 0.5 &&
       mousePos[1] >= -0.5 && mousePos[1] <= 0.5)
    {
        return true;
    }
    
    return false;
}

function updateSelectedActors()
{
    'use strict';
    
    if(selectedActor === null)
    {
        return;
    }
    
    var size = selectedActor.scale;

    var center = vec3.fromValues(0,0,0);
    var tl     = vec3.fromValues(-size[0]/2, size[1]/2, 0);
    var tr     = vec3.fromValues(size[0]/2, size[1]/2, 0);
    var bl     = vec3.fromValues(-size[0]/2, -size[1]/2, 0);
    var br     = vec3.fromValues(size[0]/2, -size[1]/2, 0);
    
    var rotation = mat4.create();
    mat4.identity(rotation);
    mat4.rotateZ(rotation, rotation, selectedActor.rotation);
    
    vec3.transformMat4(tl, tl, rotation);
    vec3.transformMat4(tr, tr, rotation);
    vec3.transformMat4(bl, bl, rotation);
    vec3.transformMat4(br, br, rotation);
    
    vec3.add(center, center, selectedActor.position);
    vec3.add(tl, tl, selectedActor.position);
    vec3.add(tr, tr, selectedActor.position);
    vec3.add(bl, bl, selectedActor.position);
    vec3.add(br, br, selectedActor.position);

    center[2] = -0.1;
    tl[2]     = -0.1;
    tr[2]     = -0.1;
    bl[2]     = -0.1;
    br[2]     = -0.1;

    rotationActor.position = center;
    rotationActor.rotation = selectedActor.rotation;

    boxScalingActors[0].position = tl;
    boxScalingActors[0].rotation = selectedActor.rotation;
    boxScalingActors[1].position = tr;
    boxScalingActors[1].rotation = selectedActor.rotation;
    boxScalingActors[2].position = bl;
    boxScalingActors[2].rotation = selectedActor.rotation;
    boxScalingActors[3].position = br;
    boxScalingActors[3].rotation = selectedActor.rotation;

    rotationActor.updateWorld();
    boxScalingActors[0].updateWorld();
    boxScalingActors[1].updateWorld();
    boxScalingActors[2].updateWorld();
    boxScalingActors[3].updateWorld();

    if(mouseOverActor(rotationActor))
    {
        rotationActor.color = vec4.fromValues(1,0,0,1);
    } else
    {
        rotationActor.color = vec4.fromValues(1,1,1,1);
    }

    var i;
    for(i = 0; i < boxScalingActors.length; i++)
    {
        if(mouseOverActor(boxScalingActors[i]))
        {
            boxScalingActors[i].color = vec4.fromValues(1,0,0,1);
        } else
        {
            boxScalingActors[i].color = vec4.fromValues(1,1,1,1);
        }
    }
}

function select()
{
    'use strict';
    
    var i;

    if(selectedActor !== null)
    {
        if(mouseOverActor(rotationActor))
        {
            rotatingSelected = true;
            return false;
        }

        for(i = 0; i < boxScalingActors.length; i++)
        {
            if(mouseOverActor(boxScalingActors[i]))
            {
                scalingSelected = true;
                return false;
            }
        }
    }

    for(i = 0; i < scene.actors.length; i++)
    {
        if(mouseOverActor(scene.actors[i]))
        {
            selectedActor = scene.actors[i];

            return true;
        }
    }
    
    selectedActor = null;
    return false;
}

function processInput()
{
    'use strict';
    
    while(mouseManager.mouseEventsQueue.length > 0)
    {
        switch(mouseManager.mouseEventsQueue.shift())
        {
            case MouseEvents.DOWN:

                if(select())
                {
                    movingSelected = true;
                }

                modOriginX = mouseManager.mouseX - selectedActor.position[0];
                modOriginY = mouseManager.mouseY - selectedActor.position[1];

                scalingOriginX = mouseManager.mouseX;
                scalingOriginY = mouseManager.mouseY;

                break;
            case MouseEvents.UP:

                movingSelected   = false;
                rotatingSelected = false;
                scalingSelected  = false;

                break;
            case MouseEvents.OUT:
                
                movingSelected   = false;
                rotatingSelected = false;
                scalingSelected  = false;

                break;
        }
    }
    
    if(movingSelected)
    {
        selectedActor.position[0] = mouseManager.mouseX - modOriginX;
        selectedActor.position[1] = mouseManager.mouseY - modOriginY;

        selectedActor.updateWorld();
    }

    if(scalingSelected)
    {
        var tempMatrix = mat4.create();

        mat4.identity(tempMatrix);
        mat4.rotateZ(tempMatrix, tempMatrix, -selectedActor.rotation);

        var origin = vec3.fromValues(modOriginX, modOriginY, 0);
        vec3.transformMat4(origin, origin, tempMatrix);

        var dest = vec3.fromValues(mouseManager.mouseX, mouseManager.mouseY, 0);
        vec3.subtract(dest, dest, selectedActor.position);
        vec3.transformMat4(dest, dest, tempMatrix);

        selectedActor.scale[0] += Math.abs(dest[0]) - Math.abs(origin[0]);
        selectedActor.scale[1] += Math.abs(dest[1]) - Math.abs(origin[1]);

        var displacement = vec3.fromValues((dest[0] - origin[0])/2, (dest[1] - origin[1])/2, 0);

        mat4.identity(tempMatrix);
        mat4.rotateZ(tempMatrix, tempMatrix, selectedActor.rotation);

        vec3.transformMat4(displacement, displacement, tempMatrix);

        vec3.add(selectedActor.position, selectedActor.position, displacement);

        document.getElementById("helper_span").innerHTML = (dest[0] - origin[0])/2;

        modOriginX = mouseManager.mouseX - selectedActor.position[0];
        modOriginY = mouseManager.mouseY - selectedActor.position[1];

        selectedActor.updateWorld();
    }

    if(rotatingSelected)
    {
        selectedActor.rotation += 0.01;
        selectedActor.updateWorld();
    }

    updateSelectedActors();
}

function draw()
{
    'use strict';

    renderer.clear();

    renderer.draw(scene.actors);

    if(selectedActor !== null)
    {
        renderer.draw(boxScalingActors);
        renderer.draw([rotationActor]);
    }
}

function update()
{
    'use strict';
    
    scene.actors.sort(function(actor1, actor2)
                      {
                            if (actor1.position[2] < actor2.zIndex.position[2])
                            {
                                return true;
                            } else
                            {
                                return false;
                            }
                      });

    processInput();
    
    draw();
    
    document.getElementById("moving").innerHTML = movingSelected;
}



function init()
{
    'use strict';
    
    canvas = document.getElementById("canvas");
    
    mouseManager = new MouseManager(canvas);
    
    renderer = new Renderer(canvas);
    renderer.setClearColor(vec4.fromValues(0,0,0,1));
    
    scene = new Scene();
    
    var actor1 = new Actor(vec3.fromValues(300,200,-4), 
                           vec3.fromValues(150,100,1),
                           Math.PI/2,
                           vec4.fromValues(0.0,0.5,0.8,1));
    
    actor1.updateWorld();

    scene.actors.push(actor1);
    
    selectedActor    = null;

    boxScalingActors = [];

    boxScalingActors.push(new Actor(null, vec3.fromValues(10,10,1),
                          0,
                          vec4.fromValues(1,1,1,1)));
    boxScalingActors.push(new Actor(null, vec3.fromValues(10,10,1),
                          0,
                          vec4.fromValues(1,1,1,1)));
    boxScalingActors.push(new Actor(null, vec3.fromValues(10,10,1),
                          0,
                          vec4.fromValues(1,1,1,1)));
    boxScalingActors.push(new Actor(null, vec3.fromValues(10,10,1),
                          0,
                          vec4.fromValues(1,1,1,1)));

    rotationActor = new Actor(vec3.create(), vec3.fromValues(10,10,1),
                              0, vec4.fromValues(1,1,1,1));
    
    setInterval(update, 1000/60);
}
