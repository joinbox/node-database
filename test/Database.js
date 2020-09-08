import section from 'section-tests';
import assert from 'assert';

import MockServer from '../mocks/Server.js';
import Database, { Model, Collection, RESTDataLoader } from '../index.js';


section('Database', (section) => {
    section.test('setup', async() => {
        const database = new Database({
            name: 'scheduler',
            dataModelDefintion: [{
                name: 'subscription',
                dataLoader: {
                    type: 'RESTDataLoader',
                    config: {
                        hostname: 'https://l.dns.porn:2341',
                        pathname: '/subscription',
                    },
                },
                model: {
                    type: 'Model',
                },
                collection: {
                    type: 'Collection',
                },
            }]
        });

        database.registerDataLoader('RESTDataLoader', RESTDataLoader);
        database.registerModel('Model', Model);
        database.registerCollection('Collection', Collection);

        await database.setup();
        assert.equal(database.collections.size, 1);

    });


    section.test('load', async() => {
        const database = new Database({
            name: 'scheduler',
            dataModelDefintion: [{
                name: 'subscription',
                dataLoader: {
                    type: 'RESTDataLoader',
                    config: {
                        hostname: 'http://l.dns.porn:12434',
                        pathname: '/subscription',
                    },
                },
                model: {
                    type: 'Model',
                },
                collection: {
                    type: 'Collection',
                },
            }]
        });

        database.registerDataLoader('RESTDataLoader', RESTDataLoader);
        database.registerModel('Model', Model);
        database.registerCollection('Collection', Collection);

        await database.setup();

        const server = new MockServer();
        await server.load();
        await server.listen(12434);

        await database.load();
        await server.close();

        assert.equal(database.get('subscription').length, 1);
        await section.wait(20);
    });




    section.test('load with relations', async() => {
        const database = new Database({
            name: 'scheduler',
            dataModelDefintion: [{
                name: 'subscription',
                dataLoader: {
                    type: 'RESTDataLoader',
                    config: {
                        hostname: 'http://l.dns.porn:5326',
                        pathname: '/subscription',
                    },
                },
                model: {
                    type: 'Model',
                },
                collection: {
                    type: 'Collection',
                    relations: [{
                        type: 'belongsToMany',
                        collection: 'user',
                        ourKey: 'id',
                        theirKey: 'subscriptionIds',
                        name: 'users'
                    }]
                },
            }, {
                name: 'user',
                dataLoader: {
                    type: 'RESTDataLoader',
                    config: {
                        hostname: 'http://l.dns.porn:5326',
                        pathname: '/user',
                    },
                },
                model: {
                    type: 'Model',
                },
                collection: {
                    type: 'Collection',
                    relations: [{
                        type: 'hasMany',
                        collection: 'subscription',
                        ourKey: 'subscriptionIds',
                        theirKey: 'id',
                        name: 'subscriptions',
                    }]
                },
            }]
        });

        database.registerDataLoader('RESTDataLoader', RESTDataLoader);
        database.registerModel('Model', Model);
        database.registerCollection('Collection', Collection);

        await database.setup();

        const server = new MockServer();
        await server.load();
        await server.listen(5326);

        await database.load();
        await server.close();

        assert.equal(database.get('user').getModels()[0].get('subscriptions').length, 1);
        assert.equal(database.get('subscription').getModels()[0].get('users').length, 1);
        await section.wait(20);
    });
});