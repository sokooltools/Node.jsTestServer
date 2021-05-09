// ====================================================================================================
// Help.js
// ====================================================================================================
//var HLP = {};

$(document).ready(function() {

	//$('#help_Toolbar').load('toolbar.htm');

	// Add tooltips.
	$("#help_btnScrollToTop").prop("title", "Click to go to the top of this page...");
	$("#help_btnShowCommon").prop("title", 'Click to show "Global Help" (help which is common to all pages)...');
	$("#help_btnClose").prop("title", "Click to close this online help...");
	var pg = getQueryStringByName("tok");
	$("#help_btnGoBack").text(pg).prop("title", 'Click to go back to the "' + pg + '"');

	$("#help_Toolbar").on("click", function(e) {
		if (e.ctrlKey)
			showImageNames();
		return false;
	});

	$("#help_btnShowCommon").on("click", function() {
		var pA = window.location.pathname.split("/");
		location.href = "common.htm?tok=" + document.title + "&ret=" + pA[pA.length - 1];
		return false;
	});

	$("#help_btnGoBack").on("click", function() {
		location.href = getQueryStringByName("ret");
	});

	// Add event to scroll to top of page when any caption is clicked.
	$("#help_btnScrollToTop, .li2 > a").on("click", function() {
		window.scrollTo(0, 0);
		return false;
	});

	// Add event to close the window when the 'Close' button is clicked.
	$("#help_btnClose").on("click", function() {
		window.close();
		return false;
	});

	// -------------------------------------------------------------------------------------------
	// Creates and automatically adds a 'Table of Contents' to the page.
	// -------------------------------------------------------------------------------------------
	(function() {
		var sel = $("LI.li2 > a");
		//sel.prop('title', "Click to go to the top of this page...");
		sel.prop("href", "#");
		var mid = Math.round(sel.length / 2);
		var str = "<table id='help_toc_table'>";
		str += "<caption id='help_toc_caption'>Table of Contents</caption>";
		str += "<tr>";
		str += "<td class='td1'>";
		str += "<ol start='1'>";
		var i;
		var sec;
		for (i = 0; i < mid; i++) {
			sel[i].id = "A" + (i + 1);
			if (sel[i].innerHTML !== "")
				str += "<li class='li1'><a href='#" + sel[i].id + "'>" + sel[i].innerHTML + "</a></li>";
			else {
				sec = "Step " + (i + 1);
				str += "<li class='li1'><a href='#" + sel[i].id + "'>" + sec + "</a></li>";
				sel[i].innerHTML = sec;
			}
		}
		str += "</ol>";
		str += "</td>";
		str += "<td class='td1'>";
		str += "<ol start='" + (mid + 1) + "'>";
		for (i = mid; i < sel.length; i++) {
			sel[i].id = "A" + (i + 1);
			if (sel[i].innerHTML !== "")
				str += "<li class='li1'><a href='#" + sel[i].id + "'>" + sel[i].innerHTML + "</a></li>";
			else {
				sec = "Step " + (i + 1);
				str += "<li class='li1'><a href='#" + sel[i].id + "'>" + sec + "</a></li>";
				sel[i].innerHTML = sec;
			}
		}
		str += "</ol>";
		str += "</td>";
		str += "</tr>";
		str += "</table>";
		$("#help_toc_table").replaceWith(str);
		sel = $("LI.li1 > a");
		sel.prop("title", "Click to jump directly to this topic on the page...");
		sel.on("click", function() {
			scrollToElement(this.hash.replace("#", ""));
		});
	})();

	//$('#titleee a').trigger('click');
	//
	//	(function updatePage() {
	//		// Create a dictionary from the table of contents.
	//		var sel = $("LI.li1 > a");
	//		var dict = [];
	//		for (var i = 0; i < sel.length; i++) {
	//			dict.push({
	//				key: sel[i].hash,
	//				value: sel[i].outerText
	//			});
	//			$(sel[i]).prop('title', "Click to jump directly to this topic on the page...");
	//		}
	//		// Update the page using the dictionary.
	//		for (var n = 0; n < dict.length; n++) {
	//			$(dict[n].key).prop('title', "Click to return to top of this page...");
	//			$(dict[n].key).prop('href', "#top");
	//			$(dict[n].key).text(dict[n].value);
	//		}
	//		$("#btnClose").prop('title', "Click to close this online help...");
	//	} ());

	$("#help_btnShowCommon").text("Global Help");

	$("body").append("<a href='#' title='Click to go to the top of this page...' id='hb-gotop' style='display:none;'>Scroll to Top</a>");

	$.fn.scrollToTop = function()
	{
		$(this).hide().removeAttr("href");
		if ($(window).scrollTop() !== "0") {
			$(this).fadeIn("slow");
		}
		var scrollDiv = $(this);
		$(window).scroll(
			function()
			{
				if ($(window).scrollTop() === "0") {
					$(scrollDiv).fadeOut("slow");
				}
				else {
					$(scrollDiv).fadeIn("slow");
				}
			}
		);
		$(this).on("click", 
			function() {
				$("html, body").animate(
				{
					scrollTop: 0
				}, "slow");
			}
		);
	}
	$("#hb-gotop").scrollToTop();
});

// -------------------------------------------------------------------------------------------
// Returns the query string content corresponding to the specified name.
// -------------------------------------------------------------------------------------------
function getQueryStringByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

// Scroll the selected topic into view adjusting for the header bar.
function scrollToElement(elId) {
	document.getElementById(elId).scrollIntoView(true);
	if ($(window).height() + $(window).scrollTop() !== $(document).height()) {
		$("html, body").animate({
			scrollTop: "-=40"
		}, "fast");
	}
	//		if (window.navigator.userAgent.indexOf('MSIE') != -1) {
	//			var url = window.unescape(window.self.location.hash);
	//			if (url != "") {
	//				window.scrollBy(0, -40);
	//			}
	//		}
};

// -------------------------------------------------------------------------------------------
// Shows the name of each image on the page. (This is for debug and thus executed manually).
// -------------------------------------------------------------------------------------------
function showImageNames() {
	if ($("span").hasClass("imns"))
		return;
	var sel1 = $("li.li2 > a");
	var sel2 = $("[src$='.png']");
	for (var i = 0; i < sel1.length; i++) {
		sel1[i].innerHTML += "<span class='imns'> [" + sel2[i].src.substring(sel2[i].src.lastIndexOf("/") + 1) + "]</span>";
	}
	window.console.log("Now showing " + sel2.length + " image names...");
}