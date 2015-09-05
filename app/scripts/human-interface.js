/**
 * Handle all user interactions, and responses to users
 *
 * @author Dung.Bui, Trung.Ngo
 * @date Summer 2015
 * All rights reserved.
 */

import PubSub from "./pubsub";
import template from 'microtemplates';

var $textarea, $conversation, $form, userMessageTmpl, botMessageTmpl,

	bindUserInput = function() {
		$form.on('submit', function(e) {
			PubSub.publish('/raw', {
				message: $textarea.val()
			});
			var msgHtml = template(userMessageTmpl, {message: $textarea.val() });
			$textarea.val('');
			$conversation.append(msgHtml);
			$("html, body").animate({ scrollTop: $(document).height() }, "slow"); // scroll to bottom
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
	},

	handleBotMessages = function() {
		PubSub.subscribe('/fulfilled', function(data) {
			var msgHtml = template(botMessageTmpl, {message: data.message });
			$conversation.append(msgHtml);
		});
	};

module.exports = {
	init: function() {
		$form = $('#user-input');
		$textarea = $('textarea', $form);
		$conversation = $('#conversation');
		userMessageTmpl = $('#human-message-tmpl').html();
		botMessageTmpl = $('#bot-message-tmpl').html();

		bindUserInput();
		triggerSubmitOnHittingEnter();
		handleBotMessages();
	}
}