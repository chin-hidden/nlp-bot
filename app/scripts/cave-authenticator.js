import {TradeApiClient} from "./trade-api-client";
import PubSub from "./pubsub";
import Util from "./util";

var username, password, vtosKeys, vtosChallenges, vtosAttemptCount, tradeApiHelper, accountNo, pPower,

    speak = function(status, message) {
        PubSub.publish('/fulfilled', {
            status: status,
            message: message
        });
    },

    askForUsername = function() {
        speak('good', 'Để thực hiện yêu cầu này, mình cần phải đăng nhập trước ạ. Quý khách có thể vui lòng cho em xin <strong>tên đăng nhập</strong> với ạ?');
    },

    setUsername = function(input) {
        username = input;
    },

    askForPassword = function() {
        speak('good', 'Cám ơn quý khách. <strong>Mật khẩu</strong> của quý khách là gì ạ?');
    },

    setPassword = function(input) {
        password = input;
    },

    login = function(inputUsername, inputPassword) {
        speak('good', 'Cám ơn quý khách ạ. Em sẽ thử đăng nhập vào hệ thống cho quý khách bây giờ, vui lòng đợi em chút xíu ạ.');

        tradeApiHelper.login(inputUsername, inputPassword)

            .then(function() {
                return $.when(tradeApiHelper.loadCustomer(), tradeApiHelper.loadAccounts());
            })

            .done(function(customerRes, accountsRes) {
                accountNo = customerRes[0].accounts[0].accountNumber;
                pPower = accountsRes[0].accounts[0].purchasePower;
                speak('good', `Đăng nhập thành công rồi ạ! Chào mừng quý khách <strong>${customerRes[0].customerName}</strong> đến với VNDIRECT. Số tài khoản của quý khách là <strong>${accountNo}</strong>, sức mua là <strong>${Util.addCommasToNumber(pPower)}‎₫</strong>.`);
                vtosAttemptCount = 0;
                askForVtosKey(0);

            }).fail(function() {
                speak('bad', 'Hình như tên đăng nhập hoặc mật khẩu của quý khách bị sai rồi ạ. Quý khách có thể cho em xin lại tên đăng nhập được không ạ?');
                username = undefined;
                password = undefined;
            });
    },

    askForVtosKey = function(index) {
        if ((index == 0) && (vtosAttemptCount == 0)) {
            speak('good', 'Để đảm bảo an toàn trong giao dịch trực tuyến, quý khách cần xác nhận mã thẻ VTOS. Quý khách vui lòng chuẩn bị sẵn thẻ VTOS giúp em ạ. Hệ thống sẽ hỏi quý khách 3 ô trên thẻ VTOS của quý khách.');

            tradeApiHelper.getVtosChallenges().done(function(data) {
                vtosChallenges = data.challenges;
                speak('good', `Thẻ của quý khách có số sê-ri là <strong>${data.serial}</strong>.`);
                speak('good', `Chữ số ở vị trí <strong>${vtosChallenges[0]}</strong> trên thẻ VTOS của quý khách là gì ạ?`);
            });

        } else {
           speak('good', `Chữ số ở vị trí <strong>${vtosChallenges[index]}</strong> trên thẻ VTOS của quý khách là gì ạ?`);
        }
    },

    setVtosKey = function(index, value) {
        if (value.trim().length != 1) {
            speak('bad', `Dạ, quý khách chỉ cần viết đúng một ký tự ở ô tương ứng trên thẻ VTOS. Mời quý khách thử lại ạ.`);
            return false;
        } else {
            vtosKeys[index] = value;
            return true;
        }
    },

    authenticateVtos = function() {
        vtosAttemptCount++;
        tradeApiHelper.postVtosAnswer(vtosKeys).done(function(data) {
            speak('good', 'Quý khách đã xác nhận thẻ VTOS thành công!');
            publishAuthDone();
        }).fail(function() {
            speak('bad', 'Xác nhận thẻ VTOS không thành công. Mình thử lại nhé ạ.');
            vtosKeys = [];
            askForVtosKey(0);
        });
    },

    publishAuthDone = function() {
        PubSub.publish('/authenticated', {
            accountNo: accountNo
        });
    };

module.exports = {
    init: function(helper) {
        tradeApiHelper = helper;
        vtosKeys = [];
    },

    authenticate: function(data) {
        if (typeof data === 'undefined') {
            askForUsername();
            return false;
        }

        if (!username) {
            setUsername(data.message);
            askForPassword();
            return false;

        } else if (!password) {
            setPassword(data.message);
            login(username, password);
            return false;

        } else if (!vtosKeys[0]) {
            if (setVtosKey(0, data.message))
                askForVtosKey(1);
            return false;

        } else if (!vtosKeys[1]) {
            if (setVtosKey(1, data.message))
                askForVtosKey(2);
            return false;

        } else if (!vtosKeys[2]) {
            if (setVtosKey(2, data.message)) {
                authenticateVtos();
            }
            return false;

        } else { // logged in and vtos-authenticated successfully
            publishAuthDone();
            return true;
        }
    }
}
