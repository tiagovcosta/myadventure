/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true continue: true */
/*global vec2, vec3, vec4,
         Actor, Script, Physics*/

function DynamicActor(name, position, scale, rotation, color, type)
{
    'use strict';

    Actor.call(this, position, scale, rotation, color);

    this.name   = name;
    this.type   = type;
    this.script = null;
    this.body   = null;
}

DynamicActor.prototype = Object.create(Actor.prototype);
DynamicActor.prototype.constructor = DynamicActor;

function Game()
{
    'use strict';

    this.physics = null;
    this.actors  = [];
    this.scripts = [];

    this.running = false;
}

Game.prototype.update = function(dt)
{
    'use strict';

    //Sort actors by depth
    this.actors.sort(function(actor1, actor2)
      {
            if (actor1.position[2] < actor2.position[2])
            {
                return true;
            } else
            {
                return false;
            }
      });

    //Update

    if(!this.running)
    {
        return;
    }

    this.physics.world.Step(dt, //frame-rate
                            10,     //velocity iterations
                            10);    //position iterations

    this.physics.world.ClearForces();

    var i;

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        actor.position[0] = actor.body.GetPosition().x;
        actor.position[1] = actor.body.GetPosition().y;
        actor.rotation    = actor.body.GetAngle();
        actor.updateWorld();
    }
};

Game.prototype.runScripts = function()
{
    'use strict';

    var i;
    var j;
    var k;

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        if(actor.script === null || actor.script === undefined)
        {
            continue;
        }

        for(j = 0; j < actor.script.rules.length; j++)
        {
            var rule = actor.script.rules[j];

            var flag = true;

            //Check conditions
            for(k = 0; k < rule.conditions.length; k++)
            {
                var condition = rule.conditions[k];

                if(!condition.snippet.func(actor, condition.args))
                {
                    if(!condition.args.not)
                    {
                        flag = false;
                    }
                } else if(condition.args.not)
                {
                    flag = false;
                }
            }

            if(!flag) //If not all conditions are met
            {
                continue;
            }

            //Execute actions
            for(k = 0; k < rule.actions.length; k++)
            {
                var action = rule.actions[k];
                action.snippet.func(actor, action.args);
            }
        }
    }
};

Game.prototype.addActor = function(name, position, scale, rotation, color, type)
{
    'use strict';

    var x = new DynamicActor(name, position,
                             scale, rotation,
                             color, type);

    x.updateWorld();

    this.actors.push(x);

    return x;
};

Game.prototype.newScript = function()
{
    'use strict';

    var x = new Script("script"+this.scripts.length);

    this.scripts.push(x);

    return x;
};

Game.prototype.restartPhysics = function()
{
    'use strict';

    this.physics = new Physics();

    var i;

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        actor.body = this.physics.createBox(actor.position[0],
                                            actor.position[1],
                                            actor.scale[0]/2,
                                            actor.scale[1]/2,
                                            actor.type);
    }
};
