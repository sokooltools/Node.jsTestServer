// =======================================================================================================
// jquery.ipaddress.js
// =======================================================================================================

var IPA = {};

IPA.isStaticIp = false;

// Allows an ip address with first octet between 1-223 and all other octets between 0-255. An empty ip address IS allowed.
IPA.validRegex1 = /\b(?:(?:[0]{1,3}\.[0]{1,3}\.[0]{1,3}\.[0]{1,3})|(?:(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])\.)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b/;

// Allows an ip address with first octet between 1-255 and all other octets between 0-255. An empty ip address IS NOT allowed.
IPA.validRegex2 = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[1-9][0-9]?)\.)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;

// Allows an ip address with first octet between 1-223 and all other octets between 0-255. An empty ip address IS NOT allowed.
IPA.validRegex3 = /\b(?:(?:(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])\.)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b/;

// -------------------------------------------------------------------------------------------
//  Returns an indication as to whether all current IP Addresses are valid.
// -------------------------------------------------------------------------------------------
IPA.isAllValid = function() {
	var isAllValid = true;
	$("input.ipv4mask").each(function() {
		isAllValid |= $(this).ipIsValid(1);
		isAllValid |= $(this).ipIsValid(2);
		isAllValid |= $(this).ipIsNotBlank();
	});
	return isAllValid;
};

// -------------------------------------------------------------------------------------------
//  Resets Validation.
// -------------------------------------------------------------------------------------------
IPA.resetValidation = function(isStaticChecked) {
	IPA.isStaticIp = isStaticChecked;
	if (!isStaticChecked) {
		$("div.ip_container").each(function() {
			$(this).removeClass("ip_invalid");
			$(this).removeClass("ip_blank");
		});
	}
	$("input.ipv4mask").each(function() {
		$(this).trigger("validateIpAddress"); // TODO:
	});
};

// -------------------------------------------------------------------------------------------
// Provides an indication as to whether the specified IP is not in an invalid range.
// -------------------------------------------------------------------------------------------
IPA.isValidIp = function(ip) {
	return !(new RegExp(/\b1\.[01]?\.[01]?\.[01]?\b/g)).test(ip);
};

(function($) {

	// -------------------------------------------------------------------------------------------
	//  This is used to set the cursor position inside the octet.
	// -------------------------------------------------------------------------------------------
	$.fn.caret = function(s, e) {
		function setPosition(el, start, end) {
			if (el.setSelectionRange) {
				el.focus();
				el.setSelectionRange(start, end);
			} else if (el.createTextRange) {
				var range = el.createTextRange();
				range.collapse(true);
				range.moveEnd("character", end);
				range.moveStart("character", start);
				range.select();
			}
		}
		if ((s)) {
			if ((e)) {
				// Set the range.
				return this.each(function() {
					setPosition(this, s, e);
				});
			} else {
				// Set the position.
				return this.each(function() {
					setPosition(this, s, s);
				});
			}
		} else {
			// Get the range.
			var elm = this[0];
			if (elm.createTextRange && document.selection) {
				var r = document.selection.createRange().duplicate();
				var endm = elm.value.lastIndexOf(r.text) + r.text.length;
				r.moveEnd("character", elm.value.length);
				var startm = (r.text === "") ? elm.value.length : elm.value.lastIndexOf(r.text);
				return [startm, endm];
			} else {
				return [elm.selectionStart, elm.selectionEnd];
			}
		}
	};

	// -------------------------------------------------------------------------------------------
	// This is used to get/set the IP Address.
	// -------------------------------------------------------------------------------------------
	$.fn.ipAddress = function(ipAddress) {
		if ((ipAddress !== undefined && ipAddress !== null) && this.hasClass("ip-enabled")) {
			this.val(ipAddress);
			var ipId = this.attr("id");
			var ipArray = ipAddress.split(".");
			for (var n = 0; n <= 3; n++) {
				var idPfx = "input#" + ipId + "_octet_" + (n + 1);
				$(idPfx).val(ipArray[n]);
			}
		}
		return this.val();
	};

	// -------------------------------------------------------------------------------------------
	// Provides indication using css as to whether this IP Address is valid.
	// -------------------------------------------------------------------------------------------
	$.fn.ipIsValid = function(n) {
		var sibling = $(this).next($("div"));
		if (IPA.isStaticIp && !isValid($(this).val())) {
			sibling.addClass("ip_invalid");
			return false;
		} else {
			sibling.removeClass("ip_invalid");
			return true;
		}
		function isValid(ip) {
			if (n === 1)
				return ip.replace(IPA.validRegex1, "") === "";
			else if (n === 2)
				return ip.replace(IPA.validRegex2, "") === "";
			else {
				return ip.replace(IPA.validRegex3, "") === "";
			}
		}
	};

	// -------------------------------------------------------------------------------------------
	// Provides indication using css as to whether this IP Address is or is not '' (or '0.0.0.0').
	// -------------------------------------------------------------------------------------------
	$.fn.ipIsNotBlank = function() {
		var sibling = $(this).next($("div"));
		if (IPA.isStaticIp && isBlank((this).ipAddress())) {
			sibling.addClass("ip_blank");
			return false;
		} else {
			sibling.removeClass("ip_blank");
			return true;
		}
		function isBlank(ipAddress) {
			return ipAddress === "" || ipAddress.replace(/\b[0]+\.[0]+\.[0]+\.[0]+\b/g, "") === "";
		}
	};

	// -------------------------------------------------------------------------------------------
	// Allows an ip address with first octet between 1-223 and all other octets between 0-255. An empty ip address IS allowed.
	// -------------------------------------------------------------------------------------------
	jQuery.validator.addMethod("validip1", function(ip) {
		if (!IPA.isStaticIp) { return true; }
		return ip.replace(IPA.validRegex1, "") === "";
	});

	// -------------------------------------------------------------------------------------------
	// Allows an ip address with first octet between 1-255 and all other octets between 0-255. An empty ip address IS NOT allowed.
	// -------------------------------------------------------------------------------------------
	jQuery.validator.addMethod("validip2", function(ip) {
		if (!IPA.isStaticIp) { return true; }
		return ip.replace(IPA.validRegex2, "") === "";
	});

	// -------------------------------------------------------------------------------------------
	// Allows an ip address with first octet between 1-223 and all other octets between 0-255. An empty ip address IS NOT allowed.
	// -------------------------------------------------------------------------------------------
	jQuery.validator.addMethod("validip3", function(ip) {
		if (!IPA.isStaticIp) { return true; }
		return ip.replace(IPA.validRegex3, "") === "";
	});

	// -------------------------------------------------------------------------------------------
	// Initializes the IP Address control.
	// -------------------------------------------------------------------------------------------
	$.fn.ipInitialize = function() {
		return $(this).each(function() { // Perform the following for each octet:
			var $this = $(this);

			if (!$this.hasClass("ip-enabled")) {
				$this.hide();

				var ipValue = (this.value) ? this.value.split(".") : ["", "", "", ""];
				var octets = [];
				var idPrefix = $this.attr("name").replace(/\[/g, "_").replace(/\]/g, "");
				for (var i = 0; i <= 3; i++) {
					var nameAndId = idPrefix + "_octet_" + (i + 1);
					var s1 = '<input type="text" class="ip_octet" name="' + nameAndId;
					s1 += '" id="' + nameAndId + '" maxlength="3" autocomplete="off" value="' + ipValue[i] + '" disabled="" />';
					octets.push(s1);
				}
				var octetHtml = octets.join(".");
				var s2 = "<div class=\"ip_container\" style=\"display: inline";
				//s2 += (($.browser.msie) ? "" : "-block") + ";\">";
				s2 += "-block;\">";
				$this.after($(s2).html(octetHtml));
				$this.addClass("ip-enabled");
			}

			var isNumeric = function(e) {
				if (e.shiftKey) {
					return false;
				}
				return (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
			};

			var isValidKey = function(e) {
				var k = e.keyCode;
				// Allow shift key only in combination with tab key.
				if (e.shiftKey && k !== 9) {
					return false;
				}
				// Allow: ctrl key //&& Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Y, Ctrl+Z
				if ((e.ctrlKey))// && (k === 65 || k === 67 || k === 86 || k === 88 || k === 90))
				{
					return true;
				}
				var valid = [
					8, // backspace
					9, // tab
					13, // enter
					27, // escape
					35, // end
					36, // home
					37, // left arrow
					39, // right arrow
					46, // delete
					48, 96, // 0
					49, 97, // 1
					50, 98, // 2
					51, 99, // 3
					52, 100, // 4
					53, 101, // 5
					54, 102, // 6
					55, 103, // 7
					56, 104, // 8
					57, 105, // 9
					110, 190  // period
				];
				for (var idx = 0; idx < valid.length; idx++) {
					if (k === valid[idx]) {
						return true;
					}
				}
				return false;
			};

			function raiseValueChangedEvent(t) {
				t.parent().siblings($("input")).trigger("valuechanged");
			}

			// Bind the 'keydown' event to the octet field.
			$("input.ip_octet", $this.next(".ip_container")).bind("keydown", function(e) {
				// Helper function for caret positioning.
				function getCaretPosition(ctl) {
					var res = { begin: 0, end: 0 };
					if (ctl.setSelectionRange) {
						res.begin = ctl.selectionStart;
						res.end = ctl.selectionEnd;
					} else if (document.selection && document.selection.createRange) {
						var range = document.selection.createRange();
						res.begin = 0 - range.duplicate().moveStart("character", -100000);
						res.end = res.begin + range.text.length;
					}
					return res;
				}

				if (!isValidKey(e)) {
					return false;
				}

				var nextOctet = $(this).next("input.ip_octet");
				var prevOctet = $(this).prev("input.ip_octet");

				// A period is pressed when this octet has a value.
				if (e.keyCode === 110 || e.keyCode === 190) {
					// Jump to next octet.
					if ($(this).val().length && nextOctet.length) {
						nextOctet.focus();
						nextOctet.select();
					}
					// Prevent it from bubbling.
					return false;
				}
				// A number key is pressed with text selected.
				else if (($(this).caret()[1] - $(this).caret()[0]) && isNumeric(e)) {
					raiseValueChangedEvent($(this));
					return true;
				}
				var maxlength = 3; // this.getAttribute('maxlength');
				// A Number key or Right Arrow key is pressed with maxlength being reached.
				if ((this.value.length === maxlength && $(this).caret()[0] === maxlength && (isNumeric(e) || e.keyCode === 39)
					) || (e.keyCode === 39 && $(this).caret()[0] === this.value.length)) {
					// Jump to next octet.
					if (nextOctet.length) {
						$(this).trigger("blur");
						nextOctet.focus().caret(0);
						if (e.keyCode === 39) {
							return false;
						}
					}
				}
				// A Number key is pressed.
				if (isNumeric(e)) {
					raiseValueChangedEvent($(this));
				}
				// Left Arrow key is pressed when the caret at position 0.
				else if (e.keyCode === 37 && $(this).caret()[0] === 0) {
					// Jump to previous octet.
					if (prevOctet.length) {
						$(this).trigger("blur");
						if (prevOctet.val().length > 0) {
							prevOctet.caret(prevOctet.val().length);
						} else {
							prevOctet.focus().caret(0);
						}
						// Prevent it from bubbling up.
						return false;
					}
				}
				// Backspace key pressed.
				else if (e.keyCode === 8) {
					var pos = getCaretPosition($this);
					// Some text is selected.
					if (pos.end > pos.begin) {
						// Delete the selected text.
						var newval = $(this).val().substring(0, pos.begin) + $(this).val().substring(pos.end);
						$(this).val(newval);
						if (pos.begin === 0 && prevOctet.length) {
							$(this).trigger("blur");
							prevOctet.focus().caret(prevOctet.val().length);
						} else {
							$(this).caret(pos.begin);
						}
						raiseValueChangedEvent($(this));
						// Prevent it from bubbling up.
						e.preventDefault();
						return false;
					}
					// The caret is at position 0.
					else if (pos.begin === 0) {
						// Jump to previous octet and let the delete bubble.
						if (prevOctet.length) {
							$(this).trigger("blur");
							prevOctet.focus().caret(prevOctet.val().length);
							if (this.value.length) {
								raiseValueChangedEvent($(this));
							}
						}
					}
					// The caret is at position 1.
					else if (pos.begin === 1) {
						// Delete the current character and jump to previous octet.
						$(this).val($(this).val().substring(1));
						if (prevOctet.length) {
							$(this).trigger("blur");
							prevOctet.focus().caret(prevOctet.val().length);
							raiseValueChangedEvent($(this));
							// Prevent it from bubbling up.
							return false;
						}
					}
					// Is there something to delete.
					else if (this.value.length || (prevOctet.length && prevOctet.val().length)) {
						raiseValueChangedEvent($(this));
					}
				}
				// Delete key pressed.
				else if (e.keyCode === 46) {
					// Is there something to delete.
					if (this.value.length || (nextOctet.length && nextOctet.val().length)) {
						raiseValueChangedEvent($(this));
					}
				}
				// End key pressed.
				else if (e.keyCode === 35) {
					if (nextOctet.length === 0) {
						$(this).caret($(this).val().length);
					}
					while (nextOctet.length) {
						nextOctet.focus().caret(nextOctet.val().length);
						nextOctet = nextOctet.next("input.ip_octet");
					}
					//return true;
				}
				// Home key pressed.
				else if (e.keyCode === 36) {
					if (prevOctet.length === 0) {
						$(this).caret(0);
					}
					while (prevOctet.length) {
						prevOctet.focus().caret(0);
						prevOctet = prevOctet.prev("input.ip_octet");
					}
					//return true;
				}
				return true;

			}).bind("keyup", function(e) // Bind the 'keyup' event to each octet input.
			{
				// Save value to original input if all octets have been entered.
				//if ($('input.ip_octet', $(this).parent()).filter(function(){ return this.value.length; }).length === 4) {	}

				// Store the value in the parent.
				var ipValueA = [];
				$("input.ip_octet", $(this).parent()).each(function() {
					ipValueA.push(this.value);
				});
				var newval = ipValueA.join(".").replace("...", "");

				$this.val(newval);

				//$(document).trigger("validateIpAddress", [$this]); // TODO:
				$this.trigger("validateIpAddress");

				// Delete key pressed.
				if (e.keyCode === 46) {
					// If at the end of the cell jump to next octet.
					if ($(this).caret()[0] === this.value.length) {
						var nextOctet = $(this).next("input.ip_octet");
						if (nextOctet.length) {
							nextOctet.focus().caret(0);
						}
						return false;
					}
				}
				return true;
			}).bind("cut", function() // Bind the 'cut' event to each octet input.
			{
				if ($(this).caret()[1] - $(this).caret()[0]) {
					raiseValueChangedEvent($(this));
				}
			}).bind("paste", function(e) {
				var data = window.clipboardData ?
					window.clipboardData.getData("Text") : // IE Only.
					e.originalEvent.clipboardData.getData("text/plain");
				if (!(data)) {
					return false;
				}
				var thisId = this.name; //(arguments[0].currentTarget.id);
				var prefix = "net_txtSubnetMask";
				var suffix = "octet_1";
				// Default pattern used for anything other than the 1st octet.
				var pattern = /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
				// Is it the 1st octet?
				if (thisId.indexOf(suffix, this.length - suffix.length) !== -1) {
					if (thisId.indexOf(prefix, 0) === -1) {
						// The 1st octet of all except SubnetMask.
						pattern = /\b(22[0-3]|2[0-2][0-3]|[01]?[1-9][0-9]?)\b/g;
					} else {
						// The 1st octet of SubnetMask.
						pattern = /\b(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?)\b/g;
					}
				}
				var newData = "".concat(this.value.slice(0, $(this).caret()[0]), data, this.value.slice($(this).caret()[1], 3));
				// Can the current selection be pasted into?
				if (newData.replace(pattern, "") === "") {
					raiseValueChangedEvent($(this));
					return true;
				}
				return false;
			}).bind("contextmenu", function() { // Prevent context menu from appearing.
				return false;
			}).bind("blur", function() {
				//var thisId = (arguments[0].currentTarget.id);
				//var prefix = 'net_txtSubnetMask';
				//var suffix = 'octet_1';
				//var max = 255;
				//if (thisId.indexOf(suffix, this.length - suffix.length) != -1 && thisId.indexOf(prefix, 0) == -1) max = 223;
				//if (this.value > max) this.value = max;
			});
		});
	};

})(jQuery);