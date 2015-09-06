/**
 * Handle all user interactions, and responses to users
 *
 * @author Dung.Bui, Trung.Ngo
 * @date Summer 2015
 * All rights reserved.
 */

import PubSub from "./pubsub";
import template from 'microtemplates';

var $textarea, $conversation, $form, userMessageTmpl, botMessageTmpl, botMessagesQueue, botIndex,

	renderHumanMessage = function(message) {
		var now = new Date();
		var msgHtml = template(userMessageTmpl, {message: message, time: `${now.getHours()}:${now.getMinutes()}`});
		$textarea.val('');
		$conversation.append(msgHtml);
		scrollToBottom();
	},

	scrollToBottom = function() {
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
			var $thisMsg = $( template(botMessageTmpl, {message: data.message, botIndex: botIndex, time: `${now.getHours()}:${now.getMinutes()}` }) );
			botMessagesQueue.push($thisMsg);
			if (botMessagesQueue.length == 1) {
				// if the queue is previously empty, then start a new queue
				startBotMessagesQueue();
			}
		});
	},

	startBotMessagesQueue = function() {
		var $thisMsg = botMessagesQueue[0];
		var waitTime = $thisMsg.html().length * 3;
		$conversation.append($thisMsg.addClass('typing'));
		scrollToBottom();
		setTimeout(function() {
			$thisMsg.removeClass('typing');
			scrollToBottom();
			botMessagesQueue.shift();
			if (botMessagesQueue.length > 0) {
				startBotMessagesQueue();
			}
		}, waitTime);
	},

	handleSetBot = function() {
		PubSub.subscribe('/set-bot', function(data) {
			botIndex = data.botIndex;
		});
	};

module.exports = {
	init: function() {
		$form = $('#user-input');
		$textarea = $('textarea', $form).focus();
		$conversation = $('#conversation');
		userMessageTmpl = $('#human-message-tmpl').html();
		botMessageTmpl = $('#bot-message-tmpl').html();
		botMessagesQueue = [];

		bindUserInput();
		triggerSubmitOnHittingEnter();
		handleBotMessages();
		handleSetBot();
	}
}
