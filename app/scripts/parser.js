import PEG from "pegjs/lib/peg";

var grammar = `
start
    = action:action _ amount:number _ symbol:symbol _ "gia" _ price:number
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
