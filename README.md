# sisyphos

A utility to stub modules imported with the [System.js](https://github.com/systemjs/systemjs) module loader.

## Installation

```bash
npm install --save-dev sisyphos
```

## Usage

Requiring a module with stubbed dependencies happens in three phases:

1. Declare what dependencies will be stubbed with what
2. Import and use the module using the stubs
3. Reset the stubs when you're done

### 1. Stubbing dependencies
In the example below, `depA` and `depB` have a single export. This is the case for all AMD and CommonJS modules, and for ES2015 modules which use `export default`. Dependencies with multiple named exports are stubbed by providing a value for each export.

```js
sisyphos.stub({
    'path/to/depA': 'some value',
    'path/to/depB': {
        someProperty: 'someValue'
    },
    'path/to/depWithMultipleNamedExports': {
        exportA: 'valueA',
        exportB: 'valueB'
    }
});
```

### 2. Importing the module with stubs

```js
sisyphos.require('module/that/uses/deps').then(function(mod) {
    // mod uses the stubbed dependencies
});
```

### 3. Resetting the stubs

Once you are done you can reset the dependencies to their original implementations (whether they were in the registry at the time they were stubbed or not).

```js
sisyphos.reset(); //returns a promise
```

## Writing unit tests

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

## Contributing
If you want to run the sisyphos tests suite, clone it locally and run:

```bash
npm install
npm test
```

## License

[MIT](LICENSE)

### Acknowledgements

Special thanks to [@mroderick](https://github.com/mroderick) for creating [bogus](https://github.com/mroderick/bogus), a utility to stub dependencies in Require.js projects.
