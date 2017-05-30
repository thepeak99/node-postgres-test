/*jslint node: true regexp: true nomen: true */
'use strict';

var AssertionError = require('assertion-error');
var _ = require('lodash');
var escapeStringRegexp = require('escape-string-regexp');

function Query(args) {
    var s;
    
    if (args.length === 0) {
        this.regExp = /.*/;
    } else {
        if (typeof (args[0]) === 'string') {
            s = escapeStringRegexp(args[0]);
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
    
    if (this.params !== undefined && params === undefined) {
        throw new AssertionError('Missing expected params');
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
    var self = this;
    
    self.expectQueue = [];
    self.queryQueue = [];

    self.connect = function (db, cb) {
        var client, done;

        self.doneCalled = false;
        self.checkCalled = false;

        client = {
            query: function (query) {
                self.queryQueue.push(arguments);
            }
        };

        done = function () {
            self.doneCalled = true;
        };

        cb(null, client, done);
    };

    self.check = function () {
        self.checkCalled = true;
        self.queryQueue.forEach(function (query) {
            if (self.expectQueue.length === 0) {
                throw new AssertionError('Unexpected query: ' + query[0]);
            }

            self.expectQueue.shift().run(query);
        });

        if (!self.doneCalled) {
            throw new AssertionError('Done was not called');
        }

        if (self.expectQueue.length !== 0) {
            throw new AssertionError('Not all queries were executed');
        }
    };

    self.expect = function () {
        var match = new Query(arguments);
        self.expectQueue.push(match);

        return {
            returning: function (err, data) {
                match.retVal = {
                    err: err,
                    data: data
                };
            }
        };
    };

    self.reset = function (checkCheck) {
        self.expectQueue = [];
        self.queryQueue = [];
        
        if (checkCheck && !self.checkCalled) {
            throw new AssertionError('Check not called');
        }
    };
}

module.exports = new PgMock();
