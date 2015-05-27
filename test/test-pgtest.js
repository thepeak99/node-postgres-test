/*jslint node: true nomen: true*/
/*global describe, it, before, beforeEach*/
'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var pgtest = require('../lib/pgtest');

describe('pgtest', function () {
    beforeEach(function () {
        pgtest.reset();
    });
    
    describe('connect', function () {
        it('should call its callback with a client and a done function', function () {
            pgtest.connect('foo', function (err, client, done) {
                expect(err).to.be.equal(null);
                expect(client).to.be.not.equal(null);
                expect(done).to.be.not.equal(null);
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
            });
        });

        it('should reject queries in different order', function () {
            pgtest.expect('SELECT * FROM vegetables');
            pgtest.expect('SELECT * FROM fruits');
            
            function test() {
                pgtest.connect('foo', function (err, client, done) {
                    client.query('SELECT * FROM fruits', function () {});
                    client.query('SELECT * FROM vegetables', function () {});
                });
            }
            expect(test).to.Throw(/Unexpected query/);
        });
    });
    
    describe('returning', function () {
        it('should make the query return data', function () {
            var rows = [['potatoes', '1kg'], ['tomatoes', '500g']];
            pgtest.expect('SELECT * FROM vegetables').returning(null, rows);
            
            pgtest.connect('foo', function (err, client, done) {
                client.query('SELECT * FROM vegetables', function (err, data) {
                    expect(data.rows).to.be.deep.equal(rows);
                });
            });
        });
    });
    
    describe('check', function () {
        it('should fail if done() was not called', function () {
            pgtest.connect('foo', function (err, client, done) { });
            function test() {
                pgtest.check();
            }
            expect(test).to.Throw('Done was not called');
        });
        
        it('should fail if not all queries were run', function () {
            pgtest.expect('SELECT * FROM vegetables');
            pgtest.connect('foo', function (err, client, done) {
                done();
            });
            function test() {
                pgtest.check();
            }
            expect(test).to.Throw('Not all queries were executed');
        });
    });
});

/*
var spy1, spy2;
                
                spy1 = sinon.spy();
                spy2 = sinon.spy();
                
                expect(spy1.calledOne).to.be.equal(true);
                expect(spy2.calledOne).to.be.equal(true);
*/