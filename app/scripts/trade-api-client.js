import $ from "jquery";
import DISPATCHER from "./pubsub";

var TRADE_URL = 'https://trade-api.vndirect.com.vn';
var AUTH_URL = 'https://auth-api.vndirect.com.vn';

export class TradeApiClient {

    constructor() {
        $.ajaxSetup({
            dataType: 'json',
            contentType: 'application/json'
        });
    };

    login(username, password) {
        return $.ajax({
            url: AUTH_URL + "/auth",
            method: "POST",
            data: JSON.stringify({username: username, password: password})
        }); /* .done((data) => {
            this.accessToken = data.token;
            DISPATCHER.publish("/fulfilled", {
                type: "login-ok"
            });
        }).fail(() => {
            DISPATCHER.publish("/fulfilled", {
                type: "login-failed"
            });
        }); */
    };

}
