/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true */
/*global inputManager*/

function ArgumentDesc(name, type)
{
    'use strict';

    this.name = name;
    this.type = type;
}

function Snippet(func, argsDescs)
{
    'use strict';

    this.func = func;
    this.argsDescs = argsDescs;
}

function SnippedInstance(snippet, args)
{
    'use strict';

    this.snippet = snippet;
    this.args    = args;
}

function Script()
{
    'use strict';
    this.conditions = [];
    this.actions    = [];
}

/*function ConditionGroup(name)
{
    'use strict';

    this.name = name;
}

var conditions =
    {

    };*/

var keyPressedSnippet = new Snippet(function(actor, args)
{
     'use strict';

     return inputManager.keyPressed(args.key);
}, null);

var moveSnippet = new Snippet(function(actor, args)
{
    'use strict';
    actor.position[0] += args.distance;
    actor.updateWorld();
}, null);
