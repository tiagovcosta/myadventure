/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, white: true bitwise:true */
/*global */

var MouseEvents =
    {
        DOWN : 0,
        UP   : 1,
        OUT  : 2
    };

function MouseManager(canvas)
{
    'use strict';

    var self              = this;
    this.canvas           = canvas;
    this.mouseEventsQueue = [];

    this.mouseX           = null;
    this.mouseY           = null;

    this.canvas.onmousedown = function(event)
    {
        self.mouseEventsQueue.push(MouseEvents.DOWN);
    };

    this.canvas.onmouseup = function(event)
    {
        self.mouseEventsQueue.push(MouseEvents.UP);
    };

    this.canvas.onmousemove = function(event)
    {
        //self.mouseEventsQueue.push(MouseEvents.OVER);

        var rect = self.canvas.getBoundingClientRect();

        self.mouseX = event.clientX - rect.left;
        self.mouseY = self.canvas.height - event.clientY + rect.top;
    };

    this.canvas.onmouseout = function(event)
    {
        self.mouseEventsQueue.push(MouseEvents.OUT);
    };
}
