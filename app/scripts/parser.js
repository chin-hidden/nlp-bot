import _ from "underscore";
import PEG from "pegjs/lib/peg";
import DISPATCHER from "./pubsub";


export var INTENT = {
    PLACE_ORDER: "PLACE_ORDER",
    GREETING: "GREETING",
    UPDATE_INFO: "UPDATE_INFO",
    CONFIRM: "CONFIRM",
    DENY: "DENY",
    GET_ATTENTION: "GET_ATTENTION"
};

export var ORDER_SIDE = {
    BUYING: "BUYING",
    SELLING: "SELLING"
};

function parseTree(tree, result) {
    // Recursively walk down the tree
    if (result === undefined) {
        var result = {};
    }

    _.chain(tree).filter().each((node) => {
        var nodeType = node[0];
        var isTerminal = false;

        if (nodeType === "V") {
            if (node[1] === "dat lenh") {
                result.intent = INTENT.PLACE_ORDER;
            }

            if (_.contains(["mua", "ban"], node[1])) {
                result.intent = INTENT.PLACE_ORDER;
                result.side = {
                    "mua": ORDER_SIDE.BUYING,
                    "ban": ORDER_SIDE.SELLING
                }[node[1]];
            } else if (node[1] === "chao") {
                result.intent = INTENT.GREETING;
            }
        } else if (nodeType === "STOCK") {
            result.symbol = node[1];
        } else if (nodeType === "PRICE") {
            result.price = node[1][1];
            if (result.price < 1000) {
                result.price *= 1000;
            }
            isTerminal = true;
        } else if (nodeType === "NUMBER") {
            result.amount = node[1];
            isTerminal = true;
        } else if (nodeType === "YES") {
            result.intent = INTENT.CONFIRM;
            isTerminal = true;
        } else if (nodeType === "NO") {
            result.intent = INTENT.DENY;
            isTerminal = true;
        } else if (nodeType === "CALLING") {
            result.intent = INTENT.GET_ATTENTION;
            isTerminal = true;
        }

        if (!isTerminal && _.isArray(node)) {
            parseTree(node, result);
        }
    });

    if (result.intent === undefined) {
        result.intent = INTENT.UPDATE_INFO;
    }

    return result;
}


function cleanVietnamese(str) {
    // Stolen from here: canthoit.info/demo-locdau-js.html
    // Without license or permission haha >:))

    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");    return str;
}


Promise.all([
    $.get("/scripts/grammar.txt"),
    // $.get("http://125.212.207.68/priceservice/company/snapshot")
]).then((values) => {
    var symbolInfos = values[1];

    // var codes = _.pluck(symbolInfos, "code");
    var codes = _.map(["VND", "ACB"], (str) => str.toLowerCase());
    var grammar = _.template(values[0])({ stockSymbols: '"' + codes.join('" / "') + '"' });

    // TODO: this line takes a looooooooooooong time to finish!
    var parser = PEG.buildParser(grammar);
    DISPATCHER.publish("/parser/ready");

    DISPATCHER.subscribe("/human", (payload) => {
        try {
            var text = $.trim(cleanVietnamese(payload.message));
            var tree = parser.parse(text);
            var result = parseTree(tree);
            DISPATCHER.publish("/processed", {
                status: "ok",
                message: result,
            });
        } catch (e) {
            DISPATCHER.publish("/processed", {
                status: "parse-error",
                message: e,
            });
        }
    });
});
