var Chainsaw = require('chainsaw');

exports.getset = function (assert) {
    var to = setTimeout(function () {
        assert.fail('builder never fired');
    }, 50);
    
    var ch = Chainsaw(0, function (chain, saw) {
        clearInterval(to);
        
        this.get = function (n, cb) {
            cb(n);
            saw.next(n);
        };
        
        this.set = function (n, m) {
            saw.next(m);
        };
        
        var ti = setTimeout(function () {
            assert.fail('end event not emitted');
        }, 50);
        
        saw.on('end', function () {
            clearTimeout(ti);
            assert.equal(times, 3);
        });
    });
    
    var times = 0;
    ch
        .get(function (x) {
            assert.equal(x, 0);
            times ++;
        })
        .set(10)
        .get(function (x) {
            assert.equal(x, 10);
            times ++;
        })
        .set(20)
        .get(function (x) {
            assert.equal(x, 20);
            times ++;
        })
    ;
};
