/*global window:true */

window.Breakpoints = (function (window, document) {
	'use strict';

	var B = {},
	resizingTimeout = 200,
	breakpoints = [],

	// Credits to: http://stackoverflow.com/questions/5916900/detect-version-of-browser/5918791#5918791
	browser = (function(n){
	    var N = n.appName, ua = n.userAgent, tem,
		    M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
	    if(M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
	    M = M ? [M[1], M[2]] : [N, n.appVersion, '-?'];
	    M = {indentity: M[0], version: M[1]};
	    return M;
	})(navigator),

	debounce = function (func, wait, immediate) {
		var timeout, result;
		return function() {

			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) result = func.apply(context, args);
			};

			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) result = func.apply(context, args);
			return result;
		};
	},

	removeDoubleQuotes = function (content) {
		if(content && content.length) {
			return content.replace(/\"/g, "");
		}
		return "";
	},

	check = function (breakpoint) {
		var match = B.isMatched(breakpoint);
	    breakpoint.matched = breakpoint.matched || function() {};
	    breakpoint.exit = breakpoint.exit || function() {};

		if (match && !breakpoint.isMatched) {
			breakpoint.matched.call(breakpoint.context);
			breakpoint.isMatched = true;
		} else if (!match && breakpoint.isMatched) {
			breakpoint.exit.call(breakpoint.context);
			breakpoint.isMatched = false;
		}
		return breakpoint;
	},

	onWindowResize = function () {
		for( var i = 0; i < breakpoints.length; i++ ) {
			check(breakpoints[i]);
		}
	},

	init = function () {
		var debounceResize = debounce( onWindowResize, resizingTimeout);
		window.onresize = debounceResize;
		window.onorientationchange = debounceResize;
		return B;
	};

	B.isMatched = function(breakpoint) {
		breakpoint.el = breakpoint.el || document.body;

		var content;

		// Safari <= 5
		if (breakpoint.fallbackEl && browser.indentity == 'Safari' && parseInt(browser.version) <= 5) {
			content = window.getComputedStyle(breakpoint.fallbackEl,null).getPropertyValue('font-family');
		}
		// Modern browsers
		else if (window.getComputedStyle) {
			content = window.getComputedStyle(breakpoint.el, ':after').getPropertyValue('content');
		}
		// Old IE
		else if (breakpoint.fallbackEl) {
			window.getCompStyle = function(el, pseudo) {
				this.el = el;
				this.getPropertyValue = function(prop) {
					var re = /(\-([a-z]){1})/g;
					if (prop == 'float') prop = 'styleFloat';
					if (re.test(prop)) {
						prop = prop.replace(re, function () {
							return arguments[2].toUpperCase();
						});
					}
					return el.currentStyle[prop] ? el.currentStyle[prop] : null;
				}
				return this;
			};
			content = window.getCompStyle(breakpoint.fallbackEl,'').getPropertyValue('font-family');
			alert(content);
		}
		// no support
		else { return false; }

		content = removeDoubleQuotes(content)
		return breakpoint.name === content;
	};

	B.on = function(breakpoint) {
		breakpoints.push(breakpoint);
		breakpoint.isMatched = false;

		breakpoint.notMatched = function (callback) {
			callback = callback || function() {};

			if (!B.isMatched(breakpoint)) {
				callback();
				return true;
			}
			return false;
		};


		return check(breakpoint);
	};

	return init();

})(window, document);




