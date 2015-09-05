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
    username, password, vtosKeys, vtosChallenges, vtosAttemptCount,
    tradeApiHelper, 
    state = {},

    getBotName = function() {
        var index = Math.round(Math.random() * botNames.length);
        console.log(index);
        return botNames[index];
    },

    welcome = function() {
        PubSub.publish('/fulfilled', {
            status: 'good',
            message: `Chào mừng quý khách đến với dịch vụ giao dịch qua chat của VNDIRECT! Em tên là ${getBotName()}. Em rất hân hạnh được phục vụ quý khách ngày hôm nay.`
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

    listenToParser = function() {
        PubSub.subscribe('/processed', function(event) {
            console.log(state);
            if (event.status === "ok") {
                if (event.message.intent === INTENT.CONFIRM) {
                    PubSub.publish('/fulfilled', {
                        status: 'good',
                        message: "Vâng, em đang thực hiện lệnh của quý khách ngay đây ạ!"
                    });
                } else if (event.message.intent === INTENT.DENY) {
                    PubSub.publish('/fulfilled', {
                        status: 'good',
                        message: "Vâng, tùy quý khách ạ!"
                    });
                    resetState();
                } else if (event.message.intent === INTENT.GREETING) {
                    PubSub.publish('/fulfilled', {
                        status: 'good',
                        message: "Xin kính chào quý khách!"
                    });
                } else if (event.message.intent === INTENT.GET_ATTENTION) {
                    PubSub.publish('/fulfilled', {
                        status: 'good',
                        message: "Vâng, thưa quý khách!"
                    });
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
                PubSub.publish('/fulfilled', {
                    status: 'bad',
                    message: 'Xin lỗi, em không hiểu. Quý khách muốn đặt lệnh, sửa lệnh, xóa lệnh hay làm gì ạ?'
                });
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
            "price": "giá",
            "amount": "số lượng",
            "symbol": "mã chứng khoán"
        }[field];
    },

    placeOrder = function() {
        if (_.every(state.orderDetail, _.identity)) {
            PubSub.publish('/fulfilled', {
                status: 'good',
                message: `Quý khách muốn ${state.orderDetail.side}
                    ${state.orderDetail.amount} mã ${state.orderDetail.symbol}
                    với giá ${state.orderDetail.price} phải không ạ?`
            });
        } else {
            state.weAreAskingFor = missingOrderFields()[0];
            var missingFieldName = orderFieldName(state.weAreAskingFor);

            PubSub.publish('/fulfilled', {
                status: 'bad',
                message: `Xin quý khách nêu rõ thêm ${missingFieldName} nữa ạ.`
            });
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
                setVtosKey(0, data.message);
                askForVtosKey(1);

            } else if (!vtosKeys[1]) {
                setVtosKey(1, data.message);
                askForVtosKey(2);

            } else if (!vtosKeys[2]) {
                setVtosKey(2, data.message);
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

    login = function(inputUsername, inputPassword) {
        PubSub.publish('/fulfilled', {
            status: 'good',
            message: 'Cám ơn quý khách ạ. Em sẽ thử đăng nhập vào hệ thống cho quý khách bây giờ ạ.'
        });

        tradeApiHelper.login(inputUsername, inputPassword)
            .done(function() {
                PubSub.publish('/fulfilled', {
                    status: 'good',
                    message: 'Quý khách đã đăng nhập thành công!'
                });
                vtosAttemptCount = 0;
                askForVtosKey(0);

            }).fail(function() {
                PubSub.publish('/fulfilled', {
                    status: 'bad',
                    message: 'Hình như tên đăng nhập hoặc mật khẩu của quý khách bị sai rồi ạ. Quý khách có thể cho em xin lại tên đăng nhập được không ạ?'
                });
                username = undefined;
                password = undefined;
            });
    },

    askForVtosKey = function(index) {
        if ((index == 0) && (vtosAttemptCount == 0)) {
            PubSub.publish('/fulfilled', {
                status: 'good',
                message: 'Để đảm bảo an toàn trong giao dịch trực tuyến, quý khách cần xác nhận mã thẻ VTOS. Quý khách vui lòng chuẩn bị sẵn thẻ VTOS giúp em ạ. Hệ thống sẽ hỏi quý khách 3 ô trên thẻ VTOS của quý khách.'
            });
            tradeApiHelper.getVtosChallenges().done(function(data) {
                vtosChallenges = data.challenges;
                PubSub.publish('/fulfilled', {
                    status: 'good',
                    message: `Thẻ của quý khách có mã số là <strong>${data.serial}</strong>.`
                });
                PubSub.publish('/fulfilled', {
                    status: 'good',
                    message: `Chữ số ở vị trí <strong>${vtosChallenges[0]}</strong> trên thẻ VTOS của quý khách là gì ạ?`
                });
            });

        } else {
            PubSub.publish('/fulfilled', {
                status: 'good',
                message: `Chữ số ở vị trí <strong>${vtosChallenges[index]}</strong> trên thẻ VTOS của quý khách là gì ạ?`
            });
        }
    },

    setVtosKey = function(index, value) {
        vtosKeys[index] = value;
    },

    authenticateVtos = function() {
        vtosAttemptCount++;
        tradeApiHelper.postVtosAnswer(vtosKeys).done(function(data) {
            PubSub.publish('/fulfilled', {
                status: 'good',
                message: 'Quý khách đã xác nhận thẻ VTOS thành công!'
            });
            PubSub.publish('/fulfilled', {
                status: 'good',
                message: 'Hệ thống giao dịch đã sẵn sàn. Bây giờ quý khách cần làm gì ạ?'
            });
        }).fail(function() {
            PubSub.publish('/fulfilled', {
                status: 'bad',
                message: 'Xác nhận thẻ VTOS không thành công. Mình thử lại nhé ạ.'
            });
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
