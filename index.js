var Hash = require('traverse/hash');
var EventEmitter = require('events').EventEmitter;

module.exports = function Chainsaw (init, builder) {
    var chain = {};
    
    var saw = new EventEmitter;
    saw.actions = [];
    
    saw.next = function (vars) {
        var action = actions.shift();
        if (action) handlers[action.name]
            .apply(handlers, [vars].concat(action.args));
        else saw.emit('end');
    };
    
    var chain = saw.chain = Hash.map(handlers, function (name, h) {
        return function () {
            saw.actions.push({
                name : name,
                args : [].slice.call(arguments),
            });
        };
    });
    
    var handlers = saw.handlers = {};
    builder.call(handlers, chain, saw);
    
    process.nextTick(function () {
        saw.emit('begin');
        saw.next(init);
    });
};
