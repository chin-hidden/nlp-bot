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
            url: AUTH_URL + '/auth',
            method: "POST",
            data: JSON.stringify({username: username, password: password})

        }).then(function(data) {
            $.ajaxSetup({
                headers: {'X-AUTH-TOKEN': data.token}
            });
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

    getVtosChallenges() {
        return $.ajax({
            url: AUTH_URL + '/vtos',
            method: 'GET',
        });
    };

    postVtosAnswer(keys) {
        return $.ajax({
            url: AUTH_URL + '/vtos/auth',
            method: 'POST',
            data: JSON.stringify({
                codes: keys.join(',')
            })

        }).then(function(data) {
            console.log(data);
        });
    }
}
