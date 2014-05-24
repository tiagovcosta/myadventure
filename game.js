/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true continue: true */
/*global vec3, vec4,
         Actor, Script */

function DynamicActor(name, position, scale, rotation, color)
{
    'use strict';

    this.name = name;

    Actor.call(this, position, scale, rotation, color);

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

    for(j = 0; j < this.actors.length; j++)
    {
        var actor = this.actors[j];

        if(actor.script === null || actor.script === undefined)
        {
            continue;
        }

        var flag = true;

        //Check conditions
        for(i = 0; i < actor.script.conditions.length; i++)
        {
            var condition = actor.script.conditions[i];

            if(!condition.snippet.func(actor, condition.args))
            {
                flag = false;
            }
        }

        if(!flag) //If not all conditions are met
        {
            continue;
        }

        //Execute actions
        for(i = 0; i < actor.script.actions.length; i++)
        {
            var action = actor.script.actions[i];
            action.snippet.func(actor, action.args);
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

    var x = new Script();

    this.scripts.push(x);

    return x;
};
