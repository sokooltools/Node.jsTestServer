// =======================================================================================================
// tucson.configtool.js
// =======================================================================================================

// -------------------------------------------------------------------------------------------
// Common Internet Explorer Errors
//  12019 - The requested operation cannot be carried out because the handle supplied is not in the correct state.
//  12029 - A connection to server could not be established
//  12031 - FTP Connection to the server was reset..  could not make a connection.
//  12152 - Internet Explorer cannot display this webpage
// -------------------------------------------------------------------------------------------
var CMN = window.CMN;
var SEC = window.SEC;
var UTL = window.UTL;
var CFG = CFG || {};

CFG.xml = null;
CFG.timeoutId = null;

// Make sure required JavaScript modules are loaded.
if (typeof CMN === "undefined") {
    throw "tucsoncommon.js must be loaded first.";
}

// -------------------------------------------------------------------------------------------
// Handles the click event raised when the user clicks the 'Logout' button.
// -------------------------------------------------------------------------------------------
$("#cmn_btnLogout").on("click",
    function () {
        CFG.logout();
    });

// -------------------------------------------------------------------------------------------
/**
* Performs the specified function after confirming the connection to the Web Server.
* @param {} fnc "function to be executed."
* @param {} msg "message displayed on the screen while the function is being performed."
* @returns {} 
*/
CFG.performFunction = function (fnc, msg) {
    CMN.showBusy(msg);
    CFG.timeoutId = window.setTimeout(function () {
        var ipAddress = this.document.location.host;
        const img = new window.Image(); // document.createElement('img');
        img.onload = function () {
            CFG.clearTimeout();
            //jQuery.unblockUI({ onUnblock: fnc });
            if (fnc !== undefined) {
                fnc();
            } else {
                CMN.debugLog("The first parameter in CFG.performFunction() defining what 'function' to perform is undefined.");
            }
            window.jQuery.unblockUI();
        };
        img.onabort = function () {
            CFG.clearTimeout();
            window.jQuery.unblockUI();
        };
        img.onerror = function () {
            CFG.clearTimeout();
            window.jQuery.unblockUI({
                onUnblock: function () {
                    var err = "<div class='img_exclamation'></div><div id='invalid_text'>";
                    err += String.format(CMN.lookup(CFG.xml, CMN.msgs.DEVICE_NOT_RESPONDING), ipAddress) + "</div>";
                    CMN.showDialog(err);
                }
            });
        };
        const gifPath = (ipAddress !== "" ? document.location.protocol + "//" + ipAddress + "/" : "") +
            "themes/base/images/ping.png" +
            CMN.uniqueQueryString();
        img.src = gifPath; // Remember this runs asynchronously!
    },
        500);
};

// -------------------------------------------------------------------------------------------
/**
* Returns a string value obtained from static XML content corresponding to properties of the
* specified 'CMN.msgs' object.
* @param {} msgObj The specific CMN.msgs object (e.g. CMN.msgs.UNKNOWN_ERROR).
* @returns {} 
*/
CFG.lookup = function (msgObj) {
    var result = EMPTY;
    const nodes = $(CFG.xml).find("Messages");
    $(nodes).each(
        function () {
            if ($(this).attr("Key") === msgObj.key) {
                const cn = $(this)[0].childNodes;
                $(cn).each(function () {
                    if (parseInt($(this).attr("Id"), 10) === msgObj.id) {
                        result = window.unescape($(this).text());
                        return;
                    }
                });
                return;
            }
        }
    );
    return result;
};

// -------------------------------------------------------------------------------------------
/**
* Shows the specified error text inside a modal dialog.
* @param {} jqXHR The error text.
* @returns {} 
*/
CFG.showError = function (jqXHR) {
    var msg, w = 640, h = 480;
    if (jqXHR.responseText) {
        // Fix up the response text making it compatible with modal dialog.
        msg = CMN.fixResponseText(jqXHR.responseText);
        if (msg.length === 0) {
            msg = CMN.lookup(CFG.xml, CMN.msgs.UNKNOWN_ERROR) + (jqXHR.status) ? (` : ${jqXHR.status}`) : ".";
            w = 400;
            h = 200;
        }
    } else {
        msg = (jqXHR.statusText) ? jqXHR.statusText : jqXHR;
        w = 400;
        h = 200;
    }
    CMN.showDialog(msg, CMN.lookup(CFG.xml, CMN.msgs.CONFIG_ERROR), w, h);
};

// -------------------------------------------------------------------------------------------
// Clears the timeout based on the current timeout id.
// -------------------------------------------------------------------------------------------
CFG.clearTimeout = function () {
    window.clearTimeout(CFG.timeoutId);
};

// -------------------------------------------------------------------------------------------
// Returns the last tab that was selected by retrieving it from a cookie.
// -------------------------------------------------------------------------------------------
CFG.getSelectedTab = function () {
    var selectedTab = CMN.getCookie(document, "selectedtab");
    selectedTab = (selectedTab) ? parseInt(selectedTab, 10) : 0;
    return selectedTab;
};

// -------------------------------------------------------------------------------------------
// Returns the index the current tab page (e.g. -1, 0, 1, 2, ...).
// -------------------------------------------------------------------------------------------
CFG.getCurrentTabIndex = function () { return $("ul.css-tabs>li>a.current").parent().index(); };

// -------------------------------------------------------------------------------------------
// Returns the short id of the current tab page (e.g. 'NET', 'SYS', 'SEC', ...).
// -------------------------------------------------------------------------------------------
CFG.getCurrentTabId = function () { return $("ul.css-tabs>li>a.current").attr("id"); };

// -------------------------------------------------------------------------------------------
// Returns the name of the current tab page (e.g. 'Network Setings', ...).
// -------------------------------------------------------------------------------------------
CFG.getCurrentTabName = function () { return $("ul.css-tabs>li>a.current").text(); };

// -------------------------------------------------------------------------------------------
// Returns the tooltip text for placing into a title attribute from the specified xml node.
// (If the tooltip text is empty or missing then the label text is returned).
// -------------------------------------------------------------------------------------------
CFG.getToolTip = function (node) {
    const title = node.attr("ttp");
    return title === EMPTY ? node.attr("lbl") : title;
};

// -------------------------------------------------------------------------------------------
// Returns the caption to be displayed in the progress dialog.
// -------------------------------------------------------------------------------------------
CFG.getCaption = function (msg) {
    return CMN.lookup(CFG.xml, msg) + " '<b>" + CFG.getCurrentTabName() + "</b>'... " +
        CMN.lookup(CFG.xml, CMN.msgs.PLEASE_WAIT) + ".";
};

// -------------------------------------------------------------------------------------------
// Returns text formatted for display inside the 'Invalid' dialog.
// -------------------------------------------------------------------------------------------
CFG.getInvalidText = function () {
    var msg = "<div class='img_exclamation'></div><div id='invalid_text'>";
    msg += String.format(CMN.lookup(CFG.xml, CMN.msgs.INVALID_DATA_ERROR), "<b><i>" + CFG.getCurrentTabName() + "</i></b>");
    msg += "</div>";
    return msg;
};

// -------------------------------------------------------------------------------------------
// Shows or hides the name of the user that is currently logged in.
// -------------------------------------------------------------------------------------------
CFG.toggleLoggedInUser = function () {
    if (CFG.getCurrentTabIndex() > 0) {
        const username = CMN.getUsername();
        $("#cmn_lblLoggedInUser").text((username) ? (CMN.lookup(CFG.xml, CMN.msgs.CURRENT_USER) + ": " + username) : EMPTY);
        $("#cmn_btnLogout").css("visibility", "visible");
    } else {
        $("#cmn_lblLoggedInUser").text(""); // "\b"
        $("#cmn_btnLogout").css("visibility", "hidden");
    }
};

// -------------------------------------------------------------------------------------------
// Updates controls on the current page with values obtained from the specified xml file.
// -------------------------------------------------------------------------------------------
CFG.setLabelsAndTitles = function (xml) {
    CFG.toggleLoggedInUser();
    const root = $(xml).find("*")[0].nodeName;
    var grd = null;
    var cols = null;
    if (root === "SecuritySettings") {
        grd = SEC.grid;
        cols = grd.getColumns();
    }
    const nodes = $(xml).find("Controls").children();
    $(nodes).each(
        function () {
            const type = $(this).attr("Type");
            const sel = $(`#${$(this).attr("Id")}`);
            const lbl = $(this).attr("lbl");
            var ttp = $(this).attr("ttp");
            if ((!ttp))
                ttp = lbl;
            switch (type) {
                case "button":
                    {
                        sel.val(lbl);
                        sel.attr("title", ttp);
                        break;
                    }
                case "label":
                case "caption":
                    {
                        sel.text(lbl);
                        sel.attr("title", ttp);
                        break;
                    }
                case "link":
                    {
                        const pfx = sel.hasClass("abt_lnkExpanded") ? "-" : "+";
                        sel.text(pfx + lbl);
                        sel.attr("title", ttp);
                        break;
                    }
                case "column":
                    {
                        if (!cols) break;
                        const clm = cols[grd.getColumnIndex($(this).attr("Id"))];
                        if (!clm) break;
                        clm.name = lbl;
                        clm.toolTip = ttp;
                        break;
                    }
            }
        });
    if (cols && grd) {
        grd.setColumns(cols);
    }
};

// -------------------------------------------------------------------------------------------
// Handles errors returned from the Padarn Server.
// -------------------------------------------------------------------------------------------
CFG.handleError = function (jqXHR) {
    if (jqXHR.status === 401 || jqXHR.status === 403) { // 'Unauthorized' -or- 'Forbidden'
        let msg = "<div class='img_exclamation'></div>";
        msg += "<div id='invalid_text'>";
        msg += CMN.lookup(CFG.xml, jqXHR.status === 401 ? CMN.msgs.INVALID_USERNAME_PASSWORD : CMN.msgs.LOGIN_DISABLED);
        msg += "</div>";
        if (jqXHR.status === 401) {
            CFG.showLogin();
        }
        CFG.showInvalid(msg);
    } else if (jqXHR.status === 408) { // 'Request timeout'.
        CFG.showLogin();
        location.reload(true);
    } else if (jqXHR.status !== 200) {
        CFG.showError(jqXHR);
    }
};

// -------------------------------------------------------------------------------------------
// Shows information pertaining to whether a feature exists or not.
// -------------------------------------------------------------------------------------------
CFG.showInfo = function (xml, id, args) {
    var img = "img_exclamation";
    if (!id) {
        id = CMN.msgs.FEATURE_UNAVAILABLE;
        xml = CFG.xml;
    }
    else if (xml === CFG.xml) {
        switch (id) {
            case CMN.msgs.FEATURE_UNDERCONSTRUCTION:
                img = "img_underconstruction";
                break;
            case CMN.msgs.CONFIG_ERROR:
                img = "img_exclamation";
                break;
        }
    }
    CFG.showInvalid("<div class='" + img + "'></div><div id='invalid_text'>" + String.format(CMN.lookup(xml, id), args) + "</div>");
};

// -------------------------------------------------------------------------------------------
// Shows the specified 'Invalid' message temporarily on the screen meanwhile blocking the UI.
// -------------------------------------------------------------------------------------------
CFG.showInvalid = function (msg) {
    if (!msg)
        msg = CFG.getInvalidText();
    jQuery.blockUI.defaults.css = {};
    jQuery.blockUI.defaults.fadeOut = 800;
    jQuery.blockUI({
        message: msg,
        timeout: 2500,
        theme: false,
        css: {
            width: "500px",
            top: "125px", //$('.errcontainer').position().top + 'px',
            left: ($(window).width() - 532) / 2 + "px",
            padding: 0,
            margin: 0,
            color: "#000000",
            border: "3px solid #aaa",
            backgroundColor: "#ffffff",
            cursor: null
        },
        overlayCSS: { cursor: null },
        onOverlayClick: jQuery.unblockUI
    });
};

// -------------------------------------------------------------------------------------------
// Gets the language from a cookie. Returns "en" if all else fails.
// -------------------------------------------------------------------------------------------
CFG.getLanguage = function () {
    var language = CMN.getCookie(document, "language");
    if (!language) {
        language = $(CFG.xml).find("Languages").attr("id");
        if (language)
            CMN.setCookie(document, "language", language, 30);
    }
    return (language) ? language : "en";
};

// -------------------------------------------------------------------------------------------
// Sets the language and reloads the current page causing the others to reload themselves when they are activated.
// -------------------------------------------------------------------------------------------
CFG.setLanguage = function (language) {
    if (language) {
        CMN.setCookie(document, "language", language, 30);
        CFG.load();
        window.location.reload(true);
    }
};

// -------------------------------------------------------------------------------------------
// Reloads (refreshes) all the tab pages based on whether they were already loaded.
// -------------------------------------------------------------------------------------------
CFG.reloadAllPages = function () {
    $("ul.css-tabs>li>a").each(function () {
        const attr = $(this).attr("id");
        if (attr) {
            /*jslint evil: true */
            const obj = eval(`(${attr})`);
            /*jslint evil: false */
            if ((obj) && typeof obj.loadPage == "function") {
                obj.loadPage();
            }
        }
    });
};

// -------------------------------------------------------------------------------------------
// Loads the 'Tucson Settings' xml object via an AJAX call.
// -------------------------------------------------------------------------------------------
CFG.load = function () {
    $.ajax({
        type: "GET",
        url: "/services/network/configtool?lang=" + CFG.getLanguage(),
        dataType: "xml",
        async: false,
        success: function (data) {
            CFG.setLabelsAndTitles(data);
            CFG.xml = data;
            CFG.loadLanguageCombo();
        },
        error: function (jqXHR) {
            CFG.handleError(jqXHR);
        }
    });
};

// -------------------------------------------------------------------------------------------
// Sets the language combo.
// -------------------------------------------------------------------------------------------
CFG.loadLanguageCombo = function () {
    var options = "";
    var fmt = "<option id='{0}' value='{0}'{2}>{1}</option>";
    var defaultLanguage = CFG.getLanguage();
    var langs;
    if (CMN.isMockMode()) {
        langs = CMN.getJson(`/services/network/languagedata?lang=${defaultLanguage}`);
        for (let key in langs) {
            if (langs.hasOwnProperty(key)) {
                options += String.format(fmt, langs[key].code, langs[key].name, (defaultLanguage === langs[key].code) ? " selected" : "");
            }
        }
    } else {
        const xml = CMN.getXml(`/services/network/languagedata?lang=${defaultLanguage}`);
        //langs = $(xml).find("Languages").children();
        $(xml).find("Languages").children().each(
            function () {
                options += String.format(fmt, $(this).attr("id"), $(this).text(), (defaultLanguage === $(this).attr("id")) ? " selected" : "");
            }
        );
    }

    if (options !== "") {
        options = `<div id='cmn_cboLanguage' class='noPrint'><form action='#'><select id='cmn_cboLanguageOptions'>${options}`;
        options += "</select></form></div>";
        $("#cmn_cboLanguage").replaceWith(options);
    }
    $("#cmn_cboLanguage").languageSwitcher({
        effect: "fade",
        testMode: true,
        onChange: function (evt) {
            $("body").css("cursor", "progress");
            CFG.setLanguage(evt.selectedItem);
            $("body").css("cursor", "default");
        }
    });
};

// -------------------------------------------------------------------------------------------
// Idle timer class.
// -------------------------------------------------------------------------------------------
CFG.Timer = function (m) {
    var self = this;
    var iMax = (typeof m !== "undefined") ? Math.max(parseInt(m, 10), 0) : 300;
    var iInt = parseInt(iMax / 10, 10);
    var iCnt = 0;
    var iId = 0;
    this.max = function (max) {
        if (typeof max !== "undefined") {
            iMax = Math.max(parseInt(max, 10), 0);
            iInt = parseInt(iMax / 10, 10);
            self.restart();
        }
        return iMax;
    };
    this.count = function () { return iCnt; };
    this.reset = function () { iCnt = 0; };
    this.restart = function () {
        if (this.isStarted) {
            self.stop();
            self.start();
        }
    };
    this.start = function () {
        if (iInt > 0)
            iId = window.setInterval(function () {
                iCnt += iInt;
                //CMN.debugLog(iCnt / iInt);
                if (iCnt >= iMax) {
                    CFG.logout();
                }
            },
                iInt * 1000);
        this.isStarted = true;
    };
    this.stop = function () {
        window.clearInterval(iId);
        iId = 0;
        iCnt = 0;
        this.isStarted = false;
    };
    this.isStarted = false;
};

// -------------------------------------------------------------------------------------------
// Shows or hides the specified tab page.
// -------------------------------------------------------------------------------------------
CFG.toggle = function (id, isVisible) {
    const sel = $("li>#" + id);
    if (!isVisible && sel.is(":visible") && CFG.getCurrentTabId() === id) {
        // Need to change the current tab
        var idx = 0;
        $("ul.css-tabs>li").each(function () {
            if ($(this).children().length > 0 && $(this).children()[0].id !== id && $(this).is(":visible")) {
                // Make this tab the current tab by clicking it.
                $("ul.css-tabs").data("tabs").click(idx);  // TODO: RAS 06/08/2017
                return false;
            }
            idx++;
            return true;
        });
    }
    sel.toggle(isVisible);
};

// -------------------------------------------------------------------------------------------
// Logs out of the PAC.
// -------------------------------------------------------------------------------------------
CFG.logout = function () {
    CFG.showLogin();
    location.reload(true);
    $.ajax({
        type: "PUT",
        url: "/services/network/logout",
        contentType: "text/xml",
        global: false,
        async: false,
        cache: false,
        data: null,
        complete: function () { },
        error: function () { }
    });
};

// -------------------------------------------------------------------------------------------
// Hide the Login tab.
// -------------------------------------------------------------------------------------------
CFG.hideLogin = function () {
    CFG.toggle("NET", true);
    CFG.toggle("SYS", true);
    CFG.toggle("INT", false); // false for now.
    CFG.toggle("SEC", true);
    CFG.toggle("ABT", true);
    CFG.toggle("XPS", true);
    CFG.toggle("LGN", false);
    if (CFG.idle)
        CFG.idle.start();
};

// -------------------------------------------------------------------------------------------
// Show the Login tab.
// -------------------------------------------------------------------------------------------
CFG.showLogin = function () {
    if (CFG.idle)
        CFG.idle.stop();
    CFG.toggle("LGN", true);
    CFG.toggle("NET", false);
    CFG.toggle("SYS", false);
    CFG.toggle("INT", false);
    CFG.toggle("SEC", false);
    CFG.toggle("ABT", false);
    CFG.toggle("XPS", false);
    CMN.setCookie(document, "selectedtab", 0, null);
};

// -------------------------------------------------------------------------------------------
// Handles the user clicking the browser's refresh button;
// -------------------------------------------------------------------------------------------
if (CFG.getSelectedTab() > 0) {
    CFG.hideLogin();
} else {
    CFG.showLogin();
}

// -------------------------------------------------------------------------------------------
// Reboots the PAC.
// -------------------------------------------------------------------------------------------
CFG.doReboot = function () {
    var wait = 8000;
    if (!CMN.isMockMode()) {
        wait = 40000;
        $.ajax({
            type: "PUT",
            url: "/services/network/reboot",
            contentType: "text/xml",
            global: false,
            async: true,
            cache: false,
            data: null,
            success: function () { },
            complete: function () { },
            error: function () { }
        });
    }
    CMN.showBusy(CMN.lookup(CFG.xml, CMN.msgs.REBOOTING));
    CFG.timeoutId = window.setTimeout(function () {
        CFG.showLogin();
        location.reload(true); // Reload page from server.
    }, wait);
};

// -------------------------------------------------------------------------------------------
// Automatically sizes the page according to some predetermined values;
// -------------------------------------------------------------------------------------------
CFG.autoSize = function () { return CFG.docSize("x"); };

// -------------------------------------------------------------------------------------------
// Simulates clicking one of the tabs based on the specified tab id;
// -------------------------------------------------------------------------------------------
CFG.clickTab = function (tabId) { $("#" + tabId).trigger("click"); };

// -------------------------------------------------------------------------------------------
// Gets or sets the size (width and height) of the window based on the specified 'w' and 'h' :
// If 'w' and 'h' are numbers, then the window size is set to that width and height.
// If 'w' is a string representing the name of a tab, then the window size is set to the
// default width and height used for that tab (unless 'h' is also specified whereupon 'h' is
// used to override the default width).
// The window size (width and height) are always returned.
// -------------------------------------------------------------------------------------------
CFG.docSize = function (w, h) {
    if (typeof w == "string" || typeof w == "boolean") {
        const z = CFG.defaultDocSize(typeof w == "boolean");
        w = z.width;
        h = z.height;
        top.window.moveTo(0, 0);
    }
    return UTL.docSize(w, h);
};

// -------------------------------------------------------------------------------------------
// Gets the size (width and height) of the window based on defaults for the selected tab or
// optionally to display the document based on the current height of the current tab pane.
// -------------------------------------------------------------------------------------------
CFG.defaultDocSize = function (useOptimal) {
    const w = (CFG.getLanguage() === "en") ? 1008 : 1135;
    var h = 0;
    if ((typeof useOptimal == "boolean" && useOptimal === true) ||
        (typeof useOptimal == "string" && useOptimal.toLowerCase() === "true")) {
        h = $(".css-panes").position().top + $(".css-panes").height() + 14;
    } else {
        switch (CFG.getCurrentTabId()) {
            case "LGN":
                h = 436;
                break;
            case "NET":
                h = 538;
                break;
            case "SYS":
                h = 480;
                break;
            case "SEC":
                h = 769;
                break;
            case "XPS":
                h = 665;
                break;
            case "ABT":
                h = 790;
                break;
        }
    }
    return { width: w, height: h };
};


// -------------------------------------------------------------------------------------------
// Creates and loads the tabs.
// -------------------------------------------------------------------------------------------
//$(function() {  <-- This is the same as: $(document).ready(function() {});
$(function () {
    $("ul.css-tabs").tabs("div.css-panes > div",
        {
            effect: "fade",
            history: false,
            initialIndex: CFG.getSelectedTab(),
            onBeforeClick: function (event, i) {
                //if (typeof DTS != 'undefined') {
                //	var id = (event.srcElement) ? event.srcElement.id : '';
                //	if (id === 'SYS') { // id of the System Settings pane. // TODO:
                //		DTS.startAutoRefresh();
                //	} else {
                //		DTS.stopAutoRefresh();
                //	}
                //}
                //if (i === 2) return false;  // Do this to disable tab index 2
                // Get the pane to be opened
                const pane = this.getPanes().eq(i);
                // Remove the next 'if' clause to load the pane every time.
                //if (pane.is(":empty")) {
                if (pane[0].children.length === 0) {
                    const sel = this.getTabs().eq(i);
                    CMN.showBusy(String.format("{0} '<b>{1}</b>'... {2}.",
                        CMN.lookup(CFG.xml, CMN.msgs.LOADING),
                        sel[0].innerText,
                        CMN.lookup(CFG.xml, CMN.msgs.PLEASE_WAIT)));
                    // Load it with a page specified in the tab's href attribute.
                    pane.load(sel.attr("href"));
                }
                return true;
            },
            onClick: (function (event, i) {
                // Pass null for cookie to be deleted when browser is closed.
                CMN.setCookie(document, "selectedtab", i, null);
                $("ul.css-tabs").trigger("tabChanged", i);
                return true;
            })
        });

    // Create new idle timer.
    CFG.idle = new CFG.Timer();

    // Reset the idle timer on mouse movement or keypress.
    $(this).mousemove(function () {
        CFG.idle.reset();
    });
    $(this).keypress(function () {
        CFG.idle.reset();
    });
    $("body").show();
});


CFG.load();

// -------------------------------------------------------------------------------------------
// The following is special handling required for IE10.
// -------------------------------------------------------------------------------------------
/*@cc_on
if (/^10/.test(@_jscript_version)) {
    $('head').append('<link rel="stylesheet" type="text/css" href="themes/tucson/configtool10.css">');
}
@*/

// sourceURL=tucson.configtool.js