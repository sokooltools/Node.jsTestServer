// ====================================================================================================
// colortest.js
// ====================================================================================================
window.DEMO.loadCommon();

$("#run").on("click", function () {
    $(".block").animate({ backgroundColor: "yellow" }, 1000)
        .delay(200)
        .animate({ backgroundColor: "transparent" }, 500)
        .delay(200)
        .animate({ backgroundColor: "blue" }, 1000);
});