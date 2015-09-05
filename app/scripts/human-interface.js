/**
 * Handle all user interactions, and responses to users
 *
 * @author Dung.Bui, Trung.Ngo
 * @date Summer 2015
 * All rights reserved.
 */

import PubSub from "./pubsub";

var bindUserInput = function() {
	$('#user-input').on('submit', function(e) {
		PubSub.publish('/raw', {
			message: $(this).find('textarea').val()
		})
		e.preventDefault();
	});
}

module.exports = {
	init: function() {
		bindUserInput();
	}
}