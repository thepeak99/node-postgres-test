#node-postgres-test

[![Build Status](https://travis-ci.org/thepeak99/node-postgres-test.svg?branch=master)](https://travis-ci.org/thepeak99/node-postgres-test)

node-postgres-test is a module that provides easy unit testing for the popular [node-postgres](https://github.com/brianc/node-postgres).

## Install
    npm install pgtest

## Example
```javascript

pgtest = require('pgtest');

pgtest.expect('SELECT * FROM vegetables').returning(null, [
    [ 'potatoes', '1kg' ],
    [ 'tomatoes', '500g' ]
]);

pgtest.connect('foo', function (err, client, done) {
    client.query('SELECT * FROM vegetables', function (err, data) {
        console.log(data);
        done();
    });
});

pgtest.check(); //No errors
```

## Documentation
node-postgres-test is a drop in replacement for node-postgres, intended to be used in unit testing.

Before running your tests, you tell node-postgres-test what are the queries you are expecting and what should they return. After that, you will call ```pgtest.check()```, to make sure everything was called in the order and with the parameters expected.

You will most likely want to use node-postgres-test with a tool like [rewire](https://github.com/jhnns/rewire) to inject node-postgres-test to the module you are testing. 

### pgtest.connect(db, callback):
This is the mock function for ```pg.connect```. It will call the callback with ```(null, client, done)```. Do your queries using ```client```, when you finish using the client, ```done()``` must be called.

### pgtest.expect(query, [params]).[returning(err, data)]:
Expect the that query to be sent to pgtest. The query can be a string or a regular expression. If it is a string, the query and the expected query must match exactly. If it is a regular expression, the query must match that expression.

Params is an optional parameter that contains the query's parameters, useful for testing queries with parameters.

These queries will return, by default, no error and no data (that is, the callback for the query will be called as ```cb(null, null)```.

With ```returning()``` you can customize the return value of the query. The first parameter is the error value, that will be sent directly to the callback. The second parameter is the data returned to the client, it has to be a row list, and it will be sent to the callback as ```{rows: data}```.

### pgtest.check()
Make sure all expected queries were run and that ```done()``` was properly called after finishing.

### pgtest.reset()
Reset the module internal data structures, it is good practice to do that before every test, to make sure other tests do not interfere with the current one.

## Comments, suggestions?
Yes, please! If you would like something to be added/fixed/etc, feel free to open an issue (or even better, a pull request :).
