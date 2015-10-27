
/* global System */
var stubbed = [],
    caches = {}, //this could be a WeakMap
    originals = {};

function preserveDefinition(name){
    var isDefined = System.has(name);
    var isStubbed = originals.hasOwnProperty(name);

    if (isDefined && !isStubbed){
        originals[name] = System.get(name).default;
    }
}

function undefine(name) {
    delete System.defined[name]; //shouldn't be necessary: bug in System.js ?
    System.delete(name);
}

function stub(name, implementation) {
    if (stubbed.indexOf(name) !== -1){
        throw new Error('Cannot stub module "' + name + '" twice');
    }

    // we need to resolve the name in order to stub the dependency and that's an
    // asynchronous operation: postpone it to requireWithStubs()
    // as stub() is a synchronous method
    stubbed.push({
        name: name,
        implementation: implementation
    });
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

function requireWithStubs(name, callback, errback){
    Promise.all(stubbed.map(function(stub) {
        return System.normalize(stub.name).then(function(normalizedStubbedName){
            return {
                normalizedName: normalizedStubbedName,
                name: stub.name,
                implementation: stub.implementation
            };
        });
    })).then(function (stubs){
        stubbed = stubs; //adds normalized names
        stubs.forEach(function (stub) {
            var normalizedName = stub.normalizedName;
            preserveDefinition(normalizedName);
            undefine(normalizedName);
            System.amdDefine(normalizedName, [], function () {
                return stub.implementation;
            });
        });
    }).then(function () {
        System.normalize(name).then(function (normalizedName) {
            var stubNames = stubbed.map(function (stub){
                return stub.name;
            });
            preserveDefinition(normalizedName);

            undefine(normalizedName);

            Promise.all(stubNames.map(function(name){
                return System.import(name);
            })).then(function() {
                return fetchDependency(normalizedName);
            }).then(function(load) {
                return System.define(load.name, load.source);
            }).then(function(){
                return System.get(normalizedName).default;
            }).then(callback);
        }).catch(errback);
    });
}

function reset(callback){
    var originalsToRestore = [];

    if (stubbed.length === 0) {
        callback();
        return;
    }

    stubbed.forEach(function(stub){
        var name = stub.name;
        var normalizedName = stub.normalizedName;
        undefine(normalizedName);

        if (originals[normalizedName]){
            System.amdDefine(normalizedName, [], function(){
                return originals[normalizedName];
            });
            originalsToRestore.push(normalizedName);
        }
    });

    Promise.all(originalsToRestore.map(function (normalizedName) {
        return System.import(normalizedName);
    })).then(function (){
        stubbed = [];
        callback();
    });
}

module.exports = {
    stub: stub,
    require: requireWithStubs,
    requireWithStubs: requireWithStubs,
    reset: reset
};