var Hash = require('traverse/hash');
var EventEmitter = require('events').EventEmitter;

module.exports = function Chainsaw (init, builder) {
    var saw = new EventEmitter;
    var actions = saw.actions = [];
    
    saw.next = function (vars) {
        var action = actions.shift();
        if (action) handlers[action.name]
            .apply(handlers, [vars].concat(action.args));
        else saw.emit('end');
    };
    
    var chain = saw.chain = {};
    var handlers = saw.handlers = {};
    builder.call(handlers, chain, saw);
    
    Hash(handlers).forEach(function (h, name) {
        chain[name] = function () {
            actions.push({
                name : name,
                args : [].slice.call(arguments),
            });
            return chain;
        };
    });
    
    process.nextTick(function () {
        saw.emit('begin');
        saw.next(init);
    });
    
    return chain;
};
