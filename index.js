var Hash = require('traverse/hash');
var EventEmitter = require('events').EventEmitter;

module.exports = Chainsaw;
function Chainsaw (builder) {
    var saw = Chainsaw.saw({});
    builder.call(saw.handlers, saw);
    
    process.nextTick(function () {
        saw.emit('begin');
        saw.next();
    });
    
    return saw.chain();
};

Chainsaw.saw = function (handlers) {
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
    
    return saw;
}; 
