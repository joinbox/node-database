import APIClient from '../APIClient.js';



export default class DataLoader extends APIClient {

    async load() {
        return this.get();
    }
}