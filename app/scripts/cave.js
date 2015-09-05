import $ from "jquery";
import PubSub from "./pubsub";
import {TradeApiClient} from "./trade-api-client";

var botNames = [
        'Hayley Hồ Huyền', 
        'Maria Ốc Hương', 
        'Lolita Hương Ly', 
        'Kelly Kim Linh', 
        'Jennifer Huệ', 
        'Tiffany Hồng Thuý',
        'Courtney Hạnh'],
    username, password, vtosKeys,

    getBotName = function() {
        var index = Math.round(Math.random() * botNames.length);
        console.log(index);
        return botNames[index];
    },

    welcome = function() {
        PubSub.publish('/fulfilled', {
            status: 'good',
            message: 'Chào mừng quý khách đến với dịch vụ giao dịch qua chat của VNDIRECT! Em tên là ' + getBotName() + '. Em rất hân hạnh được phục vụ quý khách ngày hôm nay.'
        });
    },

    listenToHuman = function() {
        PubSub.subscribe('/human-raw', function(data) {
            console.log(data, username, password);
            if (!username) {
                setUsername(data.message);
                askForPassword();
            } else if (!password) {
                setPassword(data.message);
                login(username, password);
            } else if (!vtosKeys[0]) {
                setVtosKey(0, data.message);
            } else if (!vtosKeys[1]) {
                setVtosKey(1, data.message);
            } else if (!vtosKeys[2]) {
                setVtosKey(2, data.message);
            } else { // logged in and vtos-authenticated successfully
                PubSub.publish('/human', {
                    loggedIn: true,
                    vtosed: true,
                    message: data.message
                });
            }
        });
    },

    askForUsername = function() {
        PubSub.publish('/fulfilled', {
            status: 'good',
            message: 'Để bắt đầu, quý khách có thể vui lòng cho em xin tên đăng nhập được không ạ?'
        });
    },

    setUsername = function(input) {
        username = input;
    },

    askForPassword = function() {
        PubSub.publish('/fulfilled', {
            status: 'good',
            message: 'Cám ơn quý khách. Mật khẩu của quý khách là gì ạ?'
        });
    },

    setPassword = function(input) {
        password = input;
    },

    login = function(username, password) {
        PubSub.publish('/fulfilled', {
            status: 'good',
            message: 'Cám ơn quý khách ạ. Em sẽ thử đăng nhập vào hệ thống cho quý khách bây giờ ạ.'
        });
    },

    askToVtos = function() {
        
    };

module.exports = {
    init: function() {
        var thisClient = new TradeApiClient();
        vtosKeys = [];

        welcome();
        askForUsername();
        listenToHuman();
    }
}