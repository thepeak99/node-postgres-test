/*jslint node: true nomen: true*/
/*global describe, it, before, beforeEach, afterEach*/
'use strict';

var expect = require('chai').expect;
var async = require('async');

var pgtest = require('../lib/pgtest');

describe('pgtest', function () {
    afterEach(function () {
        pgtest.reset(true);
    });
    
    describe('Docs', function () {
        it('should run the example in README', function () {
            pgtest.expect('SELECT * FROM vegetables').returning(null, [
                [ 'potatoes', '1kg' ],
                [ 'tomatoes', '500g' ]
            ]);

            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables', function (err, data) {
                    expect(data).to.be.deep.equal({ rows: [ [ 'potatoes', '1kg' ], [ 'tomatoes', '500g' ] ] });
                    done();
                });
            });

            pgtest.check(); //No errors
        });
    });
    
    describe('connect', function () {
        it('should call its callback with a client and a done function', function (testDone) {
            pgtest.connect('foo', function (err, client, done) {
                expect(err).to.be.equal(null);
                expect(client).to.be.not.equal(null);
                expect(done).to.be.not.equal(null);
                
                done();
                pgtest.check();
                testDone();
            });
        });
    });
    
    describe('expect', function () {
        it('should accept queries in the same order', function () {
            pgtest.expect('SELECT * FROM vegetables');
            pgtest.expect('SELECT * FROM fruits');
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables', function () {});
                client.query('SELECT * FROM fruits', function () {});
                done();
            });
            
            pgtest.check();
        });

        it('should reject queries in different order', function () {
            pgtest.expect('SELECT * FROM vegetables');
            pgtest.expect('SELECT * FROM fruits');
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM fruits', function () {});
                client.query('SELECT * FROM vegetables', function () {});
            });
            
            expect(pgtest.check).to.Throw(/Unexpected query/);
        });
        
        it('should reject queries with unexpected parameters', function () {
            pgtest.expect('SELECT * FROM vegetables');
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables', ['potato'], function () {});
            });
            
            expect(pgtest.check).to.Throw('Unexpected params: potato');
        });
        
        it('should reject queries that do not contain requested params', function () {
            pgtest.expect('SELECT * FROM vegetables WHERE name = $1', ['potato']);
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables WHERE name = $1', function () {});
                done();
            });
            
            expect(pgtest.check).to.Throw('Missing expected params');
        });
        
        it('should accept expected queries with params', function () {
            pgtest.expect('SELECT * FROM vegetables WHERE name = $1', ['potato']);
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables WHERE name = $1', ['potato'], function () { });
                done();
            });
            
            pgtest.check();
        });

        it('should escape parenthesis properly', function () {
            pgtest.expect("INSERT INTO vegetables(id, name) VALUES ($1, $2)", ['1', 'potato']);
            pgtest.connect('foo', function (err, client, done) {
                client.query('INSERT INTO vegetables(id, name) VALUES ($1, $2)', ['1', 'potato'], function () { });
                done();
            });
            pgtest.check();
        });
    });
    
    describe('returning', function () {
        it('should let the query return data', function () {
            var rows = [['potatoes', '1kg'], ['tomatoes', '500g']];
            pgtest.expect('SELECT * FROM vegetables').returning(null, rows);
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables', function (err, data) {
                    expect(err).to.be.equal(null);
                    expect(data.rows).to.be.deep.equal(rows);
                });
                done();
            });
            
            pgtest.check();
        });
        
        it('should let the query return errors', function () {
            pgtest.expect('SELECT * FROM vegetables').returning('error');
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables', function (err, data) {
                    expect(err).to.be.equal('error');
                    expect(data).to.be.deep.equal(null);
                });
                done();
            });
            pgtest.check();
        });

        it('should work with async properly', function () {
            pgtest.expect('SELECT * FROM vegetables WHERE name = $1', ['potato']).returning('potato err', null);
            pgtest.expect('SELECT * FROM fruits WHERE name = $1', ['banana']).returning(null, []);
            
            pgtest.connect('foo', function (err, client, done) {
                async.parallel({
                    first: function (cb) {
                        client.query('SELECT * FROM vegetables WHERE name = $1', ['potato'], cb);
                    },
                    second: function (cb) {
                        client.query('SELECT * FROM fruits WHERE name = $1', ['banana'], cb);
                    }
                }, function (err) {
                    done();
                });
            });
            
            pgtest.check();
        });

    });
    
    describe('check', function () {
        it('should fail if done() was not called', function () {
            pgtest.connect('foo', function (err, client, done) { });
            expect(pgtest.check).to.Throw('Done was not called');
        });
        
        it('should fail if not all queries were run', function () {
            pgtest.expect('SELECT * FROM vegetables');
            pgtest.connect('foo', function (err, client, done) {
                done();
            });
            expect(pgtest.check).to.Throw('Not all queries were executed');
        });
    });
    
    describe('client', function () {
        it('should call callback after a query', function () {
            var calls = 0;
            pgtest.expect('SELECT * FROM vegetables').returning('error');
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables', function () {
                    calls += 1;
                });
                done();
            });
            
            pgtest.check();

            expect(calls).to.be.equal(1);
        });
    });
});
