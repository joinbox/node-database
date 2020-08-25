import section from 'section-tests';
import { Collection, Model } from '../index.js';
import assert from 'assert';


section('Collection', (section) => {
    section.test('createModel', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        const model = collection.createModel({id: 324});

        assert(model);
        assert.equal(model.get('id'), 324);
    });


    section.test('getName', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });
        
        assert.equal(collection.getName(), 'user');
    });



    section.test('addModel', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        const model = collection.createModel({id: 324});
        
        collection.addModel(model);
        assert(collection.models.includes(model));
    });


    section.test('size', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        const model = collection.createModel({id: 324});
        
        collection.addModel(model);
        assert.equal(collection.length, 1);
    });


    section.test('createAndAddModel', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        collection.createAndAddModel({id: 324});
        assert.equal(collection.length, 1);
    });


    section.test('setModels', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        const model = new Model({ name: 'user' });

        collection.setModels([model]);
        assert.equal(collection.length, 1);
    });


    section.test('getModels', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        collection.createAndAddModel({id: 324});
        assert.equal(collection.getModels().length, 1);
    });


    section.test('deleteModel', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        const model = collection.createAndAddModel({id: 324});
        collection.deleteModel(model);
        assert.equal(collection.length, 0);
    });


    section.test('hasModel', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        const model = collection.createAndAddModel({id: 324});
        assert.equal(collection.hasModel(model), true);
    });


    section.test('findModel', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        const model = collection.createAndAddModel({id: 324});
        assert(collection.findModel('id', 324));
        assert(!collection.findModel('id', 1));
    });


    section.test('findById', async() => {
        const collection = new Collection({
            name: 'user',
            ModelConstructor: Model,
        });

        const model = collection.createAndAddModel({id: 324});
        assert(collection.findById(324));
        assert(!collection.findById(1));
    });
});