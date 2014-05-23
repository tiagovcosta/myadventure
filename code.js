/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true, bitwise: true */
/*global $, window, document, Math,
         vec2, vec3, vec4, mat4, 
         Renderer, InputManager, SpecialKeys,
         Script */

var scene;

var canvas;
var renderer;

var selectedActor;

var boxScalingActors;
var sphereScalingActor;
var rotationActor;

var movingCamera     = false;

var movingSelected   = false;
var rotatingSelected = false;
var scalingSelected  = false;

var mouseDownX;
var mouseDownY;

var modOriginX;
var modOriginY;

var inputManager;

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

function hexToRgb(hex)
{
    'use strict';
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


function rgbToHex(r, g, b)
{
    'use strict';
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function transformToObjectSpace(pos, actor)
{
    'use strict';
    
    var inverseMatrix = mat4.create();
    
    inverseMatrix = mat4.multiply(inverseMatrix, renderer.viewMatrix, actor.worldMatrix);

    mat4.invert(inverseMatrix, inverseMatrix);
    
    vec3.transformMat4(pos, pos, inverseMatrix);
}

function mouseOverActor(actor)
{
    'use strict';
    
    var mousePos = vec3.fromValues(inputManager.mouseX, inputManager.mouseY, 0.0);
    
    transformToObjectSpace(mousePos, actor);
    
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
    
    if(inputManager.mouseDown)
    {
        if(!movingSelected && !scalingSelected && !rotatingSelected && !movingCamera)
        {
            mouseDownX = inputManager.mouseX;
            mouseDownY = inputManager.mouseY;

            //document.getElementById("helper_span").innerHTML = mouseDownX + '-'+ mouseDownY;

            if(select())
            {
                movingSelected = true;
            }

            movingCamera = true;

            modOriginX = inputManager.mouseX - selectedActor.position[0];
            modOriginY = inputManager.mouseY - selectedActor.position[1];
        }
    } else
    {
        movingCamera     = false;
        movingSelected   = false;
        rotatingSelected = false;
        scalingSelected  = false;
    }
    
    if(movingSelected)
    {
        selectedActor.position[0] = inputManager.mouseX - modOriginX;
        selectedActor.position[1] = inputManager.mouseY - modOriginY;

        selectedActor.updateWorld();
    } else if(scalingSelected)
    {
        var tempMatrix = mat4.create();

        mat4.identity(tempMatrix);
        mat4.rotateZ(tempMatrix, tempMatrix, -selectedActor.rotation);

        var origin = vec3.fromValues(modOriginX, modOriginY, 0);
        vec3.transformMat4(origin, origin, tempMatrix);

        var dest = vec3.fromValues(inputManager.mouseX, inputManager.mouseY, 0);
        vec3.subtract(dest, dest, selectedActor.position);
        vec3.transformMat4(dest, dest, tempMatrix);

        selectedActor.scale[0] += Math.abs(dest[0]) - Math.abs(origin[0]);
        selectedActor.scale[1] += Math.abs(dest[1]) - Math.abs(origin[1]);

        var displacement = vec3.fromValues((dest[0] - origin[0])/2, (dest[1] - origin[1])/2, 0);

        mat4.identity(tempMatrix);
        mat4.rotateZ(tempMatrix, tempMatrix, selectedActor.rotation);

        vec3.transformMat4(displacement, displacement, tempMatrix);

        vec3.add(selectedActor.position, selectedActor.position, displacement);

        modOriginX = inputManager.mouseX - selectedActor.position[0];
        modOriginY = inputManager.mouseY - selectedActor.position[1];

        selectedActor.updateWorld();

    } else if(rotatingSelected)
    {
        selectedActor.rotation += 0.01;
        selectedActor.updateWorld();
    } else if(movingCamera)
    {
        renderer.setCameraPosition(-inputManager.mouseX + mouseDownX, -inputManager.mouseY + mouseDownY, 0);

        mouseDownX = inputManager.mouseX;
        mouseDownY = inputManager.mouseY;
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
            if (actor1.position[2] < actor2.position[2])
            {
                return true;
            } else
            {
                return false;
            }
      });

    processInput();
    
    scene.actors.forEach(function(entry)
              {
                  runScript(entry);
              });

    draw();
    
    document.getElementById("moving").innerHTML = movingSelected;

    document.getElementById("helper_span").innerHTML = "Left pressed: " + inputManager.keyPressed(SpecialKeys.LEFT);
}

function init()
{
    'use strict';
    
    canvas       = document.getElementById("canvas");
    
    inputManager = new InputManager(canvas);
    
    renderer     = new Renderer(canvas);
    renderer.setClearColor(vec4.fromValues(0,0,0,1));
    
    scene      = new Scene();
    
    var actor1 = new Actor(vec3.fromValues(300,200,-4), 
                           vec3.fromValues(150,100,1),
                           0,
                           vec4.fromValues(0.0,0.5,0.8,1));
    
    actor1.updateWorld();

    var script = new Script();
    script.conditions.push(new SnippedInstance(keyPressedSnippet, {key:'A'}));
    script.actions.push(new SnippedInstance(moveSnippet, {distance:10}));

    actor1.script = script;

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

function addActor()
{
    'use strict';

    var x = new Actor(vec3.fromValues(300,200,-4),
                      vec3.fromValues(150,100,1),
                      0,
                      vec4.fromValues(0.0,0.5,0.8,1));

    x.updateWorld();

    scene.actors.push(x);
}

function updateActorColor()
{
    'use strict';

    if(selectedActor !== null)
    {
        var color = hexToRgb(document.getElementById("actor_color").value);

        selectedActor.color[0] = color.r/255;
        selectedActor.color[1] = color.g/255;
        selectedActor.color[2] = color.b/255;
    }
}

function updateBackgroundColor()
{
    'use strict';

    var color = hexToRgb(document.getElementById("background_color").value);

    renderer.gl.clearColor(color.r/255, color.g/255, color.b/255, 1);
}

function runScript(actor)
{
    'use strict';

    var i;

    for(i = 0; i < actor.script.conditions.length; i++)
    {
        var condition = actor.script.conditions[i];

        if(!condition.snippet.func(actor, condition.args))
        {
            return false;
        }
    }

    for(i = 0; i < actor.script.actions.length; i++)
    {
        var action = actor.script.actions[i];
        action.snippet.func(actor, action.args);
    }
}
