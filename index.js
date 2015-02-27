'use strict';

var stubbed = [],
    originals = {};

function preserveDefinition(name){
    var isDefined = System._loader.modules.hasOwnProperty(name); //check: why not System.defined[name]? bug?
    var isStubbed = originals.hasOwnProperty(name);

    if (isDefined && !isStubbed){
        // this seems to be causing a weird problem
        // originals[name] = System.import(name); //not sure - might have to assign fulfillment value with then()

        var themod = System._loader.modules[name].module.default;
        originals[name] = themod;
        // originals[name] = Promise.resolve(themod);
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

function requireWithStubs(name, callback, errback){
    Promise.all(stubbed.map(function(stub) {
        return System.normalize(stub.name).then(function(normalizedStubbedName){
            return {
                normalizedName: normalizedStubbedName,
                name: stub.name,
                implementation: stub.implementation
            }
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

            System.amdRequire(stubNames, function () {
                System.amdRequire([name], function (mod) {
                    stubbed.push({
                        name: name,
                        normalizedName: normalizedName,
                        implementation: mod
                    })
                    callback(mod); // Return the required module.
                });
            }, errback);
        });
    })
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
        return System.import(normalizedName)
    })).then(function (){
        stubbed = [];
        callback();
    });
}

module.exports = {
    stub: stub,
    requireWithStubs: requireWithStubs,
    reset: reset
};