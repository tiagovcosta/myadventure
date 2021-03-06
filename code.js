/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true, bitwise: true */
/*global $, window, document, Math, angular,
         vec2, vec3, vec4, mat4, b2Body,
         Actor, Renderer, Game, InputManager, SpecialKeys,
         Script, Utilities, Rule, conditions, actions,
         Blob, FileReader,
         keyPressedSnippet, forceSnippet, velocityXSnippet, velocityYSnippet*/

var renderer;

var inputManager;

var game;

var canvas;

function mouseOverActor(actor)
{
    'use strict';

    var mousePos = vec3.fromValues(inputManager.mouseX, inputManager.mouseY, 0.0);

    renderer.transformToObjectSpace(mousePos, actor);

    if(mousePos[0] >= -0.5 && mousePos[0] <= 0.5 &&
       mousePos[1] >= -0.5 && mousePos[1] <= 0.5)
    {
        return true;
    }

    return false;
}

var module = angular.module('youradventure', []);

module.controller("MainCtrl", function($scope)
{
    'use strict';

    $scope.game = null;
    $scope.gameClone = null;

    $scope.running = false;

    $scope.cameraPos = vec2.create();

    $scope.viewDistance = 20;

    $scope.$watch("viewDistance", function()
    {
        if(renderer !== undefined)
        {
            renderer.setViewDistance($scope.viewDistance);
        }

        if(inputManager !== undefined)
        {
            inputManager.setViewDistance($scope.viewDistance);
        }
    });

    $scope.$watch("running", function()
    {
        if(game === undefined)
        {
            return;
        }

        game.running = $scope.running;

        if(game.running)
        {
            $scope.cameraPos[0] = renderer.cameraPosition[0];
            $scope.cameraPos[1] = renderer.cameraPosition[1];

            $scope.gameClone = $scope.game.clone();
            game.restartPhysics();
        } else
        {
            //Reset camera position

            renderer.setCameraPosition($scope.cameraPos[0],
                                       $scope.cameraPos[1],
                                       0);

            if($scope.selectedActor !== null)
            {
                //Calculate selected actor on clone game
                var i =
                    $scope.game.actors.indexOf($scope.selectedActor);
                $scope.selectedActor = $scope.gameClone.actors[i];
            }

            $scope.game = $scope.gameClone;
            game = $scope.game;
        }
    });

    $scope.save = function()
    {
        var link = $("#download");
        link.attr('href',(window.URL || window.webkitURL).createObjectURL( new Blob([ $scope.game.save() ], { type : 'text/plain' })));
    };

    $scope.scripts = [];
    $scope.selectedScript = null;

    $scope.conditions = conditions;
    $scope.actions    = actions;

    $scope.selectedActor    = null;

    $scope.movingCamera     = false;

    $scope.movingSelected   = false;
    $scope.rotatingSelected = false;
    $scope.scalingSelected  = false;

    $scope.mouseDownX         = 0;
    $scope.mouseDownY         = 0;
    
    $scope.mouseDownOffsetX   = 0;
    $scope.mouseDownOffsetY   = 0;
    
    $scope.ifnot =
    {
        "If": false,
        "If not": true
    };

    $scope.actorTypes =
    {
        'Static': b2Body.b2_staticBody,
        'Kinematic': b2Body.b2_kinematicBody,
        'Dynamic': b2Body.b2_dynamicBody
    };

    $scope.boxScalingActors = [new Actor(null,
                                         vec3.fromValues(0.25,0.25,1),
                                         0,
                                         vec4.fromValues(1,1,1,1)),
                               new Actor(null,
                                         vec3.fromValues(0.25,0.25,1),
                                         0,
                                         vec4.fromValues(1,1,1,1)),
                               new Actor(null,
                                         vec3.fromValues(0.25,0.25,1),
                                         0,
                                         vec4.fromValues(1,1,1,1)),
                               new Actor(null,
                                         vec3.fromValues(0.25,0.25,1),
                                         0,
                                         vec4.fromValues(1,1,1,1))];
    
    $scope.sphereScalingActor = null;

    $scope.rotationActor = new Actor(vec3.create(),
                                     vec3.fromValues(0.25,0.25,1),
                                     0,
                                     vec4.fromValues(1,1,1,1));
    
    $scope.$watch("selectedActor", function()
    {
        if($scope.selectedActor === null)
        {
            return;
        }

        var color = $scope.selectedActor.color;

        $(".selectedColorPick").colorpicker('setValue', Utilities.rgbToHex(color[0]*255, color[1]*255, color[2]*255));
    });
    
    $scope.mouseDown = function(event)
    {
        if(event.which !== 1) //only allow left mouse button
        {
            return;
        }

        if(!$scope.movingSelected &&
           !$scope.scalingSelected &&
           !$scope.rotatingSelected &&
           !$scope.movingCamera)
        {
            $scope.mouseDownX = inputManager.mouseX;
            $scope.mouseDownY = inputManager.mouseY;

            if($scope.select())
            {
                $scope.movingSelected = true;
            }

            if($scope.selectedActor === null)
            {
                $scope.movingCamera = true;
                return;
            }

            $scope.mouseDownOffsetX = inputManager.mouseX - $scope.selectedActor.position[0];
            $scope.mouseDownOffsetY = inputManager.mouseY - $scope.selectedActor.position[1];
        }
    };
    
    $scope.mouseUp = function()
    {
        $scope.movingCamera     = false;
        $scope.movingSelected   = false;
        $scope.rotatingSelected = false;
        $scope.scalingSelected  = false;
    };

    $scope.mouseMove = function()
    {
        if($scope.movingSelected)
        {
            $scope.selectedActor.position[0] = inputManager.mouseX - $scope.mouseDownOffsetX;
            $scope.selectedActor.position[1] = inputManager.mouseY - $scope.mouseDownOffsetY;

            $scope.selectedActor.updateWorld();
        } else if($scope.scalingSelected)
        {
            var tempMatrix = mat4.create();

            mat4.identity(tempMatrix);
            mat4.rotateZ(tempMatrix, tempMatrix,
                         -$scope.selectedActor.rotation);

            var origin = vec3.fromValues($scope.mouseDownOffsetX,
                                         $scope.mouseDownOffsetY, 0);
            vec3.transformMat4(origin, origin, tempMatrix);

            var dest = vec3.fromValues(inputManager.mouseX,
                                       inputManager.mouseY, 0);
            vec3.subtract(dest, dest, $scope.selectedActor.position);
            vec3.transformMat4(dest, dest, tempMatrix);

            $scope.selectedActor.scale[0] += Math.abs(dest[0]) - Math.abs(origin[0]);
            $scope.selectedActor.scale[1] += Math.abs(dest[1]) - Math.abs(origin[1]);

            var displacement = vec3.fromValues((dest[0] - origin[0])/2, (dest[1] - origin[1])/2, 0);

            mat4.identity(tempMatrix);
            mat4.rotateZ(tempMatrix, tempMatrix,
                         $scope.selectedActor.rotation);

            vec3.transformMat4(displacement, displacement,
                               tempMatrix);

            vec3.add($scope.selectedActor.position,
                     $scope.selectedActor.position,
                     displacement);

            $scope.mouseDownOffsetX = inputManager.mouseX - $scope.selectedActor.position[0];
            $scope.mouseDownOffsetY = inputManager.mouseY - $scope.selectedActor.position[1];

            $scope.selectedActor.updateWorld();

        } else if($scope.rotatingSelected)
        {
            $scope.selectedActor.rotation += 0.01;
            $scope.selectedActor.updateWorld();
        } else if($scope.movingCamera)
        {
            renderer.moveCameraPosition(-inputManager.mouseX + $scope.mouseDownX, -inputManager.mouseY + $scope.mouseDownY, 0);

            $scope.mouseDownX = inputManager.mouseX;
            $scope.mouseDownY = inputManager.mouseY;
        }

        $scope.updateSelectedActors();
        };
    
    $scope.select = function()
    {
        var i;

        if($scope.selectedActor !== null)
        {
            if(mouseOverActor($scope.rotationActor))
            {
                $scope.rotatingSelected = true;
                return false;
            }

            for(i = 0; i < $scope.boxScalingActors.length; i++)
            {
                if(mouseOverActor($scope.boxScalingActors[i]))
                {
                    $scope.scalingSelected = true;
                    return false;
                }
            }
        }

        for(i = 0; i < game.actors.length; i++)
        {
            if(mouseOverActor(game.actors[i]))
            {
                $scope.selectedActor = game.actors[i];

                return true;
            }
        }

        $scope.selectedActor = null;
        return false;
    };
    
    $scope.updateSelectedActors = function()
    {
        if($scope.selectedActor === null)
        {
            return;
        }

        var size = $scope.selectedActor.scale;

        var center = vec3.fromValues(0,0,0);
        var tl     = vec3.fromValues(-size[0]/2, size[1]/2, 0);
        var tr     = vec3.fromValues(size[0]/2, size[1]/2, 0);
        var bl     = vec3.fromValues(-size[0]/2, -size[1]/2, 0);
        var br     = vec3.fromValues(size[0]/2, -size[1]/2, 0);

        var rotation = mat4.create();
        mat4.identity(rotation);
        mat4.rotateZ(rotation, rotation, $scope.selectedActor.rotation);

        vec3.transformMat4(tl, tl, rotation);
        vec3.transformMat4(tr, tr, rotation);
        vec3.transformMat4(bl, bl, rotation);
        vec3.transformMat4(br, br, rotation);

        vec3.add(center, center, $scope.selectedActor.position);
        vec3.add(tl, tl, $scope.selectedActor.position);
        vec3.add(tr, tr, $scope.selectedActor.position);
        vec3.add(bl, bl, $scope.selectedActor.position);
        vec3.add(br, br, $scope.selectedActor.position);

        center[2] = -0.1;
        tl[2]     = -0.1;
        tr[2]     = -0.1;
        bl[2]     = -0.1;
        br[2]     = -0.1;

        $scope.rotationActor.position = center;
        $scope.rotationActor.rotation = $scope.selectedActor.rotation;

        $scope.boxScalingActors[0].position = tl;
        $scope.boxScalingActors[0].rotation = $scope.selectedActor.rotation;
        $scope.boxScalingActors[1].position = tr;
        $scope.boxScalingActors[1].rotation = $scope.selectedActor.rotation;
        $scope.boxScalingActors[2].position = bl;
        $scope.boxScalingActors[2].rotation = $scope.selectedActor.rotation;
        $scope.boxScalingActors[3].position = br;
        $scope.boxScalingActors[3].rotation = $scope.selectedActor.rotation;

        $scope.rotationActor.updateWorld();
        $scope.boxScalingActors[0].updateWorld();
        $scope.boxScalingActors[1].updateWorld();
        $scope.boxScalingActors[2].updateWorld();
        $scope.boxScalingActors[3].updateWorld();

        if(mouseOverActor($scope.rotationActor))
        {
            $scope.rotationActor.color = vec4.fromValues(1,0,0,1);
        } else
        {
            $scope.rotationActor.color = vec4.fromValues(1,1,1,1);
        }

        var i;
        for(i = 0; i < $scope.boxScalingActors.length; i++)
        {
            if(mouseOverActor($scope.boxScalingActors[i]))
            {
                $scope.boxScalingActors[i].color = vec4.fromValues(1,0,0,1);
            } else
            {
                $scope.boxScalingActors[i].color = vec4.fromValues(1,1,1,1);
            }
        }
    };
    
    $scope.drawSelectedActors = function()
    {
        if($scope.selectedActor !== null)
        {
            $scope.updateSelectedActors();
            renderer.draw($scope.boxScalingActors);
            renderer.draw([$scope.rotationActor]);
        }
    };
});

function draw()
{
    'use strict';

    renderer.clear();

    renderer.draw(game.actors);

    angular.element("body").scope().drawSelectedActors();
}

function update()
{
    'use strict';

    game.update(1/60);

    draw();

    $("#helper_span").innerHTML = "Left pressed: " + inputManager.keyPressed(SpecialKeys.LEFT);
}

function init()
{
    'use strict';
    
    $(".backgroundColorPick").colorpicker().on('changeColor', function(ev)
                                     {
                                         var color = Utilities.hexToRgb(ev.color.toHex());
                                         renderer.setClearColor(vec4.fromValues(color.r/255, color.g/255, color.b/255, 1));
                                     });

    $(".selectedColorPick").colorpicker().on('changeColor', function(ev)
                                     {
                                         var color = Utilities.hexToRgb(ev.color.toHex());
                                         angular.element("body").scope().selectedActor.color[0] = color.r/255;
                                         angular.element("body").scope().selectedActor.color[1] = color.g/255;
                                         angular.element("body").scope().selectedActor.color[2] = color.b/255;
                                     });

    canvas       = document.getElementById("canvas");
    
    inputManager = new InputManager(canvas);
    
    renderer     = new Renderer(canvas);
    renderer.setClearColor(vec4.fromValues(0,0,0,1));
    
    game       = new Game();
    
    /*var ground = game.addActor(vec3.fromValues(0,-7.5,-4),
                               vec3.fromValues(200,2,1),
                               0,
                               vec4.fromValues(0.0,0.5,0.8,1),
                               b2Body.b2_staticBody);
    
    game.restartPhysics();*/

    /*var playerScript = game.newScript();
    playerScript.name = "Player_script";

    var moveLeftRule = playerScript.newRule();
    moveLeftRule.newCondition(keyPressedSnippet).args.key = SpecialKeys.LEFT;
    moveLeftRule.newAction(forceSnippet).args.intensityX = -750;

    var moveRightRule = playerScript.newRule();
    moveRightRule.newCondition(keyPressedSnippet).args.key = SpecialKeys.RIGHT;
    moveRightRule.newAction(forceSnippet).args.intensityX = 750;

    var jumpRule = playerScript.newRule();
    jumpRule.newCondition(keyPressedSnippet).args.key = SpecialKeys.UP;
    jumpRule.newAction(forceSnippet).args.intensityY = 750;

    var playerScript2 = game.newScript();
    playerScript2.name = "Player_script2";

    moveLeftRule = playerScript2.newRule();
    moveLeftRule.newCondition(keyPressedSnippet).args.key = SpecialKeys.LEFT;
    moveLeftRule.newAction(velocityXSnippet).args.velocityX = -10;

    moveRightRule = playerScript2.newRule();
    moveRightRule.newCondition(keyPressedSnippet).args.key = SpecialKeys.RIGHT;
    moveRightRule.newAction(velocityXSnippet).args.velocityX = 10;

    var stopMoveRule = playerScript2.newRule();
    stopMoveRule.newCondition(keyPressedSnippet).args = {key:SpecialKeys.RIGHT, not:true};
    stopMoveRule.newCondition(keyPressedSnippet).args = {key:SpecialKeys.LEFT, not:true};
    stopMoveRule.newAction(velocityXSnippet).args.velocityX = 0;

    jumpRule = playerScript2.newRule();
    jumpRule.newCondition(keyPressedSnippet).args.key = SpecialKeys.UP;
    jumpRule.newAction(velocityYSnippet).args.velocityY = 10;*/


    //Init game on angularjs
    angular.element("body").scope().game    = game;
    angular.element("body").scope().scripts = game.scripts;
    angular.element("body").scope().$apply();

    setInterval(update, 1000/60);
}

function load()
{
    'use strict';

    var file = $("#file")[0].files[0];

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt)
    {
      if (evt.target.readyState === FileReader.DONE)
      { // DONE == 2
          game.load(evt.target.result);
          game.restartPhysics();
      }
    };

    reader.readAsArrayBuffer(file);
}
