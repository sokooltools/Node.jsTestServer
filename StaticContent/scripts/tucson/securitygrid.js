// =======================================================================================================
// SecurityGrid.js
// =======================================================================================================
var CFG = window.CFG;
var CMN = window.CMN;
var SEC = window.SEC;

$("head").append('<link rel="stylesheet" type="text/css" href="grid/slick.grid.css">');
$("head").append('<link rel="stylesheet" type="text/css" href="grid/slick-default-theme.css">');
$("head").append('<link rel="stylesheet" type="text/css" href="themes/tucson/securitygrid.css">');

CMN.loadScript("grid/lib/jquery.event.drag-2.2.js", true, {});
CMN.loadScript("grid/slick.core.js", true, {});
CMN.loadScript("grid/slick.grid.js", true, {});
CMN.loadScript("grid/slick.dataview.js", true, {});
CMN.loadScript("grid/plugins/slick.rowselectionmodel.js", true, {});
CMN.loadScript("grid/slick.groupitemmetadataprovider.js", true, {});
CMN.loadScript("grid/slick.formatters.js", true, {});
CMN.loadScript("grid/plugins/slick.cellrangedecorator.js", true, {});
CMN.loadScript("grid/plugins/slick.cellrangeselector.js", true, {});

SEC.grid = null;
SEC.dataview = null;
SEC.notDeletedRowsFilter = null;
SEC.isSelectingRowsOfGroup = false;

// -------------------------------------------------------------------------------------------
// Loads or reloads the security grid.
// -------------------------------------------------------------------------------------------
SEC.loadSecurityGrid = (function() {
	try {
		SEC.json = CMN.getJson("/services/network/userssessions");
		if (!SEC.grid) {
			SEC.intializeGrid(SEC.json);
		} else {
			SEC.dataview.beginUpdate();
			SEC.dataview.setItems(SEC.json, "id");
			SEC.dataview.setFilter(SEC.notDeletedRowsFilter);
			SEC.dataview.reSort();
			SEC.dataview.endUpdate();
		}
	} catch (ex) {
		CFG.handleError(ex);
	}
});

// -------------------------------------------------------------------------------------------
// Initializes the security grid.
// -------------------------------------------------------------------------------------------
SEC.intializeGrid = function(data) {

	function checkmarkFormatter(row, cell, value, columnDef, dataContext) {
		if (!columnDef && !dataContext)
			return "";
		return value === 1 ? '<img src="grid/images/tick.png">' : "";
	}

	function dateTimeFormatter(row, cell, value, columnDef, dataContext) {
		if (value === null || !columnDef && !dataContext)
			return "";
		return moment(CMN.millisecondsToDate(value)).format(SEC.DateTimeFormat);
	}

	function userLevelFormatter(row, cell, value, columnDef, dataContext) {
		return (!columnDef && !dataContext) ? "" : SEC.UserLevels[value].Value;
	}

	var options = {
		enableCellNavigation: true,
		enableColumnReorder: false,
		rowHeight: 23,
		syncColumnCellResize: true
	};

	var columns = [
		{
			id: "sec_colUsername",
			name: "Username",
			field: "username",
			sortable: true,
			width: 84,
			cssClass: "cell-username"
		},
		{
			id: "sec_colUserLevel",
			name: "User Level",
			field: "userlevel",
			sortable: true,
			width: 72,
			formatter: userLevelFormatter
		},
		{
			id: "sec_colDateCreated",
			name: "Date created",
			field: "datecreated",
			sortable: true,
			width: 134,
			formatter: dateTimeFormatter
		},
		{
			id: "sec_colDateModified",
			name: "Date modified",
			field: "datemodified",
			sortable: true,
			width: 134,
			formatter: dateTimeFormatter
		},
		{
			id: "sec_colEnabled",
			name: "Enabled",
			field: "enabled",
			sortable: true,
			width: 55,
			cssClass: "cell-checkmark",
			formatter: checkmarkFormatter
		},
		{
			id: "sec_colIpAddress",
			name: "IP Address",
			field: "ipaddress",
			sortable: true,
			width: 100
		},
		{
			id: "sec_colLastAccessed",
			name: "Last Accessed",
			field: "lastaccessed",
			sortable: true,
			width: 134,
			formatter: dateTimeFormatter
		}
	//		,{
	//			id: 'colId',
	//			name: 'ID',
	//			field: 'Id',
	//			sortable: true,
	//			width: 37,
	//			//minWidth: 20,
	//			//maxWidth: 70,
	//		}

	];

	var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();

	SEC.notDeletedRowsFilter = function(item) {
		return item.deleted === 0;
	};

	SEC.dataview = new Slick.Data.DataView({
		inlineFilters: true,
		groupItemMetadataProvider: groupItemMetadataProvider
	});

	SEC.dataview.beginUpdate();
	SEC.dataview.setItems(data, "id");
	SEC.dataview.setFilter(SEC.notDeletedRowsFilter);
	SEC.dataview.endUpdate();

	var gridSorter = function(field, sortAsc) {
		var comparer = function(a, b) {
			return a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0;
		};
		// Delegate the sorting to DataView. (This will fire the change events and update the grid).
		SEC.dataview.sort(comparer, sortAsc);
	};

	SEC.grid = new Slick.Grid("#secGrid", SEC.dataview, columns, options);

	SEC.grid.setSortColumn("sec_colUsername", true);

	// Register the group item metadata provider to add expand/collapse group handlers
	SEC.grid.registerPlugin(groupItemMetadataProvider);

	SEC.grid.setSelectionModel(new Slick.RowSelectionModel());
	//SEC.grid.setSelectionModel(new Slick.CellSelectionModel());

	//var columnpicker = new Slick.Controls.ColumnPicker(columns, SEC.grid, options);
	//var pager = new Slick.Controls.Pager(SEC.dataview, SEC.grid, $("#pager"));

	SEC.dataview.syncGridSelection(SEC.grid);

	SEC.dataview.onRowsChanged.subscribe(function(e, args) {
		SEC.grid.invalidateRows(args.rows);
		SEC.grid.render();
	});

	SEC.dataview.onRowCountChanged.subscribe(function() {
		SEC.grid.updateRowCount();
		SEC.grid.render();
	});

	SEC.grid.onSort.subscribe(function(e, args) { // args: sort information.
		gridSorter(args.sortCol.field, args.sortAsc);
	});

	SEC.grid.onSelectedRowsChanged.subscribe(function(e) {
		SEC.selectGroupRows();
		e.stopImmediatePropagation();
	});

	//	SEC.grid.onClick.subscribe(function(e) {
	//		var cell = SEC.grid.getCellFromEvent(e);
	//		if (cell) {
	//			e.stopPropagation();
	//		}
	//	});

	//	SEC.grid.onClick.subscribe(function(e, args) {
	//		if ($(e.target).hasClass('slick-group-title')) {
	//			var item = SEC.dataview.getItem(args.row);
	//			if (item) {
	//				if (!item._collapsed) {
	//					item._collapsed = true;
	//				} else {
	//					item._collapsed = false;
	//				}
	//				SEC.dataview.updateItem(item.id, item);
	//			}
	//			e.stopImmediatePropagation();
	//		}
	//	});

	gridSorter("username", true);

	groupByUsername();

	function groupByUsername() {
		SEC.dataview.setGrouping({
			getter: "username",
			formatter: function(g) {
				return g.value + "  <span style='color:green'>(" + g.count + " items)</span>";
			},
			collapsed: false,
			aggregateCollapsed: true,
			displayTotalsRow: false
		});
	}
};

// -------------------------------------------------------------------------------------------
// Returns the currently selected row number (1 if no rows are currently selected).
// -------------------------------------------------------------------------------------------
SEC.getSelectedRownum = function() {
	var rowNum = SEC.grid.getSelectedRows();
	return (rowNum) ? rowNum[0] : 1;
};

// -------------------------------------------------------------------------------------------
// Finds the row number in the grid corresponding to the specified username (1 if not found).
// -------------------------------------------------------------------------------------------
SEC.getRownumByUsername = function(username) {
	if (!username)
		return null;
	var data = SEC.dataview.getItems();
	var usernm = username.toLowerCase();
	for (var i = 0; i < data.length; i++) {
		if (usernm === data[i].username.toLowerCase()) {
			return SEC.dataview.getRowById(data[i].id);
		}
	}
	return null;
};

// -------------------------------------------------------------------------------------------
// Returns the current number of users in the grid.
// -------------------------------------------------------------------------------------------
SEC.getRowCount = function() {
	return SEC.grid.getDataLength();
};

// -------------------------------------------------------------------------------------------
// Returns the group matching the specified username.
// -------------------------------------------------------------------------------------------
SEC.getGroupByUsername = function(username) {
	var grps = SEC.dataview.getGroups();
	for (var i = 0; i < grps.length; i++) {
		if (grps[i].groupingKey === username)
			return grps[i];
	}
	return null;
};

// -------------------------------------------------------------------------------------------
// Selects all rows of the same group of the selected row.
// -------------------------------------------------------------------------------------------
SEC.selectGroupRows = function() {
	if (SEC.isSelectingRowsOfGroup)
		return;
	var rows = SEC.grid.getSelectedRows();
	var dataItem = null;
	if (rows && rows.length) {
		dataItem = SEC.grid.getDataItem(rows[0]);
		if (!dataItem.__group) {
			SEC.setSelectedRowsOfGroup(SEC.getGroupByUsername(dataItem.username));
		}
	}
	SEC.loadFormFromDataItem(dataItem);
};

// -------------------------------------------------------------------------------------------
// Sets the selected row to the specified row 'number' or 'id'.
// -------------------------------------------------------------------------------------------
SEC.setSelectedRow = function(rowNumOrId) {
	var rownum = rowNumOrId;
	if (typeof rowNumOrId === "string")
		rownum = SEC.dataview.getRowById(rowNumOrId);
	//SEC.grid.setActiveCell(rownum, 1);
	//SEC.grid.onClick.notify({ row: rownum, cell: 1 }, null, SEC.grid);
	if ((!rownum) || rownum < 0)
		SEC.grid.setSelectedRows([]);
	else {
		SEC.isSelectingRowsOfGroup = true;
		SEC.grid.setSelectedRows([rownum]);
		SEC.isSelectingRowsOfGroup = false;
	}
};

// -------------------------------------------------------------------------------------------
// Sets the selected rows in the grid based on the specified group.
// -------------------------------------------------------------------------------------------
SEC.setSelectedRowsOfGroup = function(group) {
	if (!group || !group.rows)
		return;
	var arr = [];
	for (var i = 0; i < group.rows.length; i++) {
		arr.push(group.rows[i].id);
	}
	SEC.isSelectingRowsOfGroup = true;
	SEC.grid.setSelectedRows(SEC.dataview.mapIdsToRows(arr));
	SEC.isSelectingRowsOfGroup = false;
};

// -------------------------------------------------------------------------------------------
// Handles the click event of the 'Expand All' button.
// -------------------------------------------------------------------------------------------
$("#sec_btnExpandAll").on("click", function() {
	SEC.dataview.expandAllGroups();
	return false;
});

// -------------------------------------------------------------------------------------------
// Handles the click event of the 'Collapse All' button.
// -------------------------------------------------------------------------------------------
$("#sec_btnCollapAll").on("click", function() {
	SEC.grid.setSelectedRows([]);
	SEC.dataview.collapseAllGroups();
	return false;
});

//// -------------------------------------------------------------------------------------------
//// Returns data used by the grid after being converted from the specified xml document.
//// -------------------------------------------------------------------------------------------
//SEC.convertXmlToJson = function(xml) {
//	var usr = $(xml).find('User');
//	var data = [];
//	for (var i = 0; i < usr.length; i++) {
//		data[i] = {
//			Id: "Id_" + i,
//			Username: $(usr[i]).attr('Username'),
//			UserLevel: parseInt($(usr[i]).attr('UserLevel'), 10),
//			Deleted: parseInt($(usr[i]).attr('Deleted'), 10),
//			Enabled: parseInt($(usr[i]).attr('Enabled'), 10),
//			DateCreated: $(usr[i]).attr('DateCreated'),
//			DateModified: $(usr[i]).attr('DateModified')
//		};
//	}
//	return data;
//};

//// -------------------------------------------------------------------------------------------
//// Returns Sessions data converted from the specified xml document.
//// -------------------------------------------------------------------------------------------
//SEC.getSessionsFromXml = function(xml, userid) {
//	var session = $(xml).find('Sessions').find('Session');
//	var data = [];
//	for (var i = 0; i < session.length; i++) {
//		if (!userid || userid === $(session[i]).attr('Id')) {
//			data[i] = {
//				Username: $(session[i]).attr('Username'),
//				Key: $(session[i]).attr('Key'),
//				IpAddress: $(session[i]).attr('IpAddress'),
//				LastAccessed_ms: $(session[i]).attr('LastAccessed')
//			};
//		}
//	}
//	return data;
//};

//# sourceURL=securitygrid.js