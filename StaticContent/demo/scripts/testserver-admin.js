// ====================================================================================================
// TestServer-admin.js
// ====================================================================================================
var DEMO = window.DEMO;

var sampleText;
var responseText;

$(function () {
    DEMO.loadCommon();

    $("#clearscreen").on("click", function () {
        DEMO.doGet("/test/clear", showResponse);
    });

    $("#getAbout").on("click", function () {
        DEMO.doGet("/test/about", showResponse);
    });

    $("#getJson").on("click", function () {
        DEMO.doGet("/test/json", showResponse);
    });

    $("#getArray").on("click", function () {
        DEMO.doGet("/test/array", showResponse);
    });

    $("#getSnippets").on("click", function () {
        DEMO.doGet("/test/snippets", showResponse);
    });

    $("#getVersion").on("click", function () {
        DEMO.doGet("/test/versions", showResponse);
    });

    $("#resizeGif").on("click", function () {
        const json = {
            "base64String": sampleText.val(),
            "width": 150
        }
        DEMO.doPut("/test/resize-gif", json, showResponse);
    });

    $("#uploadGif").on("click", function () {
        const json = {
            "base64String": sampleText.val(),
            "filename": "testserver.gif"
        }
        DEMO.doPut("/test/upload-gif", json, showResponse);
    });

    $("button#copySample").on("click", (e) => {
        copySample(e);
    }
    );

    $("button#copyResponse").on("click", (e) => {
        copyResponse(e);
    }
    );

    sampleText = $("textarea#sampleText");
    sampleText.val(ts_jsonText);
    responseText = $("textarea#responseText")

    setToolTips();
});

function showResponse(json) {
    console.log(json);
    responseText.val(JSON.stringify(json, null, 2));
}

function copySample(e) {
    const textArea = document.getElementById("sampleText");
    let text = getSelectedText(textArea);
    if (!text) {
        MISC.showDialog("There is nothing to copy.", e.target, 3000, textArea);
        return;
    }
    navigator.clipboard.writeText(text);
    let isAll = textArea.selectionStart == textArea.selectionEnd;
    MISC.showDialog(`${isAll ? "All the" : "The selected"} 'Sample' text was copied to the clipboard!`, e.target, 3000, textArea);
}

function copyResponse(e) {
    let textArea = document.getElementById("responseText");
    let text = getSelectedText(textArea);
    if (!text) {
        MISC.showDialog("There is nothing to copy.", e.target, 3000, textArea);
        return;
    }
    if (e.ctrlKey) {
        text = getUnescapedString(text);
    }
    navigator.clipboard.writeText(text);
    let isAll = textArea.selectionStart == textArea.selectionEnd;
    MISC.showDialog(`${isAll ? "All the" : "The selected"} 'Response' text was copied ${e.ctrlKey ? "(unescaped)" : ""} to the clipboard!`, e.target, 3000, textArea);
}

function getUnescapedString(escapedString) {
    if (!escapedString)
        return null;
    escapedString = escapedString.replace(/\\\\/g, "");
    return escapedString.replace(/\\"/g, '"').replace(/\\'/g, '\'').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
}

function getSelectedText(textArea) {
    // Obtain index of the first selected character.
    let start = textArea.selectionStart;
    // Obtain index of the last selected character.
    let finish = textArea.selectionEnd;
    // Return selected text.
    return (start != finish) ? textArea.value.substring(start, finish) : textArea.value;
}

function setToolTips() {
    $("#clearscreen").tooltip({
        content: "<b>Clears</b> the <i>Test Server</i> console window."
            + "<p class='small'>[Uses: '/test/clear' route].</p>"
    });
    $("#getAbout").tooltip({
        content: "Gets <b>About</b> html data from the <i>Test Server</i>."
            + "<p class='small'>[Uses: '/test/about' route].</p>"
    });
    $("#getArray").tooltip({
        content: "Gets an <b>Array</b> from the <i>Test Server</i>."
            + "<p class='small'>[Uses: '/test/array' route].</p>"
    });
    $("#getJson").tooltip({
        content: "Gets a <b>Json</b> object from the <i>Test Server</i>."
            + "<p class='small'>[Uses: '/test/json' route].</p>"
    });
    $("#getSnippets").tooltip({
        content: "Gets all the <b>Snippets</b> from DevTools."
            + "<p class='small'>[Uses: '/test/snippets' route].</p>"
    });
    $("#getVersion").tooltip({
        content: "Gets the <b>version</b> of each module referenced in the <i>Test Server's</i> package.json file."
            + "<p class='small'>[Uses: '/test/version' route].</p>"
    });
    $("#copySample").tooltip({ content: "Click to copy all the <b>'Sample'</b> text to the clipboard …" });
    $("#sampleText").tooltip({ content: "Contains the base64string used for test purposes." });
    $("#resizeGif").tooltip({
        content: "Resizes the image (i.e., scales it by 50%), represented by the base64string"
            + "<p class='small'>[Uses: '/test/resize-gif' route].</p>"
    });
    $("#uploadGif").tooltip({
        content: "Uploads the GIF data (Base64String) to the <i>Test Server</i>."
            + "<p class='small'>[Uses: '/test/upload-gif'] route.</p>"
    });
    $("#copyResponse").tooltip({
        content: "Click to copy <i>all</i> or just the <i>selected</i> <b>'Response'</b> text to the clipboard."
            + "<p class='small'>(Hold down the control key to&nbsp;<b>unescape</b>&nbsp;the copied text) …</p>"
    });
    $("#responseText").tooltip({ content: "Shows the response received from the <i>Test Server</i>." });
}
