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


    section.test('hasOne relation', async() => {
        class Database {
            setCollections(collections) {
                this.collections = collections;
            }

            get(name) {
                return this.collections.get(name);
            }

            has(name) {
                return this.collections.has(name);
            }
        }

        const database = new Database();


        const relations = [{
            type: 'hasOne',
            collection: 'company',
            ourKey: 'id_company',
            theirKey: 'id',
            name: 'company',
        }];

        const employees = new Collection({
            name: 'employee',
            ModelConstructor: Model,
            relations,
            database,
        });

        const companies = new Collection({
            name: 'company',
            ModelConstructor: Model,
            database,
        });


        database.setCollections(new Map([
            [employees.name, employees], 
            [companies.name, companies],
        ]));

        employees.createAndAddModel({id: 1, id_company: 1, name: 'Lina'});
        companies.createAndAddModel({id: 1, name: 'joinbox'});
        employees.resolveHasOneRelation(relations[0]);

        assert.equal(employees.getModels()[0].get('company').get('name'), 'joinbox');
    });


    section.test('BelongsToMany relation', async() => {
        class Database {
            setCollections(collections) {
                this.collections = collections;
            }

            get(name) {
                return this.collections.get(name);
            }

            has(name) {
                return this.collections.has(name);
            }
        }

        const database = new Database();


        const relations = [{
            type: 'belongsToMany',
            collection: 'employee',
            ourKey: 'id',
            theirKey: 'id_company',
            name: 'employees',
        }];

        const employees = new Collection({
            name: 'employee',
            ModelConstructor: Model,
            database,
        });

        const companies = new Collection({
            name: 'company',
            ModelConstructor: Model,
            relations,
            database,
        });


        database.setCollections(new Map([
            [employees.name, employees], 
            [companies.name, companies],
        ]));

        employees.createAndAddModel({id: 1, id_company: 1, name: 'Lina'});
        companies.createAndAddModel({id: 1, name: 'joinbox'});
        companies.resolveBelongsToManyRelation(relations[0]);

        assert.equal(companies.getModels()[0].get('employees')[0].get('name'), 'Lina');
    });


    section.test('hasMany relation', async() => {
        class Database {
            setCollections(collections) {
                this.collections = collections;
            }

            get(name) {
                return this.collections.get(name);
            }

            has(name) {
                return this.collections.has(name);
            }
        }

        const database = new Database();


        const relations = [{
            type: 'hasMany',
            collection: 'employee',
            ourKey: 'id_employees',
            theirKey: 'id',
            name: 'employees',
        }];

        const employees = new Collection({
            name: 'employee',
            ModelConstructor: Model,
            database,
        });

        const companies = new Collection({
            name: 'company',
            ModelConstructor: Model,
            relations,
            database,
        });


        database.setCollections(new Map([
            [employees.name, employees], 
            [companies.name, companies],
        ]));

        employees.createAndAddModel({id: 1, name: 'Lina'});
        companies.createAndAddModel({id: 1, name: 'joinbox', id_employees: [ 1 ]});
        companies.resolveHasManyRelation(relations[0]);

        assert.equal(companies.getModels()[0].get('employees')[0].get('name'), 'Lina');
    });




    section.test('findModels', async() => {
        const companies = new Collection({
            name: 'company',
            ModelConstructor: Model,
        });

        companies.createAndAddModel({id: 1, name: 'joinbox'});
        companies.createAndAddModel({id: 2, name: 'rainbow industries'});

        assert.equal(companies.findModels('id', 2)[0].get('id'), 2);
        assert.equal(companies.findModels('id', 3).length, 0);
        assert.equal(companies.findModels('id', 1).length, 1);
    });




    section.test('findModels by indices', async() => {
        const companies = new Collection({
            name: 'company',
            ModelConstructor: Model,
            indices: ['id', 'name'],
        });

        companies.createAndAddModel({id: 1, name: 'joinbox'});
        companies.createAndAddModel({id: 2, name: 'rainbow industries'});
        companies.createAndAddModel({id: 3, name: 'infect'});
        companies.createAndAddModel({id: 4, name: 'infect'});

        assert.equal(companies.findModels('id', 2)[0].get('id'), 2);
        assert.equal(companies.findModels('id', 5).length, 0);
        assert.equal(companies.findModels('id', 1).length, 1);

        assert.equal(companies.findModels('name', 'joinbox')[0].get('name'), 'joinbox');
        assert.equal(companies.findModels('name', 'nope').length, 0);
        assert.equal(companies.findModels('name', 'rainbow industries').length, 1);

        assert.equal(companies.findModels('name', 'infect').length, 2);
        assert.equal(companies.findModels('name', 'infect')[0].get('id'), 3);
        assert.equal(companies.findModels('name', 'infect')[1].get('id'), 4);
    });



    section.test('filter in place', async() => {
        const companies = new Collection({
            name: 'company',
            ModelConstructor: Model,
            indices: ['id', 'name'],
        });

        companies.createAndAddModel({id: 1, name: 'joinbox'});
        companies.createAndAddModel({id: 2, name: 'rainbow industries'});
        companies.createAndAddModel({id: 3, name: 'infect'});
        companies.createAndAddModel({id: 4, name: 'infect'});

        companies.filter('name', 'infect', true);

        assert.equal(companies.getModels().length, 2);
        assert.equal(companies.getModels()[0].get('id'), 3);
        assert.equal(companies.getModels()[1].get('id'), 4);
    });



    section.test('filter', async() => {
        const companies = new Collection({
            name: 'company',
            ModelConstructor: Model,
            indices: ['id', 'name'],
        });

        companies.createAndAddModel({id: 1, name: 'joinbox'});
        companies.createAndAddModel({id: 2, name: 'rainbow industries'});
        companies.createAndAddModel({id: 3, name: 'infect'});
        companies.createAndAddModel({id: 4, name: 'infect'});

        const filteredCompanies = companies.filter('name', 'infect');

        assert.equal(filteredCompanies.getModels().length, 2);
        assert.equal(filteredCompanies.getModels()[0].get('id'), 3);
        assert.equal(filteredCompanies.getModels()[1].get('id'), 4);

        assert.equal(companies.getModels().length, 4);
    });
});