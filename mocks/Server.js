import express from 'express';

import ArticleController from './controller/Article.js';
import CommitteeController from './controller/Committee.js';
import MailConfigController from './controller/MailConfig.js';
import MemberStatusController from './controller/MemberStatus.js';
import PortfolioController from './controller/Portfolio.js';
import SubscriptionController from './controller/Subscription.js';
import UserController from './controller/User.js';


export default class Server {


    constructor() {
        this.controllers = new Map();
        this.app = express();
    }



    async listen(port) {
        this.port = port;
        this.serverInstance = await this.app.listen(this.port);
    }



    getPort() {
        return this.port;
    }



    getServer() {
        return this.app;
    }




    async load() {
        this.controllers.set('article', new ArticleController());
        this.controllers.set('committee', new CommitteeController());
        this.controllers.set('mailConfig', new MailConfigController());
        this.controllers.set('Portfolio', new PortfolioController());
        this.controllers.set('subscription', new SubscriptionController());
        this.controllers.set('user', new UserController());
        this.controllers.set('memberStatus', new MemberStatusController());

        for (const controller of this.controllers.values()) {
            controller.setup(this.getServer());
        }
    }




    async close() {
        await this.serverInstance.close();
    }
}