/* global System */

var stubbed = [],
    require = requireWithStubs,
    caches = {}, //this could be a WeakMap
    originals = {};

function isObject(value){
    return Object.prototype.toString.call(value) === '[object Object]';
}

function preserveIfDefined(normalizedName){
    var isDefined = System.has(normalizedName);

    return isDefined ? preserveDefinition(normalizedName) : Promise.resolve();
}

function preserveDefinition(normalizedName){
    return System.import(normalizedName).then(function(originalModule){
        originals[normalizedName] = System.get(normalizedName);
        return originals[normalizedName];
    });
}

function stubSingleModule(name, implementation) {
    var isAlreadyStubbed = stubbed.filter(function(def){
        return def.name === name;
    }).length > 0;

    if (isAlreadyStubbed) {
        throw new Error('Cannot stub module "' + name + '" twice');
    }

    stubbed.push({
        name: name,
        implementation: implementation
    });
}

function stub(){
    var stubOne  = typeof arguments[0] === 'string' && !!arguments[1],
        stubMany = isObject(arguments[0]),
        map;

    if (stubOne){
        stubSingleModule(arguments[0], arguments[1]);
        return;
    }

    if (stubMany){
        map = arguments[0];
        Object.keys(map).forEach(function(key) {
            stubSingleModule(key, map[key]);
        });
        return;
    }

    throw new Error('stub method expects either an Object as a map of names and default exports, or a single <name, exports> pair as arguments');
}

function fetchDependency(name) {
    var load = {
        name: name,
        metadata: {}
    };

    if (caches[name]) {
        return Promise.resolve(caches[name]);
    }

    return System.locate(load)
        .then(function(address) {
            load.address = address;
            return System.fetch(load);
        }).then(function (source){
            load.source = source;
            caches[name] = load;
            return load;
        });
}

function addNormalizedName(stub, i) {
    return System.normalize(stub.name).then(function(normalizedName){
        stubbed[i].normalizedName = normalizedName;
    });
}

function getReplacementModule(originalModule, stub) {
    var implementation = stub.implementation;
    var moduleDef;

    switch (typeof implementation) {
        case 'object':
            moduleDef = implementation;
            break;
        case 'function':
            moduleDef = Object.keys(implementation).reduce(function (acc, key) {
                acc[key] = implementation[key];
                return acc;
            }, {
                default: implementation
            });
            break;
        default:
            moduleDef = {
                default: implementation
            };
    }

    return System.newModule(moduleDef);
}

function redefineStubs(){
    return Promise.all(
        stubbed.map(function (stub) {
            var normalizedName = stub.normalizedName;

            return preserveDefinition(normalizedName).then(function(originalModule){
                System.delete(normalizedName);
                System.set(normalizedName, getReplacementModule(originalModule, stub));
            });
        })
    );
}

function redefineRequiredModule(normalizedName) {
    return preserveIfDefined(normalizedName)
        .then(function() {
            System.delete(normalizedName)
            return fetchDependency(normalizedName);
        })
        .then(function(load) {
            originals[normalizedName] = {
                source: load.source
            };
            return System.define(load.name, load.source);
        })
        .then(function(){
            stubbed.push({
                normalizedName: normalizedName
            });
            return System.get(normalizedName);
        });
}

function requireWithStubs(name){
    return Promise.all(stubbed.map(addNormalizedName))
        .then(redefineStubs)
        .then(function () {
            return System.normalize(name);
        })
        .then(redefineRequiredModule)
}

function reset(){
    var restoreStubsPromise = stubbed.reduce(function(promise, stub){
        var normalizedName = stub.normalizedName;
        var original = originals[normalizedName];

        if (!original) {
            return promise;
        }

        System.delete(normalizedName);

        return promise.then(function(){
            if (original.source) {
                return System.define(normalizedName, original.source);
            } else {
                System.set(normalizedName, originals[normalizedName]);
            }
        });
    }, Promise.resolve());

    return restoreStubsPromise
        .then(function() {
            stubbed = [];
        });
}

module.exports = {
    stub: stub,
    requireWithStubs: requireWithStubs,
    require: require,
    reset: reset
};
