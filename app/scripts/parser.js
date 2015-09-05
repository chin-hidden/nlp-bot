import _ from "underscore";
import PEG from "pegjs/lib/peg";
import DISPATCHER from "./pubsub";

function parseTree(tree) {
  var firstVP = findVerbPhrase(tree);
  return parseVerbPhrase(firstVP);
}


export var INTENT = {
    PLACE_ORDER: "PLACE_ORDER"
};

export var ORDER_SIDE = {
    BUYING: "BUYING",
    SELLING: "SELLING"
}


/**
 * Find the first verb phrase in a tree
 */
function findVerbPhrase(tree) {
  return tree[0][1]["VP"];
}

function parseVerbPhrase(vp) {
  var result = {};

  _.each(vp, function(element, key) {
    if (_.has(element, "V") && _(["mua", "ban"]).contains(element["V"])) {
      result.intent = INTENT.PLACE_ORDER;
      result.side = {
        "mua": ORDER_SIDE.BUYING,
        "ban": ORDER_SIDE.SELLING
      }[element["V"]];

      // Find the amount and symbol
      var firstNP = _.chain(vp).filter(function(el) { return _.has(el, "NP"); }).pluck("NP").first().value();

      console.log(firstNP)

      _.chain(firstNP).flatten().each(function(node) {
        if (_.has(node, "NUMBER")) {
          result.amount = node.NUMBER;
        }

        if (_.has(node, "NOUN")) {
          result.symbol = node.NOUN;
        }
      });

      // Find the price
      _.chain(vp)
      .filter(function(node) { return _.has(node, "PP"); })
      .pluck("PP")
      .each(function(node) {
        if (node[0] === "gia" && _.has(node[1], "NUMBER")) {
          result.price = node[1].NUMBER;
        }
      });
    }
  });

  return result;
}


Promise.all([
    $.get("/scripts/grammar.txt"),
    $.get("http://priceservice.vndirect.com.vn/priceservice/company/snapshot/")
]).then((values) => {
    var symbolInfos = values[1];

    var codes = _.pluck(symbolInfos, "code");
    var grammar = _.template(values[0])({ stockSymbols: '"' + codes.join('" / "') + '"' });

    // TODO: this line takes a looooooooooooong time to finish!
    var parser = PEG.buildParser(grammar);
    DISPATCHER.publish("/parser/ready");

    DISPATCHER.subscribe("/human", (payload) => {
        try {
            var tree = parser.parse(payload.message);
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
