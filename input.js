/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true */
/*global */

var SpecialKeys =
    {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    };

function InputManager(canvas)
{
    'use strict';

    var self              = this;
    this.canvas           = canvas;

    this.mouseX           = null;
    this.mouseY           = null;

    this.mouseLeftDown    = false;
    this.mouseRightDown   = false;

    this.keyboard         = {};

    this.canvas.onmousedown = function(event)
    {
        if(event.which == 1)
        {
            self.mouseLeftDown = true;
        } else if(event.which == 3)
        {
            self.mouseRightDown = true;
        }
    };

    this.canvas.onmouseup = function(event)
    {
        if(event.which == 1)
        {
            self.mouseLeftDown = false;
        } else if(event.which == 3)
        {
            self.mouseRightDown = false;
        }
    };

    this.canvas.onmousemove = function(event)
    {
        var rect = self.canvas.getBoundingClientRect();

        self.mouseX = event.clientX - rect.left;
        self.mouseY = self.canvas.height - event.clientY + rect.top;
    };

    this.canvas.onmouseout = function(event)
    {
        self.mouseDown = false;
    };

    this.canvas.onkeydown = function(event)
    {
        self.keyboard[event.keyCode] = true;
    };

    this.canvas.onkeyup = function(event)
    {
        self.keyboard[event.keyCode] = false;
    };

    this.canvas.oncontextmenu = function(e)
    {
            //draw here
            e.preventDefault();
    };
}

InputManager.prototype.keyPressed = function(key)
{
    'use strict';

    if(typeof key === "number")
    {
        return this.keyboard[key];
    } else
    {
        return this.keyboard[key.charCodeAt()];
    }
};
