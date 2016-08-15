import _ from "underscore";
import Util from "./util";

var bantz = [
    { phrases: ['xinh qua', 'dep qua', 'dep lam', 'dep the', 'xinh the', 'xinh lam'], response: 'Hi hi, cám ơn quý khách. Em có thể giúp gì cho quý khách ạ?' },
    { phrases: ['nguoi that'], response: 'Quý khách nghĩ em là ảo thì em là ảo, quý khách nghĩ em là thật thì em là thật ạ, hi hi.' },
    { phrases: ['ngu the', 'do ngu'], response: 'Trí tuệ của em không thể so sánh được với quý khách ạ.' }
];

module.exports = {
    checkBanter: function(msg) {
        msg = Util.cleanVietnamese(msg);
        var response = false;
        bantz.forEach(function(bant, i) {
            bant.phrases.forEach(function(phrase, j) {
                if (msg.search(phrase) > -1) {
                    response = bant.response;
                    return;
                }
            });
        })
        return response;
    }
}