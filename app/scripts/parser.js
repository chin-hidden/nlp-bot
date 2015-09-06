import _ from "underscore";
import PEG from "pegjs/lib/peg";
import DISPATCHER from "./pubsub";


export var INTENT = {
    PLACE_ORDER: "PLACE_ORDER",
    GREETING: "GREETING",
    UPDATE_INFO: "UPDATE_INFO",
    CONFIRM: "CONFIRM",
    DENY: "DENY",
    GET_ATTENTION: "GET_ATTENTION",
    ASK_FOR_HELP: "ASK_FOR_HELP",
    SEEK_REAFFIRM: "SEEK_REAFFIRM",
    LAUGHING: "LAUGHING",
    VIEW_ORDER_LIST: "VIEW_ORDER_LIST"
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
            if (_.contains(["dat lenh", "dat"], node[1])) {
                result.intent = INTENT.PLACE_ORDER;
            } else if (_.contains(["mua", "ban"], node[1])) {
                result.intent = INTENT.PLACE_ORDER;
                result.side = {
                    "mua": ORDER_SIDE.BUYING,
                    "ban": ORDER_SIDE.SELLING
                }[node[1]];
            } else if (node[1] === "chao") {
                result.intent = INTENT.GREETING;
            } else if (_.contains(["xem so lenh", "xem trang thai lenh"], node[1])) {
                result.intent = INTENT.VIEW_ORDER_LIST;
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
        } else if (nodeType === "UNK_PRP") {
            result.intent = INTENT.ASK_FOR_HELP;
            isTerminal = true;
        } else if (nodeType === "LAUGHING") {
            result.intent = INTENT.LAUGHING;
        } else if (nodeType === "SEEK_REAFFIRM") {
            result.intent = INTENT.SEEK_REAFFIRM;
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
    str = str.replace(/đ/g, "d");

    str = str.replace(/!|@|\$|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\'| |\"|\&|\#|\[|\]|~/g," ");

    return str;
}


Promise.all([
    $.get("/scripts/grammar.txt"),
    $.get("http://125.212.207.68/priceservice/company/snapshot/")
]).then((values) => {
    var grammarTemplate = values[0];
    var symbolInfos = values[1];

    // var codes = _.map(_.pluck(symbolInfos, "code"), (str) => str.toLowerCase());
    var codes = _.map(["VND", "ACB"], (str) => str.toLowerCase());
    var grammar = _.template(grammarTemplate)({ stockSymbols: '"' + codes.join('" / "') + '"' });

    // TODO: this line takes a looooooooooooong time to finish!
    var parser = PEG.buildParser(grammar);
    DISPATCHER.publish("/parser/ready");

    DISPATCHER.subscribe("/human", (payload) => {
        var text = $.trim(cleanVietnamese(payload.message));
        var retries = 1;

        while (true) {
            try {
                var tree = parser.parse(text);
                var result = parseTree(tree);
                DISPATCHER.publish("/processed", {
                    status: "ok",
                    message: result,
                });

                break;
            } catch (e) {
                if (retries-- == 0) {
                    DISPATCHER.publish("/processed", {
                        status: "parse-error",
                        message: e,
                    });
                    break;
                }

                // hiện tại không thể model câu "cho anh con VND" trong grammar
                if (text.search("cho anh") != -1) {
                    text = text.replace("cho anh", "cho anh mua");
                }
            }
        }
    });
});
