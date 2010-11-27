var Hash = require('traverse/hash');
var EventEmitter = require('events').EventEmitter;

module.exports = Chainsaw;
function Chainsaw (builder) {
    var saw = Chainsaw.saw(builder, {});
    builder.call(saw.handlers, saw);
    return saw.chain();
};

Chainsaw.saw = function (builder, handlers) {
    var saw = new EventEmitter;
    var actions = saw.actions = [];
    saw.handlers = handlers;
    
    saw.chain = function () {
        var ch = Hash.map(handlers, function (h, name) {
            return function () {
                actions.push({
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
        var action = actions.shift();
        if (!action) {
            saw.emit('end');
        }
        else {
            handlers[action.name].apply(handlers, action.args);
        }
    };
    
    saw.nest = function (cb) {
        var s = Chainsaw.saw(builder, {});
        s.on('end', saw.next);
        builder.call(s.handlers, s);
        var ch = s.chain();
        
        var args = [].slice.call(arguments, 1);
        cb.apply(ch, args);
    };
    
    return saw;
}; 
