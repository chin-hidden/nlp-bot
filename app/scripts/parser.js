import PEG from "pegjs/lib/peg";
import DISPATCHER from "./pubsub";

var grammar = `
start
    = _ action:action _ amount:number _ symbol:symbol _ "gia" _ price:number _
    {
        return {
            action: action,
            amount: amount,
            symbol: symbol,
            price: price,
        }
    }

action
    = "mua" / "ban"

symbol
    = "VND" / "ACB"

number
    = integer:integer "k" { return integer * 1000; }
    / integer

integer "integer"
    = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

_ "whitespace" = [ \\t\\n\\r]*
`;

export var parser = PEG.buildParser(grammar);

DISPATCHER.subscribe("/raw", (payload) => {
    console.log("hoho");
    try {
        var parsed = parser.parse(payload.message);
        DISPATCHER.publish("/processed", {
            status: "ok",
            parsed: parsed,
        });
    } catch (e) {
        DISPATCHER.publish("/processed", {
            status: "parse-error",
            message: "lol",
        });
    }
});
