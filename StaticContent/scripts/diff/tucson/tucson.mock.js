// =======================================================================================================
// tucson.mock.js
// =======================================================================================================
var CMN = window.CMN;

var MOCK = MOCK || {};

// -------------------------------------------------------------------------------------------
// Returns an indication as to whether this application is running in 'Mock' data mode.
// (Used primarily for testing purposes).
// -------------------------------------------------------------------------------------------
MOCK.isMockMode = function() {
	return (!document.domain || document.domain === "localhost" || document.domain === "127.0.0.1");
};

// -------------------------------------------------------------------------------------------
// Adds languages to the specified xml.
// -------------------------------------------------------------------------------------------
MOCK.addLanguagesToXml = function(xml1, lang) {
	var xml2 = CMN.getXml("/services/network/demo/supportedlanguages");
	var token = $(xml2).find("Languages[id='" + lang + "']");
	if ((token))
		$(xml1).find("ConfigTool")[0].appendChild(token[0]);
	return xml1;
};

// -------------------------------------------------------------------------------------------
// Adds values to the xpress settings xml and returns it.
// -------------------------------------------------------------------------------------------
MOCK.addValuesToXpressSettingsXml = function(xml1) {
	var xml2 = CMN.getXml("/services/network/demo/xpresssettings");
	$(xml2).children().children().each(function() { $(xml1)[0].documentElement.appendChild(this); });
	return xml1;
};

// -------------------------------------------------------------------------------------------
// Adds values to the about info xml and returns it.
// -------------------------------------------------------------------------------------------
MOCK.addValuesToAboutInfoXml = function(xml1) {
	var xml2 = CMN.getXml("/services/network/demo/aboutinfo");
	var itms = ["SerialNumber", "Platform", "WinCEVersion"];
	for (var itm in itms) {
		if (itms.hasOwnProperty(itm)) {
			var node = itms[itm];
			$(xml1).find(node).text($(xml2).find(node).text());
		}
	}
	// Process Model Number Data.
	$(xml1).find("ModelNumber").text($(xml2).find("ModelNumber").text());
	itms = $(xml1).find("ModelNumberItem");
	var id;
	var i;
	for (i = 0; i < itms.length; i++) {
		id = $(itms)[i].attributes.getNamedItem("Id").value;
		$(xml1).find("ModelNumberItem[Id='" + id + "']").text($(xml2).find("ModelNumberItem[Id='" + id + "']").text());
	}
	// Process Firmware Data.
	$(xml1).find("XpsFirmware").text($(xml2).find("XpsFirmware").text());
	$(xml1).find("PacFirmware").text($(xml2).find("PacFirmware").text());
	// Process Memory Data.
	$(xml1).find("Memory").attr("RefreshRate", $(xml2).find("Memory").attr("RefreshRate"));
	$(xml1).find("Memory").text($(xml2).find("Memory").text());
	itms = $(xml1).find("MemoryItem");
	for (i = 0; i < itms.length; i++) {
		id = $(itms)[i].attributes.getNamedItem("Id").value;
		$(xml1).find("MemoryItem[Id='" + id + "']").text($(xml2).find("MemoryItem[Id='" + id + "']").text());
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

// -------------------------------------------------------------------------------------------
// Returns the specified xml with the current Security Settings.
// -------------------------------------------------------------------------------------------
MOCK.saveSecuritySettings = function(xml, json) {
	var isExist = false;
	var xData = $(xml).find("Data");
	var deleted = parseInt(xData.find("Deleted").text(), 10);
	var userlevel = parseInt(xData.find("UserLevel").text(), 10);
	var enabled = parseInt(xData.find("Enabled").text(), 10);
	var username = xData.find("Username").text().toLowerCase(); // Compare using lowercase.
	var password = xData.find("password").text();
	var dtModified = CMN.dateToMilliseconds();
	// If user already exists, modify it in the JSON.
	var maxId = 0;
	$.each(json, function(index, element) {
		var id = parseInt(element.id.substr(3), 10);
		if (id > maxId)
			maxId = id;
		if (element.username.toLowerCase() === username) {
			element.password = password;
			element.enabled = enabled;
			element.userlevel = userlevel;
			element.deleted = deleted;
			element.datemodified = dtModified;
			isExist = true;
		}
	});
	// If user does not exist, add it to the JSON.
	if (!isExist) {
		var itm = {
			enabled: enabled,
			deleted: deleted,
			userlevel: userlevel,
			datecreated: dtModified,
			datemodified: dtModified,
			password: password,
			username: CMN.toTitleCase(username),
			id: "id_" + (maxId + 1),
			ipaddress: "",
			lastaccessed: null
		};
		json.push(itm);
	}
	return xml;
};

// -------------------------------------------------------------------------------------------
// Adds the values from xml2 to xml1 (the mock xml) file.
// -------------------------------------------------------------------------------------------
MOCK.addValuesToXml = function(xml1, xml2) {
	var itms = $(xml2).find("*:eq(1)").children();
	for (var j = 0; j < itms.length; j++) {
		var node = itms[j].nodeName;
		$(xml1).find(node).text($(xml2).find(node).text());
	}
	return xml1;
};

//# sourceURL=tucson.mock.js