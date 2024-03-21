// $(function () {
$("ul.css-tabs").tabs("div.css-panes > div", {
    effect: "fade",
    history: false,
    onBeforeClick: function (event, i) {
        const pane = this.getPanes().eq(i);
        if (pane[0].children.length === 0) {
            const sel = this.getTabs().eq(i);
            pane.load(sel.attr("href"));
        }
        return true;
    },
    onClick: (function (event, i) {
        $("ul.css-tabs").trigger("tabChanged", i);
        return true;
    })
});

$("body").show();

window.DEMO.loadCommon();

// });