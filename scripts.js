/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true */
/*global inputManager*/

function ArgumentDesc(name, type, deft)
{
    'use strict';

    this.name = name;
    this.type = type;
    this.deft = deft;
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

//CONDITIONS

var keyPressedSnippet = new Snippet("Key Pressed", function(actor, args)
{
     'use strict';

     return inputManager.keyPressed(args.key);
}, [new ArgumentDesc("key", "char", 'B')]);

//ACTIONS

var moveSnippet = new Snippet("Move", function(actor, args)
{
    'use strict';
    actor.position[0] += args.distanceX;
    actor.position[1] += args.distanceY;
    actor.updateWorld();
}, [new ArgumentDesc("distanceX", "number", 10),
    new ArgumentDesc("distanceY", "number", 5)]);

var conditions =
    {
        keyPressedSnippet : keyPressedSnippet
    };

var actions =
    {
        moveSnippet : moveSnippet
    };
