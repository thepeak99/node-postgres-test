/*jslint node: true regexp: true nomen: true */
'use strict';

var AssertionError = require('assertion-error');
var _ = require('lodash');

function Query(args) {
    var s;
    
    if (args.length === 0) {
        this.regExp = /.*/;
    } else {
        if (typeof (args[0]) === 'string') {
            s = args[0].replace(/\$/g, '\\$').replace(/\*/g, '\\*');
            this.regExp = new RegExp('^' + s + '$'); //Exact match        
        } else if (args[0] instanceof RegExp) {
            this.regExp = args[0];
        }
        
        if (args.length === 2) {
            this.params = args[1];
        }
    }
}

Query.prototype.run = function (args) {
    var query, params, cb;
    
    query = args[0];
    if (args.length === 2) {
        cb = args[1];
    } else {
        params = args[1];
        cb = args[2];
    }

    if (query.match(this.regExp) === null) {
        throw new AssertionError('Unexpected query: ' + query);
    }

    if (!_.isEqual(this.params, params)) {
        throw new AssertionError('Unexpected params: ' + params);
    }
    
    if (this.retVal !== undefined) {
        if (this.retVal.err !== null) {
            cb(this.retVal.err, null);
        } else {
            cb(null, {
                rows: this.retVal.data
            });
        }
    } else {
        cb(null, {rows: []});
    }
};

function PgMock() {
    this.queue = [];
}

PgMock.prototype.connect = function (db, cb) {
    var client, done, self;
        
    self = this;
    this.doneCalled = false;
    
    client = {
        query: function (query) {
            var retVal;
            
            if (self.queue.length === 0) {
                throw new AssertionError('Unexpected query: ' + query);
            }
            
            self.queue.shift().run(arguments);
        }
    };
    
    done = function () {
        self.doneCalled = true;
    };
    
    cb(null, client, done);
};

PgMock.prototype.check = function () {
    if (!this.doneCalled) {
        throw new AssertionError('Done was not called');
    }
    
    if (this.queue.length !== 0) {
        throw new AssertionError('Not all queries were executed');
    }
};

PgMock.prototype.expect = function () {
    var match = new Query(arguments);
    this.queue.push(match);
    
    return {
        returning: function (err, data) {
            match.retVal = {
                err: err,
                data: data
            };
        }
    };
};

PgMock.prototype.reset = function () {
    this.queue = [];
};

module.exports = new PgMock();