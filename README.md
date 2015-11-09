# sisyphos

A utility to stub modules imported with the [System.js](https://github.com/systemjs/systemjs) module loader.

## Installation

```bash
npm install --save-dev sisyphos
```

## Usage

Requiring a module with stubbed dependencies happens in two phases:

1. Declare what dependencies will be stubbed with what
2. Import and use the module using the stubs

Modules can have one default export or one (or more) named exports. Accordingly, there are two ways to stub dependencies:

### Default exports

```js
sisyphos.stub({
    'path/to/depA': fakeA, //depA's default export
    'path/to/depB': fakeB  //depB's default export
});

sisyphos.require('module/that/uses/deps').then(function(mod) {
    // mod uses the stubbed dependencies
});
```

### Named exports

```js
sisyphos.stub('path/to/depWithMultipleExports', {
    exportA: fakeA,
    exportB: fakeB
});

sisyphos.require('module/that/uses/depWithMultipleExports').then(function(mod) {
    // mod uses the stubbed dependencies
});
```

### Resetting the stubs

Once you are done you can reset the dependencies to their original implementations (whether they were in the registry at the time they were stubbed or not).

```js
sisyphos.reset(); //returns a promise
```

### Writing unit tests

Sisyphos's promise-based API makes for easy setup and tear-down in unit tests. If you're using [Mocha](https://mochajs.org):
```js
beforeEach(function() {
    sisyphos.stub({
        'some/dep': 'some_default_exported_string'
    });
    return sisyphos.require('path/to/module');
});

afterEach(function() {
    return sisyphos.reset();
});
```
If your test framework does not support returning promises in tests, you can attach a `done` callback to the promises returned by `require` / `reset`:
```js
beforeEach(function(done) {
    // [declare stubs here]
    return sisyphos.require('path/to/module').then(done);
});

afterEach(function(done) {
    return sisyphos.reset().then(done);
});
```

Have a look at the [tests file](tests.html) to see how sisyphos can be used with Mocha.

## Running the unit tests
If you want to run the sisyphos tests suite, clone it locally and run:

```bash
npm install
npm test
```

### Acknowledgements

Special thanks to [@mroderick](https://github.com/mroderick) for creating [bogus](https://github.com/mroderick/bogus), a utility to stub dependencies in Require.js projects.
