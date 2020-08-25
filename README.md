# Node-Database

A simple in-memory database abstraction for consuming relational data sources

Features:
- Read-only implementations for Databases, Collections and Models
- Loading of data using over HTTP for RESTful JSON and SOAP resources
- Refreshing data from the data source
- Data Model definition standard
- Relation resolution between models: hasMany and belongsToMany
- Injection of custom data loaders for implementing alternative protocols
- Injection of custom Model implementations
- Injection of custom Collection implementations


# API

A Database has many collections containing each one type of Models. The database accepts a data model definition as a
parameter of its constructor. The data model definition defines which models can be loaded from where and which relations
they have between each other.



## Data Model Definition

The data model definition consists of an array describing the different entities of the database. Each entity can 
implement different data loaders, models and collections so that the database can be composed of different data sources
using different functionality.


```Javascript
const dataModelDefintion = [{
    // name of the entity
    name: 'user',

    // define which data loader to use for the data of this entity, pass it's configuration
    dataLoader: {
        type: 'DataLoader',
        config: {
            hostname: 'https://l.dns.porn:2341',
            pathname: '/user',
        },
    },

    // define which model implementation to use for this entity
    model: {
        type: 'Model',
    },

    // define which collection implementation to use for this entity
    collection: {
        type: 'Collection',

        // define here all relations between the collections
        relations: [{
            // the type of relation
            type: 'hasMany',

            // the collection this relations relates to
            collection: 'company',

            // the key on the other collection this collection is referring to
            theirKey: 'id',

            // the key on our collection that contains the matching key to the other collection
            ourKey: 'companyIds',

            // the name of the property where the references models are stored on
            name: 'companies',
        }],
    },
}, {
    name: 'companyIds',
    dataLoader: {
        type: 'DataLoader',
        config: {
            hostname: 'https://l.dns.porn:2341',
            pathname: '/company',
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
            theirKey: 'companyIds',
            ourKey: 'id',
            name: 'users',
        }],
    },
}];
```




## Database Class

### Database constructor

The database class is used to set up a full database. It's the main interface for loading the classes, the data model
definition and the data.


```Javascript
// set up the database using the data model definition defined above
import Database from '@joinbox/node-database';

const database = new Database({
    name: 'users',
    dataModelDefintion,
});
```



### database.registerModel(name, Constructor), database.registerDataLoader(name, Constructor), database.registerCollection(name, Constructor) methods

After instantiating the database, you may inject your custom DataLoader, Model and Collection implementations. We're 
going to use the built in ones for now.

```Javascript
// set up the database using the data model definition defined above
import {
    Collection,
    Model,
    DataLoader,
} from '@joinbox/node-database';

// the first argument of the register functions is the name of the component as it's defined in the data model 
// definition
database.registerDataLoader('DataLoader', DataLoader);
database.registerModel('Model', Model);
database.registerCollection('Collection', Collection);
```



### database.setup() and database.load() methods

Now it's time to set up the database and load the data. The Setup method compiles the data model definition and builds 
the required infrastructure while the the load method loads the data from the remote source.


```Javascript
await database.setup();
await database.load();
```


After those two calls were issued, the database is ready for use.


### database.reload() method

This method reloads all data from the data source. At it's current state it does not refresh the data inside of the 
models but replaces them all with newly created models.


### database.has(collectionName) method

Checks if a collection is part of the database

### database.get(collectionName) method

Gets a collection from the database




## Collection Class

A collection represents an entity and contains N models.


### collection.addModel(modelInstance) method

A private member for adding model instances to the collection


### collection.createAndAddModel(dataObject) method

A private member for adding a model by passing the data for the model


### collection.setModels(modelArray) method

A private member for replacing all models on the collection


### collection.getModels() method

Returns all models from the collection as an array


### collection.deleteModel(modelInstance) method

Removes the model passed as parameter from the collection 


### collection.hasModel(modelInstance) method

Checks if the given model is part of the collection


### collection.findModel(propertyName, propertyValue) method

Finds the first model matching the parameters


### collection.findById(propertyValue) method

Finds the first model matching the passed id



## Model class

A model represents one instance of an entity


### model.setData(dataObject) method

Replaces all data on the model with the data passed to the method


### model.getData() method

Returns all data of the model as object


### model.set(propertyName, value) method

Sets the data of one property


### model.get(propertyName) method

Returns the value of one property


### model.has(propertyName) method

Checks if a property was set. Returns also true if the value is falsy (null, undefined, false, 0)



## Implementing your own Models, Collections or DataLoaders

Please have a look at the following classes which you can extend and inject to the database using the register* method
of the database class:

- ./src/model/Model.js
- ./src/collection/Collections.js
- ./src/loader/DataLoaders.js



## Debugging and Logging


You may us the extended loggin features of logd to print logs. In order to do so, you have to add the following code
to the main file of your application:

```Javascript
import logd from 'logd';
import ConsoleTransport from 'logd-console-transport';

logd.transport(new ConsoleTransport());
```

When starting the application, you may configure the logger to print logs of different levels via command line parameters
- `--l` log everything
- `--log-level=debug+` log all level from debug upwards (you may also use the levels `info`, `warn` and `error`)
- `--log-module=moduleName` log only logs from a given module (the name is printed in violet)
