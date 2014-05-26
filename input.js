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

    this.width            = 20;
    this.height           = 15;

    this.scaleX           = this.width/canvas.width;
    this.scaleY           = this.height/canvas.height;

    this.offsetX          = -this.width/2;
    this.offsetY          = -this.height/2;

    this.canvas.onmousedown = function(event)
    {
        if(event.which === 1)
        {
            self.mouseLeftDown = true;
        } else if(event.which === 3)
        {
            self.mouseRightDown = true;
        }

        //console.log(self.mouseX + "," + self.mouseY);
    };

    this.canvas.onmouseup = function(event)
    {
        if(event.which === 1)
        {
            self.mouseLeftDown = false;
        } else if(event.which === 3)
        {
            self.mouseRightDown = false;
        }
    };

    this.canvas.onmousemove = function(event)
    {
        var rect = self.canvas.getBoundingClientRect();

        var x = event.clientX - rect.left;
        var y = self.canvas.height - event.clientY + rect.top;

        /*self.mouseX = event.clientX - rect.left;
        self.mouseY = self.canvas.height - event.clientY + rect.top;*/

        self.mouseX = x*self.scaleX + self.offsetX;
        self.mouseY = y*self.scaleY + self.offsetY;
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

InputManager.prototype.setViewDistance = function(distance)
{
    'use strict';

    this.width   = distance;
    this.height  = distance * this.canvas.height/this.canvas.width;

    this.scaleX  = this.width/this.canvas.width;
    this.scaleY  = this.height/this.canvas.height;

    this.offsetX = -this.width/2;
    this.offsetY = -this.height/2;
};
