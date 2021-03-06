var Traverse = require('traverse');
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
    saw.step = 0;
    
    saw.chain = function () {
        var ch = Traverse(saw.handlers).map(function (node) {
            if (this.isRoot) return node;
            var ps = this.path;
            
            if (typeof node === 'function') {
                this.update(function () {
                    saw.actions.push({
                        path : ps,
                        args : [].slice.call(arguments),
                    });
                    return ch;
                });
            }
        });
        
        process.nextTick(function () {
            saw.emit('begin');
            saw.next();
        });
        
        return ch;
    };
    
    saw.next = function () {
        var action = saw.actions[saw.step];
        saw.step ++;
        
        if (!action) {
            saw.emit('end');
        }
        else if (!action.trap) {
            var node = saw.handlers;
            action.path.forEach(function (key) { node = node[key] });
            node.apply(saw.handlers, action.args);
        }
    };
    
    saw.nest = function (cb) {
        var args = [].slice.call(arguments, 1);
        var autonext = true;
        
        if (typeof cb === 'boolean') {
            var autonext = cb;
            cb = args.shift();
        }
        
        var s = Chainsaw.saw(builder, {});
        var r = builder.call(s.handlers, s);
        
        if (r !== undefined) s.handlers = r;
        cb.apply(s.chain(), args);
        if (autonext !== false) s.on('end', saw.next);
    };
    
    saw.trap = function (name, cb) {
        var ps = Array.isArray(name) ? name : [name];
        saw.actions.push({
            path : ps,
            step : saw.step,
            cb : cb,
            trap : true,
        });
    };
    
    saw.down = function (name) {
        var ps = (Array.isArray(name) ? name : [name]).join('/');
        var i = saw.actions.slice(saw.step).map(function (x) {
            if (x.trap && x.step <= saw.step) return false;
            return x.path.join('/') == ps;
        }).indexOf(true);
        
        if (i >= 0) saw.step += i;
        else saw.step = saw.actions.length;
        
        var act = saw.actions[saw.step - 1];
        if (act && act.trap) {
            // It's a trap!
            saw.step = act.step;
            act.cb();
        }
        else saw.next();
    };
    
    saw.jump = function (step) {
        saw.step = step;
        saw.next();
    };
    
    return saw;
}; 
