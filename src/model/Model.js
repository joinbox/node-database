import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));



export default class Model {

    constructor({
        name,
    }) {
        this.name = name;
        this.data = new Map();
    }


    getData() {
        log.debug(`${this.getLogPrefix()} Returning data`);
        return Object.fromEntries(this.data);
    }


    setData(data = {}) {
        this.data = new Map(Object.entries(data));
        log.debug(`${this.getLogPrefix()} Setting data`);
    }


    set(property, value) {
        log.debug(`${this.getLogPrefix()} setting ${property} to ${value}`);
        this.data.set(property, value);
    }


    get(property) {
        log.debug(`${this.getLogPrefix()} returning property ${property} with the value ${this.data.get(property)}`);
        return this.data.get(property);
    }


    has(property) {
        log.debug(`${this.getLogPrefix()} property ${property} has ${this.data.has(property) ? 'a' : 'no'} value`);
        return this.data.has(property);
    }


    getLogPrefix() {
        return `[${this.name}]${this.data.has('id') ? `[${this.data.get('id')}]` : ''}`;
    }


    createRelation(name) {
        this.data.set(name, []);
    }
}