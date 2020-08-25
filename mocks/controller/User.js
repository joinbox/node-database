

export default class UserController {



    async list(request, response) {
        response.status(200)
            .set('content-type', 'application/json')
            .send(JSON.stringify([{
                id: 1,
                email: 'lina@joinbox.com',
                subscriptionIds: [ 1 ],
                committeeIds: [ 1 ],
                memberStatusIds: [ 1 ],
                portfolioIds: [ 1 ],
            }]));
    }




    setup(server) {
        server.get('/user', (request, response) => {
            this.list(request, response);
        });
    }
}