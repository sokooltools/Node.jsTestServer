// =======================================================================================================
// AboutInfo.js
// =======================================================================================================
var CFG = window.CFG;
var CMN = window.CMN;
var MEM = window.MEM;

var ABT = {};
ABT.xml = null;
ABT.json = null;

ABT.msgs = {
	NOT_LICENSED: 0,
	LICENSED: 1,
	INVALID_LICENSE_FILE: 2,
	UPDATING_LICENSE: 3
};

// -------------------------------------------------------------------------------------------
// Handles the event raised when the "Help" button is clicked.
// -------------------------------------------------------------------------------------------
$("#abt_btnHelp").on("click", function () {
	window.open("help/aboutinfo.htm");
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the "Refresh" button is clicked.
// -------------------------------------------------------------------------------------------
$("#abt_btnRefresh").on("click", function () {
	CFG.performFunction(ABT.loadPage, CFG.getCaption(CMN.msgs.REFRESHING));
	ABT.collapseTables();
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the "Print" button is clicked.
// -------------------------------------------------------------------------------------------
$("#abt_btnPrint").on("click", function () {
	window.print();
	return false;
});

// -------------------------------------------------------------------------------------------
// Loads the "AboutInfo" xml object via AJAX call.
// -------------------------------------------------------------------------------------------
ABT.loadPage = function () {
	$.ajax({
		type: "GET",
		url: "/services/network/aboutinfo?lang=" + CFG.getLanguage(),
		dataType: "xml",
		async: false,
		cache: false,
		success: function (xml) {
			if (CMN.isMockMode()) {
				xml = ABT.addMockDataValuesToXml(xml);
			}
			ABT.xml = xml;
			ABT.loadPageFromXml(xml);
			ABT.loadPageData();
		},
		error: function (jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads data into page using the specified "AboutInfo" xml object.
// -------------------------------------------------------------------------------------------
ABT.loadPageFromXml = function (xml) {
	var nodes = ["ModelNumber", "Memory", "Assemblies", "Download"];
	for (var i in nodes) {
		if (nodes.hasOwnProperty(i)) {
			var node = nodes[i];
			var sel = $("#abt_txt" + node);
			if (!sel.length) {
				$("#abt_" + node + "Data").before(ABT.getExpandElemHtml(node, $(xml).find(node).text()));
			}
			switch (node) {
				case "ModelNumber":
					$("#abt_tblModelNumber").replaceWith(ABT.getModelNumberDataHtml(xml));
					break;
				case "Download":
					$("#abt_tblDownload").replaceWith(ABT.getDownloadDataHtml(xml));
					break;
				case "Memory":
					$("#abt_tblMemory").replaceWith(ABT.getMemoryDataHtml(xml));
					break;
				case "Assemblies":
					if ((($(xml).find(node).attr("Visible")) || "false").toLowerCase() === "true") {
						$("#abt_tblAssembliesData").replaceWith(ABT.getAssembliesDataHtml(xml));
						$("#abt_Assemblies").css("display", "block");
					}
					break;
			}
		}
	}

	ABT.clearFileInputs($("#frmAboutInfo"));
	CFG.setLabelsAndTitles(xml);

	// Check cookie to see if a reboot has been requested by a license update.
	var isReboot = CMN.getCookie(document, "reboot") === "true";
	if (isReboot) {
		CMN.setCookie(document, "reboot", "false", null);
		CFG.doReboot();
	}
};

// -------------------------------------------------------------------------------------------
// Gets the data to load into the page.
// -------------------------------------------------------------------------------------------
ABT.loadPageData = function () {
	$.ajax({
		type: "GET",
		url: "/services/network/aboutdata?lang=" + CFG.getLanguage(),
		dataType: "json",
		async: false,
		cache: false,
		success: function (json) {
			ABT.loadPageFromJson(json);
		},
		error: function (jqXHR) {
			CFG.handleError(jqXHR);
		}
	});
};

// -------------------------------------------------------------------------------------------
// Loads the data into page using the specified json object.
// -------------------------------------------------------------------------------------------
ABT.loadPageFromJson = function (json) {
	$("#abt_txtModelNumber").text(ABT.TrimModelNumber(json.modelnumber));
	$("#abt_txtSerialNumber").text(json.serialnumber);
	$("#abt_txtWinCEVersion").text(json.winceversion);
	$("#abt_txtPlatform").text(json.platform);
	$("#abt_txtPacFirmware").text(json.pacfirmware);
	$("#abt_txtXpsFirmware").text(json.xpsfirmware);
	ABT.json = json;
};

// -------------------------------------------------------------------------------------------
// Handles the event raised when the 'Update License' input box value changes. (Used for
// enabling the 'Update' button).
// -------------------------------------------------------------------------------------------
$("#abt_txtLicenseFile").on("change", function () {
	window.setTimeout(function () {
		$("#abt_btnLicenseFile").prop("disabled", ($("#abt_txtLicenseFile").val() === EMPTY));
	}, 10);
});

// -------------------------------------------------------------------------------------------
// Handles the event raised when the form is submitted by clicking the 'Update' button.
// (NOTE: 'UpdateLicense.aspx' file is actually called upon to perform the update since AJAX
// methods to upload files does not work with versions prior to IE 10!)
// -------------------------------------------------------------------------------------------
$("#frmAboutInfo").submit(function (e) {
	var licenseFile = $("#abt_txtLicenseFile").val();
	if (licenseFile.length > 0) {
		if (licenseFile.split('\\').pop().toLowerCase() === "license.xml") {
			if (CMN.isMockMode()) {
				CFG.showInfo(ABT.xml);
				ABT.loadPage();
			} else {
				e.target.submit();
				CMN.showBusy(CMN.lookup(ABT.xml, ABT.msgs.UPDATING_LICENSE));
			}
		} else {
			CFG.showInfo(ABT.xml, ABT.msgs.INVALID_LICENSE_FILE, licenseFile.split('\\').pop());
		}
	}
	return false;
});

// -------------------------------------------------------------------------------------------
//  Clears all file-based input fields on the specified form.
// -------------------------------------------------------------------------------------------
ABT.clearFileInputs = function ($frm) {
	$frm.find('input[type="file"]').each(function () {
		$(this).wrap("<form>").closest("form").get(0).reset();
		$(this).unwrap();
	});
};

// -------------------------------------------------------------------------------------------
// Fixes a model number which is not extended by removing the last six characters.
// -------------------------------------------------------------------------------------------
ABT.TrimModelNumber = function (modelNumber) {
	if (modelNumber.length === 21 && modelNumber.substr(14, 1) != "X")
		modelNumber = modelNumber.substr(0, 15);
	return modelNumber;
};

// -------------------------------------------------------------------------------------------
// Gets the html for an expandable element.
// -------------------------------------------------------------------------------------------
ABT.getExpandElemHtml = function (tag, value) {
	var str = "<tr>";
	str += "<td id=\"abt_lnk" + tag + "\" class=\"abt_lnkAll\" onclick=\"ABT.toggleTable('" + tag + "');\">";
	str += "<a  id=\"abt_lbl" + tag + "\"></a></td>";
	str += "<td id=\"abt_txt" + tag + "\" class=\"abt_cellData\">" + value + "</td>";
	str += "</tr>";
	return str;
};

// -------------------------------------------------------------------------------------------
// Gets "Model Number" data html table from the xml attributes.
// -------------------------------------------------------------------------------------------
ABT.getModelNumberDataHtml = function (xml) {
	var isExtended = false;
	var str = "<table id=\"abt_tblModelNumber\">";
	var nodes = $(xml).find("ModelNumberItems");
	nodes = nodes.children();
	$(nodes).each(
		function () {
			str += "<tr>";
			str += "<td id=\"abt_lbl" + $(this).attr("Id") + "\" class=\"abt_modRowHeader\"";
			str += " title=\"" + CFG.getToolTip($(this)) + "\">";
			str += $(this).attr("lbl");
			str += "</td>";
			str += "<td class=\"abt_modCellData\">";
			str += $(this).text();
			str += "</td>";
			str += "</tr>";
			if ($(this).attr("Id") == "RESERVED" && $(this).text() == "X")
				isExtended = true;
		});
	if (isExtended) {
		str += ABT.getModelNumberExtDataLinkHtml();
		str += ABT.getModelNumberExtDataHtml(xml);
	}
	str += "</table>";
	return str;
};

// -------------------------------------------------------------------------------------------
// Gets "Extended Model Number" data link html table from the xml attributes.
// -------------------------------------------------------------------------------------------
ABT.getModelNumberExtDataLinkHtml = function () {
	var str = "<tr id=\"abt_ModelNumberExt\" >";
	str += "<td id=\"abt_lnkModelNumberExt\" class=\"abt_modRowHeader abt_lnkAll\"";
	str += " onclick=\"ABT.toggleTable('ModelNumberExt');\"";
	str += " title=\"Extended Model Number\" style=\"text-indent:-10px;\"";
	str += ">+</td>";
	str += "<td class=\"abt_modCellData\"/>";
	str += "</tr>";
	return str;
};

// -------------------------------------------------------------------------------------------
// Gets "Extended Model Number" data html table from the xml attributes.
// -------------------------------------------------------------------------------------------
ABT.getModelNumberExtDataHtml = function (xml) {
	var str = "<tr id=\"abt_ModelNumberExtData\" style=\"display: none;\">";
	str += "<td colspan=\"2\">"; //
	str += "<table id=\"abt_tblModelNumberExt\" cellspacing=\"0\" cellpadding=\"4\">";
	str += "<tr>";
	str += "	<td class=\"abt_modRowH\" colspan=\"2\">Software Options</td>";
	str += "	<td class=\"abt_modRowH\" colspan=\"2\">Communication Options</td>";
	str += "</tr>";
	var nodes = $(xml).find("ModelNumberItemsExt").children();
	for (var i = 0, len = 8; i < len; i++) {
		var node = $(nodes)[i + 8];
		str += "<tr>";
		str += "<td class=\"abt_modCell1\" title=\"" + ABT.getToolTip(node) + "\">";
		str += node.getAttribute("lbl");
		str += "</td>";
		str += "<td class=\"abt_modCell2\">";
		str += node.textContent === "1" ? CMN.lookup(ABT.xml, ABT.msgs.LICENSED) : CMN.lookup(ABT.xml, ABT.msgs.NOT_LICENSED);
		str += "</td>";
		node = $(nodes)[i];
		str += "<td class=\"abt_modCell3\" title=\"" + ABT.getToolTip(node) + "\">";
		str += node.getAttribute("lbl");
		str += "</td>";
		str += "<td class=\"abt_modCell4\">";
		str += node.textContent === "1" ? CMN.lookup(ABT.xml, ABT.msgs.LICENSED) : CMN.lookup(ABT.xml, ABT.msgs.NOT_LICENSED);
		str += "</td>";
		str += "</tr>";
	}
	str += "</table>";
	str += "</td>";
	str += "</tr>";
	return str;
};

// -------------------------------------------------------------------------------------------
// Returns the tooltip text for placing into a title attribute from the specified xml node.
// (If the tooltip text is empty or missing then the label text is returned).
// -------------------------------------------------------------------------------------------
ABT.getToolTip = function (node) {
	if (!node) return "";
	var title = node.getAttribute("ttp");
	return title === "" ? node.getAttribute("lbl") : title;
};

// -------------------------------------------------------------------------------------------
// Gets "Assembly" data html table from the xml attributes.
// -------------------------------------------------------------------------------------------
ABT.getAssembliesDataHtml = function (xml) {
	var str = "<table id=\"abt_tblAssembliesData\">";
	str += "<thead>";
	str += "<tr class=\"abt_tr1\">";
	var nodes = $(xml).find("AssembliesHeader");
	str += "<th class=\"abt_th2\">" + nodes.attr("Id") + "</th>";
	str += "<th class=\"abt_th3\">" + nodes.attr("Version") + "</th>";
	str += "<th class=\"abt_th4\">" + nodes.attr("ModDate") + "</th>";
	str += "</tr>";
	str += "</thead>";
	str += "<tbody>";
	nodes = $(xml).find("Assemblies").children();
	$(nodes).each(
		function () {
			str += "</td><td class=\"abt_td2\" title=\"";
			str += $(this).attr("Id") + "\">";
			str += $(this).attr("lbl");
			str += "</td><td class=\"abt_td3\">";
			str += $(this).attr("Version");
			str += "</td><td class=\"abt_td4\">";
			str += $(this).attr("ModDate");
			str += "</td></tr>";
		});
	str += "</tbody>";
	str += "</table>";
	return str;
};

// -------------------------------------------------------------------------------------------
// Gets "Memory" data html table from the xml attributes.
// -------------------------------------------------------------------------------------------
ABT.getMemoryDataHtml = function (xml) {
	var str = "<table id=\"abt_tblMemory\">";
	var nodes = $(xml).find("MemoryItems");
	nodes = nodes.children();
	$(nodes).each(
		function () {
			str += "<tr>";
			str += "<td id=\"abt_lblMemh" + $(this).attr("Id") + "\" class=\"abt_memRowHeader\"";
			str += " title=\"" + CFG.getToolTip($(this)) + "\">";
			str += $(this).attr("lbl");
			str += "</td>";
			str += "<td id=\"abt_lblMem" + $(this).attr("Id") + "\" class=\"abt_memCellData\">";
			str += "" + CMN.numberWithCommas($(this).text());
			str += "</td>";
			str += "</tr>";
		});
	str += "</table>";
	return str;
};

// -------------------------------------------------------------------------------------------
// Gets the "Download" data html table from the xml attributes.
// -------------------------------------------------------------------------------------------
ABT.getDownloadDataHtml = function (xml) {
	var str = "<table id=\"abt_tblDownload\">";
	var nodes = $(xml).find("DownloadItems");
	nodes = nodes.children();
	$(nodes).each(
		function () {
			let fname = $(this).attr("Id").replace(/\\/g, "\\\\");
			str += "<tr>";
			str += "<td class=\"abt_lnkDownloadData abt_lnkAll\">";
			//str += "<a onclick=\"ABT.download('" + $(this).attr("Id").replace(/\\/g, "\\\\") + "');\"";
			str += "<a href=\"download?fn="+ fname + "\"";
			str += " title=\"" + CFG.getToolTip($(this)) + "\">";
			str += "" + $(this).attr("lbl");
			str += "</a>";
			str += "</td>";
			str += "</tr>";
		});
	str += "</table>";
	return str;
};

// -------------------------------------------------------------------------------------------
// Toggles the display of a particular data table.
// -------------------------------------------------------------------------------------------
ABT.toggleTable = function (tag) {
	var el = document.getElementById("abt_" + tag + "Data");
	if (!el)
		return;
	var sel = $("#abt_lnk" + tag);
	if (el.style.display === "none") {
		sel[0].innerText = (sel[0].innerText.replace("+", "-"));
		el.style.display = "block"; // ""
	} else {
		sel[0].innerText = (sel[0].innerText.replace("-", "+"));
		el.style.display = "none";
	}
	sel.toggleClass("abt_lnkExpanded");
	if (tag === "Memory" && el.style.display === "block") {
		MEM.startAutoRefresh("ABT.toggleTable");
	}
};

// -------------------------------------------------------------------------------------------
// Collapses the display of all data tables.
// -------------------------------------------------------------------------------------------
ABT.collapseTables = function () {
	var nodes = ["ModelNumber", "Assemblies", "Download", "Memory"];
	for (var i in nodes) {
		if (nodes.hasOwnProperty(i)) {
			var tag = nodes[i];
			var el = document.getElementById("abt_" + tag + "Data");
			if (el && el.style.display !== "none") {
				var sel = $("#abt_lnk" + tag);
				sel[0].innerText = (sel[0].innerText.replace("-", "+"));
				el.style.display = "none";
				sel.toggleClass("abt_lnkExpanded");
			}
		}
	}
};

// -------------------------------------------------------------------------------------------
// Downloads the file corresponding to the specified file name to the user's computer.
// -------------------------------------------------------------------------------------------
ABT.download = function (fName) {
	let route = `${CMN.isMockMode() ? "/download?fn=" : "/download.aspx?fn="}${fName}`;
	window.location.href = `${window.location.origin}${route}`;
};

// -------------------------------------------------------------------------------------------
// Get specialized information for printing.
// -------------------------------------------------------------------------------------------
ABT.getHtmlForPrint = function () {
	var html = "<!DOCTYPE html>\r\n";
	html += "<html>\r\n";
	html += "<head>\r\n";
	//html += "<meta http-equiv=\"content-type\" content=\"text/html; charset=iso-8859-1\">\r\n";
	html += "<title>Parker PAC Configuration</title>\r\n";
	html += "<link rel=\"shortcut icon\" href=\"/favicon.ico\">\r\n";
	html += "<link rel=\"stylesheet\" type=\"text/css\" href=\"themes/tucson/configtool.css\">\r\n";
	html += "</head>\r\n";
	html += "<body style=\"background-color:white;\">\r\n";
	html += $("#abt_tblAssembliesData")[0].outerHTML + "\r\n";
	html += "<script type=\"text/javascript\">window.onload=function(){window.print();return false;}</script>\r\n";
	html += "</body>\r\n";
	html += "</html>\r\n";
	return html;
};

// -------------------------------------------------------------------------------------------
// Adds values to the about info xml and returns it.
// -------------------------------------------------------------------------------------------
ABT.addMockDataValuesToXml = function (xml1) {
	var xml2 = CMN.getXml("/services/network/demo/aboutinfo");
	// Process Model Number Data.
	var itms = $(xml1).find("ModelNumberItem");
	var id, i;
	for (i = 0; i < itms.length; i++) {
		id = $(itms)[i].attributes.getNamedItem("Id").value;
		$(xml1).find("ModelNumberItem[Id='" + id + "']").text($(xml2).find("ModelNumberItem[Id='" + id + "']").text());
	}
	// Process Extended Model Number Data.
	itms = $(xml1).find("ModelNumberItemExt");
	for (i = 0; i < itms.length; i++) {
		id = $(itms)[i].attributes.getNamedItem("Id").value;
		$(xml1).find("ModelNumberItemExt[Id='" + id + "']").text($(xml2).find("ModelNumberItemExt[Id='" + id + "']").text());
	}
	// Process Aseemblies Data.
	$(xml1).find("Assemblies").attr("Visible", $(xml2).find("Assemblies").attr("Visible"));
	itms = $(xml1).find("Assembly");
	for (i = 0; i < itms.length; i++) {
		id = $(itms)[i].getAttribute("Id").replace(/\\/g, "\\\\");
		var sel1 = $(xml1).find("Assembly[Id='" + id + "']");
		var sel2 = $(xml2).find("Assembly[Id='" + id + "']");
		sel1.attr("Version", sel2.attr("Version"));
		sel1.attr("ModDate", sel2.attr("ModDate"));
	}
	return xml1;
};

ABT.addHoverToLinks = function () {
	$("td.abt_lnkAll").hover(function () {
		$(this).addClass("abt_lnkHover");
	}, function () {
		$(this).removeClass("abt_lnkHover");
	});
};

// -------------------------------------------------------------------------------------------
// Loads the "About the PAC" page.
// -------------------------------------------------------------------------------------------
$(document).ready(function () {
	CFG.performFunction(function () {
		CMN.loadScript("../scripts/tucson/memoryinfo.js", true, {});
		ABT.loadPage();
		ABT.addHoverToLinks();
	}, CFG.getCaption(CMN.msgs.LOADING));
});
