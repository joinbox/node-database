import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));



export default class Model {

    constructor({
        name,
        fields,
    }) {
        this.fields = fields;
        this._name = name;
        this.data = new Map();

        this.createAccesors(fields);
    }



    createAccesors(fields) {
        for (let { targetName } of fields) {
            if (this[targetName] !== undefined) {
                throw new Error(`${this.getLogPrefix()} Cannot create accessor for property ${targetName}: property has already a value on this this model!`);
            }

            Object.defineProperty(this, targetName, {
                get: () => this.get(targetName),
                set: (value) => this.set(targetName, value),
            });
        }
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


    delete(property) {
        this.data.delete(property);
    }


    get(property) {
        log.debug(`${this.getLogPrefix()} returning property ${property} with the value ${this.data.get(property)}`);
        return this.data.get(property);
    }


    has(property) {
        log.debug(`${this.getLogPrefix()} property ${property} has ${this.data.has(property) ? 'a' : 'no'} value`);
        return this.data.has(property);
    }



    contains(property, valueMap) {
        if (this.hasValue(property)) {
            for (const value of this.get(property)) {
                if (valueMap.has(value)) {
                    return true;
                }
            }
        }

        return false;
    }


    hasValue(property) {
        if (this.has(property)) {
            const value = this.get(property);
            
            if (Array.isArray(value)) {
                return !!value.filter(item => item !== undefined && item !== null).length;
            } else {
                return value !== undefined && value !== null;
            }
        }

        return false;
    }


    getLogPrefix() {
        return `[${this._name}]${this.data.has('id') ? `[${this.data.get('id')}]` : ''}`;
    }


    createRelation(name) {
        this.data.set(name, []);
    }


    toJSON() {
        return Object.fromEntries(this.data);
    }


    toObject(...fields) {
        const obj = {};

        for (const field of fields) {
            obj[field] = this.get(field);
        }

        return obj;
    }
}