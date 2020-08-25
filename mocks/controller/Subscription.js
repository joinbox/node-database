

export default class SubscriptionController {



    async list(request, response) {
        response.status(200)
            .set('content-type', 'application/json')
            .send(JSON.stringify([{
                id: 1,
                name: 'test',
            }]));
    }




    setup(server) {
        server.get('/subscription', (request, response) => {
            this.list(request, response);
        });
    }
}