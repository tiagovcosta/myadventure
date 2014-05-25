/*jslint devel: true, bitwise: true, continue: true, newcap: true, nomen: true, plusplus: true, vars: true, white: true, indent: 4, maxerr: 50 */
/*global Box2D */

var b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Fixture = Box2D.Dynamics.b2Fixture,
    b2World = Box2D.Dynamics.b2World,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw;


function Physics()
{
    'use strict';

    this.world = new b2World(new b2Vec2(0, -10), //gravity
                             true);             //allow sleep
}

Physics.prototype.createBox = function(x, y, width, height, type)
{
    'use strict';

    var fixDef = new b2FixtureDef();
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    var bodyDef = new b2BodyDef();

    bodyDef.type = type;
    bodyDef.position.x = x;
    bodyDef.position.y = y;
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(width, height);
    return this.world.CreateBody(bodyDef).CreateFixture(fixDef).GetBody();
};

Physics.prototype.createCircle = function(x, y, radius, type)
{
    'use strict';

    var fixDef = new b2FixtureDef();
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    var bodyDef = new b2BodyDef();

    bodyDef.type = type;
    bodyDef.position.x = x;
    bodyDef.position.y = y;
    fixDef.shape = new b2CircleShape(radius);
    return this.world.CreateBody(bodyDef).CreateFixture(fixDef).GetBody();
};
