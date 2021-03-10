import logd from 'logd';
import path from 'path';
import VMModule from '../VMModule.js';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));


export default class Collection {

    constructor({
        name,
        ModelConstructor,
        dataLoader,
        database,
        relations = [],
        indices = [],
        fields = null,
        filters,
        strictValidation = true,
        uniqueKey,
    }) {
        this.uniqueKey = uniqueKey;
        this.indicesConfiguration = indices;
        this.database = database;
        this.dataLoader = dataLoader;
        this.name = name;
        this.ModelConstructor = ModelConstructor;
        this.fields = fields;
        this.filters = filters;
        this.strictValidation = strictValidation;

        this.relationDefinitions = relations;
        this.indiceDefinitions = indices;
        this.relations = new Set();
            
        // the targetname may not be defined, set it
        for (const field of this.fields) {
            if (!field.sourceName) {
                field.sourceName = field.name || field.targetName;
            }

            if (!field.targetName) {
                field.targetName = field.name;
            }
        }

        this.reset();

        for (const relation of relations) {
            this.registerRelation(relation);
        }

        this.isInitialized = false;
    }



    async setupFieldTranslators() {
        log.info(`${this.getLogPrefix()} setting up field translators`);
        if (this.fields) {
            this.translators = new Set();

            for (const { sourceName, targetName, translator } of this.fields) {
                let translatorInstance;
                log.debug(`${this.getLogPrefix()} translating ${sourceName} into ${targetName}${translator ? 'using a translator function' : ' without a translator function'}`);

                if (translator) {
                    translatorInstance = new VMModule({ sourceCode: translator });
                    await translatorInstance.load();
                    await translatorInstance.execute();
                } 

                this.translators.add({ sourceName, targetName, translatorInstance });
            }
        }
    }


    reset() {
        this.models = [];
        this.uniqueKeyIndex = new Set();
        this.indices = new Map(this.indiceDefinitions.map(name => ([name, new Map()])));
    }



    getName() {
        return this.name;
    }




    filter(key, value, inPlace = false) {
        const models = this.findModels(key, value);

        if (inPlace) {
            this.reset();
            this.setModels(models);
            return this;
        } else {
            const collection =  new Collection({
                name: this.name,
                ModelConstructor: this.ModelConstructor,
                dataLoader: this.dataLoader,
                database: this.database,
                relations: this.relationDefinitions,
                indices: this.indiceDefinitions,
                fields: this.fields,
            });

            collection.setModels(models);
            return collection;
        }
    }



    resolveRelations() {
        if (!this.isInitialized) {
            throw new Error(`[${this.getName()}] canont resolveRelations(): collection was not initialized!`);
        }

        const start = Date.now();
        log.info(`${this.getLogPrefix()} resolving relations`);

        for (const relation of this.relations.values()) {
            log.debug(`${this.getLogPrefix()} resolving ${relation.type} to ${relation.collection}`);

            if (relation.type === 'hasMany') {
                this.resolveHasManyRelation(relation);
            } else if (relation.type === 'belongsToMany') {
                this.resolveBelongsToManyRelation(relation);
            } else if (relation.type === 'hasOne' ) {
                this.resolveHasOneRelation(relation);
            } else {
                throw new Error(`[${this.getName()}] unknown relation type ${relation.type}!`);
            }
        }

        log.info(`${this.getLogPrefix()} relations resolved after ${(Date.now() - start)} milliseconds`);
    }






    resolveHasOneRelation(relation) {
        if (!this.database.has(relation.collection)) {
            throw new Error(`[${this.getName()}] Cannot reolve ${relation.type} relation to ${relation.collection}, collection does not exist!`);
        }

        const collection = this.database.get(relation.collection);
        for (const model of this.getModels()) {
            if (model.has(relation.ourKey) && model.get(relation.ourKey) !== undefined && model.get(relation.ourKey) !== null) {
                const id = model.get(relation.ourKey);
                const remoteModel = collection.findModel(relation.theirKey, id);

                if (remoteModel === null) {
                    if (this.strictValidation) {
                        throw new Error(`[${this.getName()}] Failed to resolve relation ${relation.collection}: remote model with key ${relation.theirKey} wit the value ${id} not found!`);
                    } else {
                        log.warn(`[${this.getName()}] Failed to resolve relation ${relation.collection}: remote model with key ${relation.theirKey} wit the value ${id} not found!`);
                    }
                } else {
                    model.set(relation.name, remoteModel);
                }
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

            if (model.has(relation.ourKey) && model.get(relation.ourKey) !== undefined && model.get(relation.ourKey) !== null) {
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
                    if (id === null || id === undefined) {
                        continue;
                    }

                    const remoteModel = collection.findModel(relation.theirKey, id);

                    if (remoteModel === null) {
                        if (this.strictValidation) {
                            throw new Error(`[${this.getName()}] Failed to resolve relation ${relation.collection}: remote model with key ${relation.theirKey} wit the value ${id} not found!`);
                        } else {
                            log.warn(`[${this.getName()}] Failed to resolve relation ${relation.collection}: remote model with key ${relation.theirKey} wit the value ${id} not found!`);
                        }
                    } else {
                        model.get(relation.name).push(remoteModel);
                    }
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
        const models = this.findModels(key, value, 1);
        
        if (models.length) {
            log.debug(`${this.getLogPrefix()} model by ${key} ${value} found!`);
            return models[0];
        } else {
            log.debug(`${this.getLogPrefix()} model by ${key} ${value} not found!`);
            return null;
        }
    }

    findModels(key, value, limit) {
        log.debug(`${this.getLogPrefix()} find models by ${key} ${value}`);
        let models;

        if (this.indices.has(key)) {
            log.debug(`${this.getLogPrefix()} ${key} has an index, returning models from there!`);
            
            const indexMap = this.indices.get(key);
            if (indexMap.has(value)) {
                models = indexMap.get(value);
            } else {
                models = [];
            }
        }


        if (!models) {
            models = [];

            for (const model of this.models) {
                const localValue = model.get(key);
                if (localValue === value || Array.isArray(localValue) && localValue.includes(value)) {
                    log.debug(`${this.getLogPrefix(model)} model by ${key} ${value} found!`);
                    models.push(model);
                }
            }
        }

        const sortedModels = models.sort((a, b) => a[key] > b[key] ? -1 : 1);

        if (limit) {
            log.debug(`${this.getLogPrefix()} ${models.length} models found by ${key} ${value} and limited by ${limit}`);
            return sortedModels.slice(0, limit);
        } else {
            log.debug(`${this.getLogPrefix()} ${models.length} models found by ${key} ${value}`);
            return sortedModels;
        }
    }

    createModel(data) {
        log.debug(`${this.getLogPrefix()} create model`);
        const model = new this.ModelConstructor({
            name: this.getName(),
            fields: this.fields,
        });

        model.setData(data);
        return model;
    }

    createAndAddModel(data) {
        const model = this.createModel(data);
        return this.addModel(model);
    }

    addModel(model) {
        log.debug(`${this.getLogPrefix(model)} add model`);

        if (this.uniqueKey) {
            const value = model.get(this.uniqueKey);

            if (this.uniqueKeyIndex.has(value)) {
                return null;
            } else {
                this.uniqueKeyIndex.add(value);
            }
        }


        this.models.push(model);

        for (const index of this.indicesConfiguration) {
            const values = model.has(index) ? (Array.isArray(model.get(index)) ? model.get(index) : [ model.get(index) ]) : [ null ];
            const indexMap = this.indices.get(index);

            for (const value of values) {
                if (!indexMap.has(value)) {
                    indexMap.set(value, []);
                }

                indexMap.get(value).push(model);
            }
        }

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

        for (const model of models) {
            this.addModel(model);
        }
    }

    getLogPrefix(model) {
        return `[${this.getName()}]${model && model.has('id') ? `[${model.get('id')}]` : ''}`;
    }


    get length() {
        return this.models.length;
    }



    async initialize() {
        this.isInitialized = true;
        await this.setupFieldTranslators();
    }


    async load() {
        if (!this.isInitialized) {
            throw new Error(`[${this.getName()}] canont load(): collecction was not initialozed!`);
        }

        const data = await this.dataLoader.load();
        let filteredItems = 0;

        for (let item of data) {
            item = this.translateAndMapProperties(item);

            if (this.satisfiesFilters(item)) {
                this.createAndAddModel(item);
            } else {
                filteredItems++;
            }
        }

        log.info(`${this.getLogPrefix()} loaded ${data.length} records removed ${filteredItems} records due to filtering...`)
    }



    satisfiesFilters(data) {
        if (!this.filters) {
            return true;
        }

        for(const { propertyName, comparator, value } of this.filters) {
            switch (comparator) {
                case 'equals':
                    if (data[propertyName] !== value)  {
                        log.debug(`${this.getLogPrefix()} filtered item: ${propertyName} with the value ${data[propertyName]} does not suffice filter ${comparator} with the value ${value}`)
                        return false;
                    }
                    break;

                case 'notEquals':
                    if (data[propertyName] === value)  {
                        log.debug(`${this.getLogPrefix()} filtered item: ${propertyName} with the value ${data[propertyName]} does not suffice filter ${comparator} with the value ${value}`)
                        return false;
                    }
                    break;

                case 'equalsSome':
                    if (!Array.isArray(value)) {
                        throw new Error(`${this.getLogPrefix()} expected an array of values for the filter of the propertyName ${propertyName}!`);
                    } else {
                        if (!value.some(itemValue => data[propertyName] === itemValue)) {
                            log.debug(`${this.getLogPrefix()} filtered item: ${propertyName} with the value ${data[propertyName]} does not suffice filter ${comparator} with the values ${value.join(', ')}`)
                            return false;
                        }
                    }
                    break;

                default: 
                    throw new Error(`[${this.getName()}] cannot filter data, the comparator ${comparator} is not known!`);
            }
        }


        return true;
    }



    translateAndMapProperties(inputData) {
        if (!this.translators) {
            return inputData;
        }

        const outputData = {};

        for (let { sourceName, targetName, translatorInstance } of this.translators.values()) {
            if (translatorInstance) {
                outputData[targetName] = translatorInstance.translate(inputData[sourceName], inputData);
            } else {
                if (inputData[sourceName] !== undefined) {
                    outputData[targetName] = inputData[sourceName];
                } else {
                    outputData[targetName] = null;
                }
            }
        }

        return outputData;
    }



    toJSON() {
        return this.getModels().map(model => model.toJSON());
    }
}