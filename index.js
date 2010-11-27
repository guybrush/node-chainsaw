var Hash = require('traverse/hash');
var EventEmitter = require('events').EventEmitter;

module.exports = Chainsaw;
function Chainsaw (builder) {
    var saw = Chainsaw.saw(builder, {});
    var r = builder.call(saw.handlers, saw);
    if (r !== undefined) saw.handlers = r;
    return saw.chain();
};

Chainsaw.saw = function (builder, handlers) {
    var saw = new EventEmitter;
    saw.handlers = handlers;
    saw.actions = [];
    
    saw.chain = function () {
        var ch = Hash.map(saw.handlers, function (h, name) {
            return function () {
                saw.actions.push({
                    name : name,
                    args : [].slice.call(arguments),
                });
                return ch;
            };
        });
        
        process.nextTick(function () {
            saw.emit('begin');
            saw.next();
        });
        
        return ch;
    };
    
    saw.next = function () {
        var action = saw.actions.shift();
        if (!action) {
            saw.emit('end');
        }
        else {
            saw.handlers[action.name].apply(saw.handlers, action.args);
        }
    };
    
    saw.nest = function (cb) {
        var s = Chainsaw.saw(builder, {});
        s.on('end', saw.next);
        var r = builder.call(s.handlers, s);
        if (r !== undefined) s.handlers = r;
        
        var args = [].slice.call(arguments, 1);
        cb.apply(s.chain(), args);
    };
    
    return saw;
}; 
