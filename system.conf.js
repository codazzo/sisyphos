System.config({
    baseURL: '',
    transpiler: 'babel',
    paths: {
        'babel': 'node_modules/babel-core/browser.js',
        'chai': 'node_modules/chai/chai.js',
        'sinon': 'node_modules/sinon/pkg/sinon.js',
        'sisyphos': 'index.js',
        'systemjs': 'node_modules/systemjs/dist/system.src.js',
        'system-polyfills': 'node_modules/systemjs/dist/system-polyfills.js',
        'es6-module-loader': 'node_modules/es6-module-loader/dist/es6-module-loader.js',
        'phantomjs-polyfill': 'node_modules/phantomjs-polyfill/bind-polyfill.js',
        'mocha': 'node_modules/mocha/mocha.js'
    }
});
