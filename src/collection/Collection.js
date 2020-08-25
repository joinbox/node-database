import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));


export default class Collection {

    constructor({
        name,
        ModelConstructor,
        dataLoader,
        database,
        relations = [],
    }) {
        this.database = database;
        this.dataLoader = dataLoader;
        this.name = name;
        this.ModelConstructor = ModelConstructor;

        this.relations = new Set();
        this.models = [];


        for (const relation of relations) {
            this.registerRelation(relation);
        }
    }



    reset() {
        this.models = [];
    }



    getName() {
        return this.name;
    }


    resolveRelations() {
        log.info(`${this.getLogPrefix()} resolving relations`);

        for (const relation of this.relations.values()) {
            log.debug(`${this.getLogPrefix()} resolving ${relation.type} to ${relation.collection}`);

            if (relation.type === 'hasMany') {
                this.resolveHasManyRelation(relation);
            } else if (relation.type === 'belongsToMany') {
                this.resolveBelongsToManyRelation(relation);
            } else {
                throw new Error(`[${this.getName()}] unknown relation type ${relation.type}!`);
            }
        }
    }



    resolveBelongsToManyRelation(relation) {
        if (!this.database.has(relation.collection)) {
            throw new Error(`[${this.getName()}] Cannot reolve ${relation.type} relation to ${relation.collection}, collection does not exist!`);
        }

        const collection = this.database.get(relation.collection);

        for (const model of this.getModels()) {
            model.createRelation(relation.name);

            if (model.has(relation.ourKey)) {
                model.get(relation.name).push(...collection.findModels(relation.theirKey, model.get(relation.ourKey)));
            }
        }
    }



    resolveHasManyRelation(relation) {
        if (!this.database.has(relation.collection)) {
            throw new Error(`[${this.getName()}] Cannot reolve ${relation.type} relation to ${relation.collection}, collection does not exist!`);
        }

        const collection = this.database.get(relation.collection);

        for (const model of this.getModels()) {
            model.createRelation(relation.name);

            if (model.has(relation.ourKey)) {
                const ids = model.get(relation.ourKey);

                if (!Array.isArray(ids)) {
                    throw new Error(`Èxpected an array on the hasMany relation from ${this.getName()}.${relation.ourKey} to ${relation.collection}.${relation.theirKey}; Got ${typeof ids}!`);
                }

                for (const id of model.get(relation.ourKey)) {
                    const remoteModel = collection.findModel(relation.theirKey, id);

                    if (!remoteModel) {
                        throw new Error(`[${this.getName()}] Failed to resolve relation ${relation.collection}: remote model with key ${relation.theirKey} wit the value ${id} not found!`);
                    }

                    model.get(relation.name).push(remoteModel);
                }
            }
        }
    }
    

    registerRelation({
        type,
        theirKey,
        ourKey,
        collection,
        name,
    }) {
        this.relations.add({
            type,
            theirKey,
            ourKey,
            collection,
            name,
        });
    }


    findById(value) {
        return this.findModel('id', value);
    }

    findModel(key, value) {
        log.debug(`${this.getLogPrefix()} find model by ${key} ${value}`);
        for (const model of this.models) {
            const localValue = model.get(key);
            if (localValue === value || Array.isArray(localValue) && localValue.includes(value)) {
                log.debug(`${this.getLogPrefix(model)} model by ${key} ${value} found!`);
                return model;
            }
        }

        log.debug(`${this.getLogPrefix()} model by ${key} ${value} not found!`);
        return null;
    }

    findModels(key, value) {
        log.debug(`${this.getLogPrefix()} find models by ${key} ${value}`);
        const models = [];

        for (const model of this.models) {
            const localValue = model.get(key);
            if (localValue === value || Array.isArray(localValue) && localValue.includes(value)) {
                log.debug(`${this.getLogPrefix(model)} model by ${key} ${value} found!`);
                models.push(model);
            }
        }

        log.debug(`${this.getLogPrefix()} ${models.length} models found by ${key} ${value}`);
        return models;
    }

    createModel(data) {
        log.debug(`${this.getLogPrefix()} create model`);
        const model = new this.ModelConstructor({
            name: this.getName(),
        });

        model.setData(data);
        return model;
    }

    createAndAddModel(data) {
        const model = this.createModel(data);
        return this.addModel(model);
    }

    addModel(model) {
        log.debug(`${this.getLogPrefix(model)} add model`)
        this.models.push(model);
        return model;
    }

    getModels() {
        log.debug(`${this.getLogPrefix()} returning models`);
        return this.models;
    }

    deleteModel(model) {
        log.debug(`${this.getLogPrefix(model)} removing model`);
        if (this.models.includes(model)) {
            this.models.splice(this.models.indexOf(model), 1);
        }
    }


    hasModel(model) {
        log.debug(`${this.getLogPrefix(model)} collection ${this.models.includes(model) ? 'has' : 'does not have'} model`);
        return this.models.includes(model);
    }


    setModels(models) {
        log.debug(`${this.getLogPrefix()} settings models`)
        this.models = models;
    }

    getLogPrefix(model) {
        return `[${this.getName()}]${model && model.has('id') ? `[${model.get('id')}]` : ''}`;
    }


    get length() {
        return this.models.length;
    }


    async load() {
        const data = await this.dataLoader.load();
        for (const item of data) {
            this.createAndAddModel(item);
        }
    }
}