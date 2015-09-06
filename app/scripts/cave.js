import $ from "jquery";
import _ from "underscore";
import PubSub from "./pubsub";
import {TradeApiClient} from "./trade-api-client";
import {INTENT} from "./parser";

var botNames = [
        'Hayley Hồ Huyền',
        'Maria Ốc Hương',
        'Lolita Hương Ly',
        'Kelly Kim Linh',
        'Jennifer Huệ',
        'Tiffany Hồng Thuý',
        'Courtney Hạnh'],
    username, password, vtosKeys, vtosChallenges, vtosAttemptCount, botIndex,
    tradeApiHelper, accountNo, pPower,
    state = {},

    getBotName = function() {
        botIndex = Math.floor(Math.random() * botNames.length);
        return botNames[botIndex];
    },

    addCommasToNumber = function(number) {
        return parseInt(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    speak = function(status, message) {
        PubSub.publish('/fulfilled', {
            status: status,
            message: message,
            botIndex: botIndex
        });
    },

    resetState = function() {
        state = {
            currentOperation: undefined,
            orderDetail: {
                side: undefined,
                amount: undefined,
                symbol: undefined,
                price: undefined
            }
        };
    },

    welcome = function() {
        speak('good', `Chào mừng quý khách đến với dịch vụ giao dịch qua chat của VNDIRECT! Em tên là ${getBotName()}. Em rất hân hạnh được phục vụ quý khách ngày hôm nay.`);
    },

    listenToParser = function() {
        PubSub.subscribe('/processed', function(event) {
            if (event.status === "ok") {
                if (event.message.intent === INTENT.CONFIRM) {
                    speak('good', "Vâng, em đang thực hiện lệnh của quý khách ngay đây ạ!");
                } else if (event.message.intent === INTENT.DENY) {
                    speak('good', "Vâng, tùy quý khách ạ!");
                    resetState();
                } else if (event.message.intent === INTENT.GREETING) {
                    speak('good', "Xin kính chào quý khách!");
                } else if (event.message.intent === INTENT.GET_ATTENTION) {
                    speak('good', "Vâng, thưa quý khách!");
                } else if (event.message.intent === INTENT.PLACE_ORDER) {
                    state.currentOperation = event.message.intent;

                    _.extend(state.orderDetail, event.message);
                    placeOrder();
                } else if (event.message.intent === INTENT.UPDATE_INFO) {
                    if (state.currentOperation === INTENT.PLACE_ORDER) {
                        if (_.contains(["amount", "price"], state.weAreAskingFor)) {
                            state.orderDetail[state.weAreAskingFor] = event.message.amount;
                        } else {
                            state.orderDetail[state.weAreAskingFor] = event.message[state.weAreAskingFor];
                        }

                        placeOrder();
                    }
                }
            } else {
                speak('bad', 'Xin lỗi, em không hiểu. Quý khách muốn đặt lệnh, sửa lệnh, xóa lệnh hay làm gì ạ?');
            }
        });
    },

    missingOrderFields = function() {
        return _.chain(state.orderDetail)
            .pairs()
            .filter((pair) => pair[1] === undefined)
            .unzip()
            .first()
            .value();
    },

    orderFieldName = function(field) {
        return {
            "side": "mua hay bán",
            "price": "giá",
            "amount": "số lượng",
            "symbol": "mã chứng khoán"
        }[field];
    },

    placeOrder = function() {
        if (_.every(state.orderDetail, _.identity)) {
            speak('good', `Quý khách muốn ${state.orderDetail.side}
                    ${state.orderDetail.amount} mã ${state.orderDetail.symbol}
                    với giá ${state.orderDetail.price} phải không ạ?`);
        } else {
            state.weAreAskingFor = missingOrderFields()[0];
            var missingFieldName = orderFieldName(state.weAreAskingFor);

            speak('bad', `Xin quý khách nêu rõ thêm ${missingFieldName} nữa ạ.`);
        }
    },

    listenToHuman = function() {
        PubSub.subscribe('/human-raw', function(data) {
            if (!username) {
                setUsername(data.message);
                askForPassword();

            } else if (!password) {
                setPassword(data.message);
                login(username, password);

            } else if (!vtosKeys[0]) {
                if (setVtosKey(0, data.message))
                    askForVtosKey(1);

            } else if (!vtosKeys[1]) {
                if (setVtosKey(1, data.message))
                    askForVtosKey(2);

            } else if (!vtosKeys[2]) {
                if (setVtosKey(2, data.message))
                    authenticateVtos();

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
        speak('good', 'Để bắt đầu, quý khách có thể vui lòng cho em xin <strong>tên đăng nhập</strong> được không ạ?');
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
                speak('good', `Đăng nhập thành công rồi ạ! Chào mừng quý khách <strong>${customerRes[0].customerName}</strong> đến với VNDIRECT. Số tài khoản của quý khách là <strong>${accountNo}</strong>, sức mua là <strong>${addCommasToNumber(pPower)}‎₫</strong>.`);
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
        console.log(vtosKeys);
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
            speak('good', 'Hệ thống giao dịch đã sẵn sàn. Bây giờ quý khách cần làm gì ạ?');
        }).fail(function() {
            speak('bad', 'Xác nhận thẻ VTOS không thành công. Mình thử lại nhé ạ.');
            vtosKeys = [];
            askForVtosKey(0);
        });
    };

module.exports = {
    init: function() {
        resetState();

        tradeApiHelper = new TradeApiClient();
        vtosKeys = [];

        welcome();
        askForUsername();
        listenToHuman();
        listenToParser();
    }
}
