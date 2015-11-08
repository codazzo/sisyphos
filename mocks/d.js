import a from './default_a.js';
import {foo, bar} from './foo_and_bar.js';

export function getA(){
    return a;
}

export function getBar(){
    return bar;
}

export function getFoo(){
    return foo;
}
