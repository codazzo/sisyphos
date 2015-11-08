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
            sisyphos.stub('mocks/a.js', 'something');

            return sisyphos.require('mocks/c.js').then(function(c){
                assert.equal(c.getA(), 'something');
            });
        });

        it('should accept a map of stubs', function(){
            sisyphos.stub({
                'mocks/a.js': 'wow',
                'mocks/b.js': {
                    foo: 'newfoo',
                    bar: 'newbar'
                }
            });
            return sisyphos.require('mocks/c.js').then(function(c){
                assert.equal(c.getA(), 'wow');
                assert.equal(c.getFoo(), 'newfoo');
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
                return System.import('mocks/c.js').then(function(){
                    sisyphos.stub({
                        'mocks/a.js': 'wow',
                        'mocks/b.js': {
                            foo: 'newfoo',
                            bar: 'newbar'
                        }
                    });
                    return sisyphos.require('mocks/c.js');
                });
            });

            it('should return all original implementations to their names', function(){
                return sisyphos.reset()
                    .then(System.import.bind(System, 'mocks/c.js'))
                    .then(function(c){
                        assert.equal(c.getA(), 'a');
                        assert.equal(c.getFoo(), 'foo');
                    });
            });
        });

        describe('if the module was not in the registry before being required', function() {
            beforeEach(function() {
                sisyphos.stub({
                    'mocks/a.js': 'rewow',
                    'mocks/b.js': {
                        foo: 'refoo',
                        bar: 'rebar'
                    }
                });
                return sisyphos.require('mocks/d.js');
            });

            it('should return all original implementations to their names', function(){
                return sisyphos.reset()
                    .then(System.import.bind(System, 'mocks/d.js'))
                    .then(function(d){
                        assert.equal(d.getA(), 'a');
                        assert.equal(d.getBar(), 'bar');
                    });
            });
        });
    });
});
