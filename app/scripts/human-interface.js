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

	renderHumanMessage = function(message) {
		var msgHtml = template(userMessageTmpl, {message: message});
		$textarea.val('');
		$conversation.append(msgHtml);
		$("html, body").animate({ scrollTop: $(document).height() }, "slow"); // scroll to bottom
	},

	bindUserInput = function() {
		$form.on('submit', function(e) {
			var message = $textarea.val();
			renderHumanMessage(message);
			PubSub.publish('/human-raw', {
				message: message
			});
			e.preventDefault();
		});
	},

	triggerSubmitOnHittingEnter = function() {
		$textarea.on('keypress', function(e) {
			if (e.keyCode === 13) {
				e.preventDefault();
				$form.submit();
			}
			return true;
		});
	},

	handleBotMessages = function() {
		PubSub.subscribe('/fulfilled', function(data) {
			var now = new Date();
			var msgHtml = template(botMessageTmpl, {message: data.message, botIndex: data.botIndex, time: `${now.getHours()}:${now.getMinutes()}` });
			$conversation.append(msgHtml);
		});
	};

module.exports = {
	init: function() {
		$form = $('#user-input');
		$textarea = $('textarea', $form).focus();
		$conversation = $('#conversation');
		userMessageTmpl = $('#human-message-tmpl').html();
		botMessageTmpl = $('#bot-message-tmpl').html();

		bindUserInput();
		triggerSubmitOnHittingEnter();
		handleBotMessages();
	}
}