/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true continue: true */
/*global vec3, vec4,
         Actor, Script*/

function DynamicActor(name, position, scale, rotation, color)
{
    'use strict';

    Actor.call(this, position, scale, rotation, color);

    this.name   = name;
    this.type   = null;
    this.script = null;
}

DynamicActor.prototype = Object.create(Actor.prototype);
DynamicActor.prototype.constructor = DynamicActor;

function Game()
{
    'use strict';

    this.actors = [];
    this.scripts = [];
}

Game.prototype.update = function()
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

Game.prototype.addActor = function(name, position, scale, rotation, color)
{
    'use strict';

    var x = new DynamicActor(name, position,
                             scale, rotation,
                             color);

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

Game.prototype.checkCollisions = function(actor, type, direction)
{
    'use strict';

    if(actor == null)
    {
        return false;
    }

    var i;

    var func;

    //Select requested function
    switch(direction)
    {
        case 'top':
            func = Actor.prototype.collidingFromTop;
            break;
        case 'bottom':
            func = Actor.prototype.collidingFromBottom;
            break;
        case 'left':
            func = Actor.prototype.collidingFromLeft;
            break;
        case 'right':
            func = Actor.prototype.collidingFromRight;
            break;
        default:
            func = Actor.prototype.colliding;
    }

    for(i = 0; i < this.actors.length; i++)
    {
        var otherActor = this.actors[i];

        if(actor === otherActor || otherActor.type !== type)
        {
            continue;
        }

        if(func.call(actor, otherActor))
        {
            return true;
        }
    }

    return false;
};
