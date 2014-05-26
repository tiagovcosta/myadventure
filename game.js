/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true continue: true */
/*global vec2, vec3, vec4,
         Actor, Script, Physics, Box2D,
         renderer */

function DynamicActor(name, position, scale, rotation, color, type)
{
    'use strict';

    Actor.call(this, position, scale, rotation, color);

    this.name       = name;
    this.type       = type;
    this.actorClass = "";
    this.script     = null;
    this.body       = null;

    this.collisions = [];
}

DynamicActor.prototype = Object.create(Actor.prototype);
DynamicActor.prototype.constructor = DynamicActor;

DynamicActor.prototype.checkCollisions = function(actorClass,
                                                   direction)
{
    'use strict';

    var i = 0;

    for(i = 0; i < this.collisions.length; i++)
    {
        if(this.collisions[i].actorClass === actorClass)
        {
            return true;
        }
    }
};

function Game()
{
    'use strict';

    this.physics = null;
    this.actors  = [];
    this.scripts = [];

    this.player = null;

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

    this.runScripts();

    var i;

    //Clear collisions

    for(i = 0; i < this.actors.length; i++)
    {
        this.actors[i].collisions = [];
    }

    this.physics.world.Step(dt, //frame-rate
                            10,     //velocity iterations
                            10);    //position iterations

    this.physics.world.ClearForces();

    //Update positions

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        actor.position[0] = actor.body.GetPosition().x;
        actor.position[1] = actor.body.GetPosition().y;
        actor.rotation    = actor.body.GetAngle();
        actor.updateWorld();
    }

    if(this.player !== null)
    {
        renderer.setCameraPosition(this.player.position[0],
                                   this.player.position[1]);
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

Game.prototype.addActor = function(position, scale, rotation, color, type)
{
    'use strict';

    var x = new DynamicActor("actor"+this.actors.length,
                             position,
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

var contactListener = new Box2D.Dynamics.b2ContactListener();

contactListener.BeginContact = function(contact, manifold)
{
   'use strict';

    var a = contact.GetFixtureA().GetBody().GetUserData();
    var b = contact.GetFixtureB().GetBody().GetUserData();

    a.collisions.push(b);
    b.collisions.push(a);
};

Game.prototype.restartPhysics = function()
{
    'use strict';

    this.physics = new Physics();
    this.physics.world.SetContactListener(contactListener);

    var i;

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        actor.body = this.physics.createBox(actor.position[0],
                                            actor.position[1],
                                            actor.scale[0]/2,
                                            actor.scale[1]/2,
                                            actor.type);

        actor.body.SetUserData(actor);
    }
};

Game.prototype.clone = function()
{
    'use strict';

    var clone = new Game();

    clone.scripts = this.scripts;

    var i;

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        var x = clone.addActor(vec3.clone(actor.position),
                               vec3.clone(actor.scale),
                               actor.rotation,
                               vec4.clone(actor.color),
                               actor.type);

        x.actorClass = actor.actorClass;
        x.script     = actor.script;
    }

    var playerIndex = this.actors.indexOf(this.player);
    clone.player = clone.actors[playerIndex];

    return clone;
};
