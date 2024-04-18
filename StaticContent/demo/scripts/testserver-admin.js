// ====================================================================================================
// TestServer-admin.js
// ====================================================================================================
var DEMO = window.DEMO;

var sampleText;

$(function() {
    DEMO.loadCommon();

    $("#clearscreen").on("click", function() {
        DEMO.doGet("/test/clear", foo);
    });

    $("#getAbout").on("click", function() {
        DEMO.doGet("/test/about", foo);
    });

    $("#getJson").on("click", function() {
        DEMO.doGet("/test/json", foo);
    });

    $("#getArray").on("click", function() {
        DEMO.doGet("/test/array", foo);
    });

    $("#getSnippets").on("click", function() {
        DEMO.doGet("/test/snippets", foo2);
    });

    $("#getVersion").on("click", function() {
        DEMO.doGet("/test/versions", foo);
    });

    $("#resizeGif").on("click", function() {
        const json = {
            "base64String": sampleText.val(),
            "width": 150
        }
        DEMO.doPut("/test/resize-gif", json, foo);
    });

    $("#uploadGif").on("click", function() {
        const json = {
            "base64String": sampleText.val(),
            "filename": "testserver.gif"
        }
        DEMO.doPut("/test/upload-gif", json, foo);
    });

    sampleText = $("textarea#sampleText")
    sampleText.val(ts_jsonText);
});

function foo(data) {
    $("textarea#responseText").val(data);
}
function foo2(data) {
    let jsonL1 = {
        "snippets": {}
    }
    let jsonL2 = JSON.parse(data).sort((a,b)=>{
        if (a.name < b.name) {
            return -1;
        }
    }
    );
    jsonL1.snippets = jsonL2;

    console.log(jsonL1);
    $("textarea#responseText").val(JSON.stringify(jsonL1));
}
