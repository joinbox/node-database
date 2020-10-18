import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));


export default class Database {


    constructor({
        dataModelDefintion,
        name,
    }) {
        this.dataModelDefintion = dataModelDefintion;
        this.name = name;
        this.collections = new Map();
        this.modelContructors = new Map();
        this.dataLoaderConstructors = new Map();
        this.collectionConstructors = new Map();
    }


    registerCollection(name, CollectionConstructor) {
        log.debug(`[${this.name}] registering collection constructor ${name}`);
        this.collectionConstructors.set(name, CollectionConstructor);
    }


    registerModel(name, ModelConstructor) {
        log.debug(`[${this.name}] registering model constructor ${name}`);
        this.modelContructors.set(name, ModelConstructor);
    }


    registerDataLoader(name, DataLoaderConstructor, dataLoaderOptions) {
        log.debug(`[${this.name}] registering DataLoader constructor ${name}`);
        this.dataLoaderConstructors.set(name, {
            DataLoaderConstructor,
            dataLoaderOptions,
        });
    }


    addCollection(collection) {
        log.debug(`[${this.name}] adding collection ${collection.getName()}`);
        this.collections.set(collection.getName(), collection);
    }


    has(collectionName) {
        return this.collections.has(collectionName);
    }


    get(collectionName) {
        if (!this.has(collectionName)) {
            throw new Error(`Cannot reutrn collection ${collectionName}, collection does not exist!`);
        }

        return this.collections.get(collectionName);
    }


    async reload() {
        log.info(`[${this.name}] reloading data`);
        for (const collection of this.collections.values()) {
            collection.reset();
        }

        await this.load();
    }



    async setup() {
        log.debug(`[${this.name}] setting up database`);

        for (const definition of this.dataModelDefintion) {
            log.info(`[${this.name}] setting up collection ${definition.name} ...`);


            if (!this.dataLoaderConstructors.has(definition.dataLoader.type)) {
                throw new Error(`DataLoader type ${definition.dataLoader.type} not found!`);
            }
            if (!this.modelContructors.has(definition.model.type)) {
                throw new Error(`Model type ${definition.model.type} not found!`);
            }
            if (!this.collectionConstructors.has(definition.collection.type)) {
                throw new Error(`Model type ${definition.collection.type} not found!`);
            }


            log.debug(`[${this.name}][${definition.name}] using dataLoader ${definition.dataLoader.type}`);
            log.debug(`[${this.name}][${definition.name}] using model ${definition.model.type}`);
            log.debug(`[${this.name}][${definition.name}] using collection ${definition.collection.type}`);


            const { DataLoaderConstructor, dataLoaderOptions } = this.dataLoaderConstructors.get(definition.dataLoader.type);
            const dataLoader = new DataLoaderConstructor({
                ...definition.dataLoader.config,
                dataLoaderOptions,
                name: definition.name,
            });

            const CollectionConstructor = this.collectionConstructors.get(definition.collection.type);
            const collection = new CollectionConstructor({
                name: definition.name,
                ModelConstructor: this.modelContructors.get(definition.model.type),
                dataLoader,
                database: this,
                relations: definition.collection.relations,
                indices: definition.collection.indices,
                fields: definition.collection.fields,
                filters: definition.collection.filters,
                strictValidation: definition.strictValidation,
                uniqueKey: definition.collection.uniqueKey,
            });

            await collection.initialize();

            this.collections.set(collection.getName(), collection);
        }
    }



    async load() {
        log.info(`[${this.name}] loading data ...`);

        // fetch data
        for (const collection of this.collections.values()) {
            log.info(`[${this.name}] loading data for collection ${collection.getName()}`);
            await collection.load();
        }

        log.info(`[${this.name}] resolving relations ...`);
        const start = Date.now();

        // resolve relations
        for (const collection of this.collections.values()) {
            log.debug(`[${this.name}] resolving relations for collection ${collection.getName()}`);
            await collection.resolveRelations();
        }

        log.info(`[${this.name}] relations resolved after ${(Date.now() - start)} milliseconds`);
        log.info(`[${this.name}] database was initalized`);
    }
}