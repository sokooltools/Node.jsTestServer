$("#css-tabs").tabs({
	heightStyle: "auto",
	beforeLoad: function (event, ui) {
		ui.jqXHR.fail(function () {
			ui.panel.html("Couldn't load this tab. We'll try to fix this as soon as possible. If this wouldn't be a demo.");
		});
	},
	load: function (event, ui) {
		switch (ui.tab[0].id) {
			case "t0":
				break;
			case "t1":
				break;
			case "t2":
				break;
			case "t3":
				break;
			case "t4":
				break;
			default:
		}
	},
});

window.DEMO.loadCommon();
