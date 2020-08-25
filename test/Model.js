import section from 'section-tests';
import { Model } from '../index.js';
import assert from 'assert';


section('Model', (section) => {
    section.test('setData', async() => {
        const model = new Model({
            name: 'user',
        });

        model.setData({id: 5, name: 'lina'});

        assert(model.data.has('id'));
        assert.equal(model.data.get('id'), 5);
    });

    section.test('getData', async() => {
        const model = new Model({
            name: 'user',
        });

        model.setData({id: 5, name: 'lina'});
        assert.equal(model.getData().id, 5);
    });

    section.test('set', async() => {
        const model = new Model({
            name: 'user',
        });

        model.set('name', 'lina');
        assert.equal(model.data.get('name'), 'lina');
    });

    section.test('get', async() => {
        const model = new Model({
            name: 'user',
        });

        model.set('name', 'lina');
        assert.equal(model.get('name'), 'lina');
    });

    section.test('has', async() => {
        const model = new Model({
            name: 'user',
        });

        model.set('name', 'lina');
        assert.equal(model.has('name'), true);
        assert.equal(model.has('id'), false);
    });
});