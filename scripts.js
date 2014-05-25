/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true */
/*global inputManager, SpecialKeys, game */

function ArgumentDesc(name, type, deft, selectOptions)
{
    'use strict';

    this.name          = name;
    this.type          = type;
    this.deft          = deft;
    this.selectOptions = selectOptions;
}

function Snippet(name, func, argsDescs)
{
    'use strict';

    this.name      = name;
    this.func      = func;
    this.argsDescs = argsDescs;
}

function SnippedInstance(snippet, args)
{
    'use strict';

    this.snippet = snippet;
    this.args    = args;
}

function Rule()
{
    'use strict';
    this.conditions = [];
    this.actions    = [];
}

Rule.prototype.newCondition = function(condition)
{
    'use strict';

    var args = {};

    var i;

    for(i = 0; i < condition.argsDescs.length; i++)
    {
        args[condition.argsDescs[i].name] = condition.argsDescs[i].deft;
    }

    args.not = false;

    this.conditions.push(new SnippedInstance(condition, args));
};

Rule.prototype.newAction = function(action)
{
    'use strict';

    var args = {};

    var i;

    for(i = 0; i < action.argsDescs.length; i++)
    {
        args[action.argsDescs[i].name] = action.argsDescs[i].deft;
    }

    this.actions.push(new SnippedInstance(action, args));
};

function Script(name)
{
    'use strict';
    this.name       = name;
    this.rules      = [];
}

Script.prototype.newRule = function()
{
    'use strict';
    this.rules.push(new Rule());
};

/////////////////////////////////////////////

var keys =
    {
        'A':'A',
        'W':'W',
        'S':'S',
        'D':'D',
        'Left':SpecialKeys.LEFT,
        'Right':SpecialKeys.RIGHT,
        'Up':SpecialKeys.UP,
        'Down':SpecialKeys.DOWN
    };

var directions =
    {
        'Any':null,
        'Top':'top',
        'Bottom':'bottom',
        'Left':'left',
        'Right':'right'
    };

//CONDITIONS

var keyPressedSnippet = new Snippet("Key Pressed", function(actor, args)
{
     'use strict';

     return inputManager.keyPressed(args.key);
}, [new ArgumentDesc("key", "select", SpecialKeys.RIGHT, keys)]);

var collisionSnippet = new Snippet("Collision", function(actor, args)
{
     'use strict';

     return game.checkCollisions(actor, null, args.direction);
}, [new ArgumentDesc("direction", "select", null, directions)]);

//ACTIONS

var moveSnippet = new Snippet("Move", function(actor, args)
{
    'use strict';
    actor.position[0] += args.distanceX;
    actor.position[1] += args.distanceY;
    actor.updateWorld();
}, [new ArgumentDesc("distanceX", "number", 0),
    new ArgumentDesc("distanceY", "number", 0)]);

var accelarateSnippet = new Snippet("Accelarate", function(actor, args)
{
    'use strict';
    actor.accelarate(args.accelarateX,args.accelarateY);
}, [new ArgumentDesc("accelarateX", "number", 0),
    new ArgumentDesc("accelarateY", "number", 0)]);

var velocitySnippet = new Snippet("Set velocity", function(actor, args)
{
    'use strict';
    actor.velocity[0] = args.velocityX;
    actor.velocity[1] = args.velocityY;
}, [new ArgumentDesc("velocityX", "number", 0),
    new ArgumentDesc("velocityY", "number", 0)]);

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

var conditions =
    [
        keyPressedSnippet,
        collisionSnippet
    ];

var actions =
    [
        moveSnippet,
        accelarateSnippet,
        velocitySnippet
    ];
