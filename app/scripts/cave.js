import $ from "jquery";
import PubSub from "./pubsub";
import {TradeApiClient} from "./trade-api-client";

var 
    welcome = function() {
        PubSub.publish('/fulfilled', {
            status: 'good',
            message: 'Xin chào! Tài khoản của quý khách là gì ạ?'
        });
    };

module.exports = {
    init: function() {
        var thisClient = new TradeApiClient();
        welcome();
    }
}