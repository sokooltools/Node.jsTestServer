
window.DEMO.loadCommon();

// A workaround for a flaw in the demo system. (http://dev.jqueryui.com/ticket/4375), ignore!
$("#dialog:ui-dialog").dialog("destroy");

var name2 = $("#name");
var email = $("#email");
var password = $("#password");
var tips = $(".validateTips");
var allFields = $([]).add(email).add(password).add(name2);

function updateTips(t) {
	tips
		.text(t)
		.addClass("ui-state-highlight");
	window.setTimeout(function () {
		tips.removeClass("ui-state-highlight", 1500);
	}, 500);
}

function checkLength(o, n, min, max) {
	if (o.val().length > max || o.val().length < min) {
		o.addClass("ui-state-error");
		updateTips("Length of " + n + " must be between " +
			min + " and " + max + " characters.");
		return false;
	} else {
		return true;
	}
}

function checkRegexp(o, regexp, n) {
	if (!(regexp.test(o.val()))) {
		o.addClass("ui-state-error");
		updateTips(n);
		return false;
	} else {
		return true;
	}
}

$("#dialog-form").dialog({
	autoOpen: false,
	height: 312,
	width: 350,
	modal: true,
	buttons: {
		"Create an account": function () {
			var bValid;
			allFields.removeClass("ui-state-error");

			bValid = checkLength(name2, "username", 3, 16);
			bValid = bValid && checkRegexp(name2, /^[a-z]([0-9a-z_])+$/i, "Username may consist of a-z, 0-9, underscores, begin with a letter.");
			bValid = bValid && checkLength(email, "email", 6, 80);
			// From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
			bValid = bValid && checkRegexp(email, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
				"Invalid email address (eg. support@parker.com");
			bValid = bValid && checkLength(password, "password", 5, 16);
			bValid = bValid && checkRegexp(password, /^([0-9a-zA-Z])+$/, "Password can only contain : a-z 0-9");

			if (bValid) {
				$("#users tbody").append(`<tr><td>${name2.val()}</td><td>${email.val()}</td><td>${password.val()}</td></tr>`);
				$(this).dialog("close");
			}
		},
		Cancel: function () {
			$(this).dialog("close");
		}
	},
	close: function () {
		updateTips("All form fields are required.");
		allFields.val("").removeClass("ui-state-error");
	}
});

$("#create-user").button().on("click", function () {
	$("#dialog-form").dialog("open");
});
