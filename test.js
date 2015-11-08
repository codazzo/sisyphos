import {assert} from 'chai';
import sinon from 'sinon';
import sisyphos from './index.js';

/* eslint-env mocha */

var sandbox = sinon.sandbox.create();

describe('sisyphos', function(){

    afterEach(function(){
        sandbox.restore();
        return sisyphos.reset();
    });

    describe('stub method', function(){
        it('should not accept the same name twice', function(){
            var name = 'some/arbitrary/name';

            sisyphos.stub(name, {});
            assert.throws(function(){
                sisyphos.stub(name, {});
            });
        });

        it('can stub modules that have a single default export', function(){
            sisyphos.stub('mocks/default_a.js', {
                default: 'something'
            });

            return sisyphos.require('mocks/c.js').then(function(c){
                assert.equal(c.getA(), 'something');
            });
        });

        it('can stub modules that have a multiple named exports', function(){
            sisyphos.stub('mocks/foo_and_bar.js', {
                foo: 'newfoo',
                bar: 'newbar'
            });

            return sisyphos.require('mocks/d.js').then(function(c){
                assert.equal(c.getFoo(), 'newfoo');
                assert.equal(c.getBar(), 'newbar');
            });
        });

        it('can stub modules with default exports and named exports at the same time', function() {
            sisyphos.stub('mocks/default_a.js', {
                default: 'something'
            });

            sisyphos.stub('mocks/foo_and_bar.js', {
                foo: 'newfoo'
            });

            return sisyphos.require('mocks/d.js').then(function(c){
                assert.equal(c.getFoo(), 'newfoo');
                assert.equal(c.getA(), 'something');
            });
        });

        it('should accept a map of stub names to their default exports', function(){
            sisyphos.stub({
                'mocks/default_a.js': 'wow',
                'mocks/default_b.js': 'such stub'
            });
            return sisyphos.require('mocks/c.js').then(function(c){
                assert.equal(c.getA(), 'wow');
                assert.equal(c.getB(), 'such stub');
            });
        });
    });

    describe('requireWithStubs method', function(){
        it('should be a function', function(){
            assert(typeof sisyphos.requireWithStubs === 'function');
        });
    });

    describe('require method', function(){
        it('should be an alias of requireWithStubs', function(){
            assert.equal(sisyphos.require, sisyphos.requireWithStubs);
        });
    });

    describe('reset method', function(){
        describe('if the module was in the registry before being required', function() {
            beforeEach(function() {
                var name = 'mocks/c.js';

                return System.import(name).then(function(){
                    sisyphos.stub({
                        'mocks/default_a.js': 'wow',
                        'mocks/default_b.js': 'such stub'
                    });
                    return sisyphos.require(name);
                });
            });

            it('should return all original implementations to their names', function(){
                return sisyphos.reset()
                    .then(System.import.bind(System, 'mocks/c.js'))
                    .then(function(c){
                        assert.equal(c.getA(), 'a');
                        assert.equal(c.getB(), 'b');
                    });
            });
        });

        describe('if the module was not in the registry before being required', function() {
            beforeEach(function() {
                var name = 'mocks/d.js';

                return System.normalize(name)
                    .then(function(normalizedName) {
                        System.delete(normalizedName);
                    })
                    .then(function() {
                        sisyphos.stub('mocks/foo_and_bar.js', {
                            foo: 'newfoo',
                            bar: 'newbar'
                        });
                        return sisyphos.require(name);
                    });
            });

            it('should return all original implementations to their names', function(){
                return sisyphos.reset()
                    .then(System.import.bind(System, 'mocks/d.js'))
                    .then(function(d){
                        assert.equal(d.getFoo(), 'foo');
                        assert.equal(d.getBar(), 'bar');
                    });
            });
        });
    });
});
