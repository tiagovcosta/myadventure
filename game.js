/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true continue: true */
/*global vec2, vec3, vec4,
         Actor, Script, Physics, Box2D, ArrayBuffer, DataView, Uint16Array,
         renderer, directions, Blob, $,
         conditions, actions */

function Collision(actor, direction)
{
    'use strict';

    this.actor     = actor;
    this.direction = direction;
}

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
        if((actorClass === "" || this.collisions[i].actor.actorClass === actorClass) &&
           (direction === directions.Any || direction === this.collisions[i].direction))
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

    this.gravity = -10;
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

    this.physics.world.Step(dt, //frame-rate
                            10,     //velocity iterations
                            10);    //position iterations

    this.physics.world.ClearForces();

    //Update positions

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        if(actor.type !== null)
        {
            actor.position[0] = actor.body.GetPosition().x;
            actor.position[1] = actor.body.GetPosition().y;
            actor.rotation    = actor.body.GetAngle();
        }
        actor.updateWorld();
    }

    if(this.player !== null)
    {
        renderer.setCameraPosition(this.player.position[0],
                                   this.player.position[1],
                                   0);
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

Game.prototype.removeActor = function(actor)
{
    'use strict';

    this.actors.splice(this.actors.indexOf(actor));
};

Game.prototype.newScript = function()
{
    'use strict';

    var x = new Script("script"+this.scripts.length);

    this.scripts.push(x);

    return x;
};

var contactListener = new Box2D.Dynamics.b2ContactListener();

contactListener.BeginContact = function(contact)
{
   'use strict';

    var a = contact.GetFixtureA().GetBody().GetUserData();
    var b = contact.GetFixtureB().GetBody().GetUserData();

    var w_manifold = new Box2D.Collision.b2WorldManifold();
    contact.GetWorldManifold(w_manifold);

    var x = Math.atan2(w_manifold.m_normal.y, w_manifold.m_normal.x);
    x = 180*x/Math.PI;

    var dir1;
    var dir2;

    if(x >= -45 && x <= 45)
    {
        dir1 = directions.Right;
        dir2 = directions.Left;
    } else if(x >= 45 && x <= 135)
    {
        dir1 = directions.Top;
        dir2 = directions.Bottom;
    } else if( (x >= 135 && x <= 180) || (x >= -180 && x <= -135))
    {
        dir1 = directions.Left;
        dir2 = directions.Right;
    } else if(x >= -135 && x <= -45)
    {
        dir1 = directions.Bottom;
        dir2 = directions.Top;
    }

    a.collisions.push(new Collision(b, dir1));
    b.collisions.push(new Collision(a, dir2));
};

contactListener.EndContact = function(contact)
{
   'use strict';

    var a = contact.GetFixtureA().GetBody().GetUserData();
    var b = contact.GetFixtureB().GetBody().GetUserData();

    var w_manifold = new Box2D.Collision.b2WorldManifold();
    contact.GetWorldManifold(w_manifold);

    var x = Math.atan2(w_manifold.m_normal.y, w_manifold.m_normal.x);
    x = 180*x/Math.PI;

    var dir1;
    var dir2;

    if(x >= -45 && x <= 45)
    {
        dir1 = directions.Right;
        dir2 = directions.Left;
    } else if(x >= 45 && x <= 135)
    {
        dir1 = directions.Top;
        dir2 = directions.Bottom;
    } else if( (x >= 135 && x <= 180) || (x >= -180 && x <= -135))
    {
        dir1 = directions.Left;
        dir2 = directions.Right;
    } else if(x >= -135 && x <= -45)
    {
        dir1 = directions.Bottom;
        dir2 = directions.Top;
    }

    var i;

    for(i = 0; i < a.collisions.length; i++)
    {
        if(a.collisions[i].actor === b)
        {
            a.collisions.splice(i);
            break;
        }
    }

    for(i = 0; i < b.collisions.length; i++)
    {
        if(b.collisions[i].actor === a)
        {
            b.collisions.splice(i);
            break;
        }
    }
};

Game.prototype.restartPhysics = function()
{
    'use strict';

    this.physics = new Physics(this.gravity);
    this.physics.world.SetContactListener(contactListener);

    var i;

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        if(actor.type !== null)
        {
            actor.body = this.physics.createBox(actor.position[0],
                                                actor.position[1],
                                                actor.scale[0]/2,
                                                actor.scale[1]/2,
                                                actor.type);

            actor.body.SetAngle(actor.rotation);

            actor.body.SetUserData(actor);
        }
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

        x.name       = actor.name;
        x.actorClass = actor.actorClass;
        x.script     = actor.script;
    }

    if(this.player !== null)
    {
        var playerIndex = this.actors.indexOf(this.player);
        clone.player = clone.actors[playerIndex];
    }

    clone.gravity = this.gravity;

    return clone;
};

function ab2str(view, offset, length)
{
    'use strict';
    //return String.fromCharCode.apply(null, new Uint16Array(buf, offset, length));
    var s = "";

    var i;

    for(i = 0; i < length; i++)
    {
        s += String.fromCharCode(view.getUint16(offset));
        offset += 2;
    }

    return s;
}

function str2ab(str, view, offset)
{
    'use strict';
    var i;
    var strLen;

    for (i = 0, strLen=str.length; i < strLen; i++)
    {
        view.setUint16(offset, str.charCodeAt(i));
        offset += 2;
    }

    return offset;
 }

Game.prototype.save = function()
{
    'use strict';

    var buffer = new ArrayBuffer(10000);

    var view = new DataView(buffer);
    var offset = 0;

    var i;
    var j;
    var k;

    //Write background color
    var str = JSON.stringify(renderer.clearColor);
    view.setUint32(offset, str.length);
    offset += 4;
    offset = str2ab(str, view, offset);

    //WRITE SCRIPTS
    view.setUint32(offset, this.scripts.length);
    offset += 4;

    var snippetIndex;
    var args;

    for(i = 0; i < this.scripts.length; i++)
    {
        view.setUint32(offset, this.scripts[i].name.length);
        offset += 4;
        offset = str2ab(this.scripts[i].name, view, offset);

        var rules = this.scripts[i].rules;

        view.setUint32(offset, rules.length);
        offset += 4;

        for(j = 0; j < rules.length; j++)
        {
            var rule = rules[j];

            view.setUint32(offset, rule.conditions.length);
            offset += 4;

            for(k = 0; k < rule.conditions.length; k++)
            {
                var cond = rule.conditions[k];

                snippetIndex = conditions.indexOf(cond.snippet);

                args = JSON.stringify(cond.args);

                view.setInt32(offset, snippetIndex);
                offset += 4;
                view.setUint32(offset, args.length);
                offset += 4;

                offset = str2ab(args, view, offset);
            }

            view.setUint32(offset, rule.actions.length);
            offset += 4;

            for(k = 0; k < rule.actions.length; k++)
            {
                var action = rule.actions[k];

                snippetIndex = actions.indexOf(action.snippet);

                args = JSON.stringify(action.args);

                view.setInt32(offset, snippetIndex);
                offset += 4;
                view.setUint32(offset, args.length);
                offset += 4;

                offset = str2ab(args, view, offset);
            }
        }
    }

    //WRITE ACTORS
    view.setUint32(offset, this.actors.length);
    offset += 4;

    for(i = 0; i < this.actors.length; i++)
    {
        var actor = this.actors[i];

        str = JSON.stringify(actor.position);
        view.setUint32(offset, str.length);
        offset += 4;
        offset = str2ab(str, view, offset);

        str = JSON.stringify(actor.scale);
        view.setUint32(offset, str.length);
        offset += 4;
        offset = str2ab(str, view, offset);

        view.setFloat32(offset, actor.rotation);
        offset += 4;

        str = JSON.stringify(actor.color);
        view.setUint32(offset, str.length);
        offset += 4;
        offset = str2ab(str, view, offset);

        view.setUint32(offset, actor.name.length);
        offset += 4;
        offset = str2ab(actor.name, view, offset);

        if(actor.type === null)
        {
            view.setInt32(offset, -1);
        } else
        {
            view.setInt32(offset, actor.type);
        }
        offset += 4;

        view.setUint32(offset, actor.actorClass.length);
        offset += 4;
        offset = str2ab(actor.actorClass, view, offset);

        view.setInt32(offset, this.scripts.indexOf(actor.script));
        offset += 4;
    }

    view.setInt32(offset, this.actors.indexOf(this.player));
    offset += 4;

    return buffer;
};

Game.prototype.load = function(file)
{
    'use strict';

    var view = new DataView(file);

    var offset = 0;

    var i;
    var j;
    var k;

    //READ BACKGROUND COLOR
    var len = view.getUint32(offset);
    offset += 4;
    var str = ab2str(view, offset, len);
    offset += len*2;

    var obj = JSON.parse(str);
    renderer.setClearColor(vec4.fromValues(obj[0], obj[1], obj[2], obj[3]));

    //READ SCRIPTS
    var numScripts = view.getUint32(offset);
    offset += 4;

    var snippetIndex;
    var args;
    var argsLength;

    for(i = 0; i < numScripts; i++)
    {
        var script = this.newScript();

        var nameLength = view.getUint32(offset);
        offset += 4;

        script.name = ab2str(view, offset, nameLength);
        offset += nameLength*2;

        var numRules = view.getUint32(offset);
        offset += 4;

        for(j = 0; j < numRules; j++)
        {
            var rule = script.newRule();

            var numConditions = view.getUint32(offset);
            offset += 4;

            for(k = 0; k < numConditions; k++)
            {
                snippetIndex = view.getInt32(offset);
                offset += 4;
                argsLength = view.getUint32(offset);
                offset += 4;

                args = ab2str(view, offset, argsLength);
                offset += argsLength*2;

                var cond = rule.newCondition(conditions[snippetIndex]);
                cond.args = JSON.parse(args);
            }

            var numActions = view.getUint32(offset);
            offset += 4;

            for(k = 0; k < numActions; k++)
            {
                snippetIndex = view.getInt32(offset);
                offset += 4;
                argsLength = view.getUint32(offset);
                offset += 4;

                args = ab2str(view, offset, argsLength);
                offset += argsLength*2;

                var action = rule.newAction(actions[snippetIndex]);
                action.args = JSON.parse(args);
            }
        }
    }

    //WRITE ACTORS
    var numActors = view.getUint32(offset);
    offset += 4;

    for(i = 0; i < numActors; i++)
    {
        len = view.getUint32(offset);
        offset += 4;
        str = ab2str(view, offset, len);
        offset += len*2;

        obj = JSON.parse(str);
        var pos = vec3.fromValues(obj[0], obj[1], obj[2]);

        len = view.getUint32(offset);
        offset += 4;
        str = ab2str(view, offset, len);
        offset += len*2;

        obj = JSON.parse(str);
        var scale = vec3.fromValues(obj[0], obj[1], obj[2]);

        var rotation = view.getFloat32(offset);
        offset += 4;

        len = view.getUint32(offset);
        offset += 4;
        str = ab2str(view, offset, len);
        offset += len*2;

        obj = JSON.parse(str);
        var color = vec4.fromValues(obj[0], obj[1], obj[2], obj[3]);

        len = view.getUint32(offset);
        offset += 4;
        var name = ab2str(view, offset, len);
        offset += len*2;

        var type = view.getInt32(offset);
        offset += 4;

        if(type === -1)
        {
            type = null;
        }

        len = view.getUint32(offset);
        offset += 4;
        var actorClass = ab2str(view, offset, len);
        offset += len*2;

        var scriptIndex = view.getInt32(offset);
        offset += 4;

        var actor = this.addActor(pos, scale, rotation, color, type);
        actor.name = name;
        actor.actorClass = actorClass;

        if(scriptIndex >= 0)
        {
            actor.script = this.scripts[scriptIndex];
        }
    }

    var playerIndex = view.getInt32(offset);
    offset += 4;

    if(playerIndex >= 0)
    {
        this.player = this.actors[playerIndex];
    }
};
