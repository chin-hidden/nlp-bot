import $ from "jquery";
import _ from "underscore";
import PubSub from "./pubsub";
import {TradeApiClient} from "./trade-api-client";
import {INTENT, ORDER_SIDE} from "./parser";
import Authenticator from "./cave-authenticator";
import Banter from "./cave-banter";
import TradeApiErrors from "./trade-api-errors";
import {addCommasToNumber} from "./util";
import Util from "./util";

var botNames = [
        'Hayley Hồ Huyền',
        'Maria Ốc Hương',
        'Lolita Hương Ly',
        'Kelly Kim Linh',
        'Jennifer Huệ',
        'Tiffany Hồng Thuý',
        'Courtney Hạnh'],
    username, password, vtosKeys, vtosChallenges, vtosAttemptCount,
    tradeApiHelper, accountNo,
    convoState = {},

    getBotName = function() {
        var botIndex = Math.floor(Math.random() * botNames.length);
        PubSub.publish('/set-bot', {
            botIndex: botIndex
        });
        return botNames[botIndex];
    },

    speak = function(status, message) {
        PubSub.publish('/fulfilled', {
            status: status,
            message: message
        });
    },

    resetState = function() {
        convoState = {
            currentOperation: undefined,
            orderDetail: {
                side: undefined,
                amount: undefined,
                symbol: undefined,
                price: undefined,
            },
            confirmed: undefined
        };
    },

    welcome = function() {
        speak('good', `Chào mừng quý khách đến với dịch vụ giao dịch qua chat của VNDIRECT! Em tên là ${getBotName()}. Em rất hân hạnh được phục vụ quý khách ngày hôm nay.`);
    },

    listenToParser = function() {
        PubSub.subscribe('/processed', function(event) {
            if (event.status === "ok") {
                if (event.message.intent === INTENT.CONFIRM) {
                    if (convoState.currentOperation === INTENT.PLACE_ORDER) {
                        if (progressPlaceOrderOp(event)) {
                            speak('good', 'Cảm ơn quý khách, em hiểu rồi ạ.');
                            Authenticator.authenticate();
                        }
                    } else if (typeof convoState.currentOperation === 'undefined') {
                        speak('good', 'Dạ, em đây ạ.');
                    }

                } else if (event.message.intent === INTENT.DENY) {
                    speak('good', "Vâng, tùy quý khách ạ!");
                    resetState();
                } else if (event.message.intent === INTENT.GREETING) {
                    speak('good', "Dạ, em xin kính chào quý khách! Em có thể giúp gì cho quý khách ạ?");
                } else if (event.message.intent === INTENT.ASK_FOR_HELP) {
                    speak('good', "Dạ, hiện tại em mới chỉ biết đặt lệnh thôi ạ.");
                } else if (event.message.intent === INTENT.GET_ATTENTION ||
                           event.message.intent === INTENT.SEEK_REAFFIRM) {
                    speak('good', "Vâng, thưa quý khách!");
                } else if (event.message.intent === INTENT.PLACE_ORDER) {
                    convoState.currentOperation = event.message.intent;
                    _.extend(convoState.orderDetail, event.message);
                    progressPlaceOrderOp(event);
                } else if (event.message.intent === INTENT.LAUGHING) {
                    speak('good', "Hohohohoho!");
                } else if (event.message.intent === INTENT.UPDATE_INFO) {
                    if (convoState.currentOperation === INTENT.PLACE_ORDER) {
                        if (_.contains(["amount", "price"], convoState.weAreAskingFor)) {
                            convoState.orderDetail[convoState.weAreAskingFor] = event.message.amount;
                        } else {
                            convoState.orderDetail[convoState.weAreAskingFor] = event.message[convoState.weAreAskingFor];
                        }

                        if (convoState.weAreAskingFor === "price" && event.message.amount < 1000) {
                            convoState.orderDetail[convoState.weAreAskingFor] *= 1000;
                        }

                        progressPlaceOrderOp(event);
                    }
                } else if (event.message.intent === INTENT.VIEW_ORDER_LIST) {
                    convoState.currentOperation = event.message.intent;
                    convoState.confirmed = true;
                    Authenticator.authenticate();
                }

            } else { // parser fails to understand wtf user wanted
                speak('bad', 'Xin lỗi, em chưa hiểu ý quý khách. Quý khách vui lòng nói đơn giản hơn được không ạ?');
            }
        });
    },

    missingOrderFields = function() {
        return _.chain(convoState.orderDetail)
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

    // progress with the placing order operation,
    // return true when ready to go
    progressPlaceOrderOp = function(event) {
        if (_.every(convoState.orderDetail)) {
            if (!convoState.confirmed) {
                if (event.message.intent === INTENT.CONFIRM) {
                    convoState.confirmed = true;
                    return true;
                } else {
                    var side = convoState.orderDetail.side === ORDER_SIDE.BUYING ? "mua" : "bán";

                    speak('good', `Quý khách muốn <strong>${side}</strong>
                        khối lượng <strong>${convoState.orderDetail.amount}</strong> cổ phiếu mã <strong>${convoState.orderDetail.symbol.toUpperCase()}</strong>
                        với giá <strong>${addCommasToNumber(convoState.orderDetail.price)}‎₫</strong> phải không ạ?`);
                    return false;
                }
            } else {
                return true; // good to go!
            }
        } else {
            convoState.weAreAskingFor = missingOrderFields()[0];
            var missingFieldName = orderFieldName(convoState.weAreAskingFor);
            speak('bad', `Dạ vâng, xin quý khách cho em biết ${missingFieldName} nữa ạ.`);
            return false;
        }
    },

    listenToHuman = function() {
        PubSub.subscribe('/human-raw', function(data) {

            // check for banter, flirting and stupid shit user may say
            var banter = Banter.checkBanter(data.message);
            if (banter) {
                speak('good', banter);
                return;
            }

            // not sure what human is talking about.. let's ask parser
            if (!convoState.currentOperation || !convoState.confirmed) {
                PubSub.publish('/human', {
                    message: data.message
                });

            } else { // we know what user wants

                // let's authenticate them
                Authenticator.authenticate(data);
            }
        });
    },

    listenToAuthenticator = function() {
        PubSub.subscribe('/authenticated', function(data) {
            accountNo = data.accountNo;
            if (convoState.currentOperation === INTENT.PLACE_ORDER) {
                placeOrder();
            } else if (convoState.currentOperation === INTENT.VIEW_ORDER_LIST) {
                loadOrderbook();
            }
        });
    },

    placeOrder = function() {
        speak('good', 'Em đang thực hiện đặt lệnh vào hệ thống, quý khách chờ chút xíu ạ.');
        tradeApiHelper.placeOrder(accountNo, {
            side: (convoState.orderDetail.side === 'BUYING') ? 'NB' : 'NS',
            symbol: convoState.orderDetail.symbol.toUpperCase(),
            price: convoState.orderDetail.price,
            quantity: convoState.orderDetail.amount,
            orderType: 'LO'

        }).done(function(data) {
            speak('good', 'Lệnh đặt thành công rồi ạ!');
            loadOrderbook();
            resetState();

        }).fail(function(jqXHR) {
            speak('bad', 'Có lỗi rồi ạ.');
            speak('bad', TradeApiErrors.getMessage(jqXHR));
            resetState();
        });
    },

    loadOrderbook = function() {
        speak('good', 'Em đang kiểm tra các lệnh đặt trong ngày, quý khách chờ chút xíu ạ.');
        tradeApiHelper.loadOrderbook(accountNo).done(function(data) {
            data.orders.forEach(function(order) {
                var responseStr = `Quý khách có một lệnh ${order.side == 'NB' ? 'bán' : 'mua'} ${order.quantity} mã ${order.symbol} giá <em>${Util.addCommasToNumber(order.price)}‎₫, trạng thái ${order.status}</em>.`
                speak('good', responseStr);
            });
            if (data.orders.length == 0) {
                speak('good', 'Chưa có lệnh nào trong ngày hôm nay ạ.'); 
            }
            resetState();

        }).fail(function(jqXHR) {
            speak('bad', 'Có lỗi rồi ạ.');
            speak('bad', TradeApiErrors.getMessage(jqXHR));
            resetState();
        });
    };

module.exports = {
    init: function() {
        resetState();

        tradeApiHelper = new TradeApiClient();
        Authenticator.init(tradeApiHelper);
        vtosKeys = [];

        welcome();
        listenToHuman();
        listenToParser();
        listenToAuthenticator();
    }
}
