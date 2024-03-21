// ====================================================================================================
// customcombo.js
// ====================================================================================================
window.DEMO.loadCommon();

$("#demo_getCustomComboValue").on("click", function () {
	const ipaddress = $("#cboIpAddress").val();
	const port = $("#cboPort").val();
	const msg = `</br><span style='font-size:14pt;'>IP Address: <b>${ipaddress}</b>, Port: <b>${port}</b></span>`;
	window.CMN.showDialog(msg, document.title);
});

$.widget("custom.combobox", {
	_create: function () {
		this.wrapper = $("<span>").addClass("custom-combobox").insertAfter(this.element);

		this.element.hide();
		this._createAutocomplete();
		this._createShowAllButton();
	},
	_createAutocomplete: function () {
		const selected = this.element.children(":selected");
		const value = selected.val() ? selected.text() : "";

		this.input = $("<input>")
			.appendTo(this.wrapper)
			.val(value)
			//.attr("title", "the title")
			.attr("spellcheck", "false")
			.addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
			.autocomplete({
				delay: 0,
				minLength: 0,
				source: $.proxy(this, "_source"),
			})
			.tooltip({
				classes: {
					"ui-tooltip": "ui-state-highlight",
				},
			});
		this._on(this.input, {
			autocompleteselect: function (event, ui) {
				ui.item.option.selected = true;
				this._trigger("select", event, {
					item: ui.item.option,
				});
			},

			//,autocompletechange: "_removeIfInvalid"
		});
	},
	_createShowAllButton: function () {
		var input = this.input,
			wasOpen = false;

		$("<a>")
			.attr("tabIndex", -1)
			//.attr("title", "the title") // "Show All Items"
			.tooltip()
			.appendTo(this.wrapper)
			.button({
				icons: {
					primary: "ui-icon-triangle-1-s",
				},
				text: false,
			})
			.removeClass("ui-corner-all")
			.addClass("custom-combobox-toggle ui-corner-right")
			.on("mousedown", function () {
				wasOpen = input.autocomplete("widget").is(":visible");
			})
			.on("click", function () {
				input.trigger("focus");

				// Close if already visible
				if (wasOpen) {
					return;
				}

				// Pass empty string as value to search for, displaying all results
				input.autocomplete("search", "");
			});
	},
	_source: function (request, response) {
		var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
		response(
			this.element.children("option").map(function () {
				const text = $(this).text();
				if (this.value && (!request.term || matcher.test(text)))
					return {
						label: text,
						value: text,
						option: this,
					};
			})
		);
	},
	_destroy: function () {
		this.wrapper.remove();
		this.element.show();
	},
});

$("#combobox1").combobox();
$("#test1 > span.custom-combobox > input.ui-autocomplete-input").attr("id", "cboIpAddress");
$("#cboIpAddress").css("width", "120px").css("font-size", "12pt").css("font-weight", "bold");
$("#cboIpAddress").val("LocalHost");

$("#combobox2").combobox();
$("#test2 > span.custom-combobox > input.ui-autocomplete-input").attr("id", "cboPort");
$("#cboPort").css("width", "50px").css("font-size", "12pt").css("font-weight", "bold");
$("#cboPort").val("3000");

//$('#combobox1,#combobox2').prop('title', 'This is the title');
// input.val( $(select).find("option:selected").text());
