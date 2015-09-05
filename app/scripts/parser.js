import PEG from "pegjs/lib/peg";
import DISPATCHER from "./pubsub";

var grammar = `
{
    function removeSpace(arr) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === " ") {
          arr.splice(i, 1);
        }
      }
    }
}

S =
  (SUBJ? VP / NP) EXCLAM?

SUBJ = NP

// verb phrase
VP = VP:(PP? V PP? NP? PP?) { return {VP}; }

// noun phrase
NP = NP:(NUMBER? CLASSIFIER? NOUN ADJ* / PRP / NUMBER) _ { return {NP}; }

// động từ tình thái
VTT = VTT:("muon") _ {return {VTT}; }

// động từ hành động
VHD =
  VHD:("dat mua" / "mua" / "ban" / "huy" / "sua") _ { return {VHD}; }

V = V:(VTT VHD / VHD) { return {V}; }

// Prepositional phrase
PP =
  PP:(P / ("cho" $_ PRP) / "gia" $_ NUMBER) _ {
  removeSpace(PP);
  return {PP};
}

P =
  P:("nhanh" / "ngay") _ { return {P}; }

CLASSIFIER = CLASSIFIER:("con") _ { return {CLASSIFIER}; }

NOUN =
  NOUN:("ma" / "VND" / "lenh" / "so" / "bac sy") _ { return {NOUN}; }

ADJ =
  ADJ:("vua xong") { return {ADJ}; }

NUMBER
    = NUMBER:(integer $_ ("ngan" / "nghin"/ "trieu" / "ty" / "ti") / integer) _ {

removeSpace(NUMBER);
return {NUMBER};
}

// Pronoun
PRP =
  prp:("toi" / "tao" / "anh" / "em" / "chi") _ { return prp; }

EXCLAM =
  EXCLAM:("nhe"/ "voi") { return {EXCLAM}; }

_ = [ \t\n\r]*
__ = [ \t\n\r]+


integer "integer"
    = digits:[0-9]+ { return parseInt(digits.join(""), 10); }
`;

var parser = PEG.buildParser(grammar);


function parseTree(tree) {
  var firstVP = findVerbPhrase(tree);
  return parseVerbPhrase(firstVP);
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
    if (_.has(element, "V")) {
      result.intent = element["V"];

      // Find the amount and symbol
      var firstNP = _.chain(vp).filter(function(el) { return _.has(el, "NP"); }).first().value().NP;

      _.each(firstNP, function(node) {
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



DISPATCHER.subscribe("/human", (payload) => {
    try {
        var tree = parser.parse(payload.message);
        var result = parseTree(tree);
        DISPATCHER.publish("/processed", {
            status: "ok",
            parsed: result,
        });
    } catch (e) {
        DISPATCHER.publish("/processed", {
            status: "parse-error",
            message: e,
        });
    }
});
