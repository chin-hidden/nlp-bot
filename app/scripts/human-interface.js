/**
 * Handle all user interactions, and responses to users
 *
 * @author Dung.Bui, Trung.Ngo
 * @date Summer 2015
 * All rights reserved.
 */

import PubSub from "./pubsub";
import template from 'microtemplates';

var $textarea, $conversation, $form, userMessageTmpl,

	bindUserInput = function() {
		$form.on('submit', function(e) {
			PubSub.publish('/raw', {
				message: $textarea.val()
			});
			var msgHtml = template(userMessageTmpl, {message: $textarea.val() });
			$textarea.val('');
			$conversation.append(msgHtml);
			e.preventDefault();
		});
	},

	triggerSubmitOnHittingEnter = function() {
		$textarea.on('keyup', function(e) {
			if (e.keyCode === 13) {
				$form.submit();
			}
			return true;
		});
	};

module.exports = {
	init: function() {
		$form = $('#user-input');
		$textarea = $('textarea', $form);
		$conversation = $('#conversation');
		userMessageTmpl = $('#user-message-tmpl').html();
		bindUserInput();
		triggerSubmitOnHittingEnter();
	}
}