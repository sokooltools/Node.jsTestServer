// ====================================================================================================
// JsonTest.js
// ====================================================================================================
var CMN = window.CMN;
var CFG = window.CFG;

var grid;
var dataview;

$(document).ready(function() {
	window.DEMO.loadCommon();

	$("#run").on("click", function () {
		loadGrid();
	});
	$("#expandAll").on("click", function() {
		dataview.expandAllGroups();
	});
	$("#collapseAll").on("click", function() {
		dataview.collapseAllGroups();
	});
});

loadGrid = function() {
	var dateTimeFormat = "MM/DD/YYYY hh:mm A";

	function checkmarkFormatter(row, cell, value, columnDef, dataContext) {
		if (!columnDef && !dataContext)
			return "";
		return value === 1 ? '<img src="../../grid/images/tick.png">' : "";
	}

	function dateTimeFormatter(row, cell, value, columnDef, dataContext) {
		if (!columnDef && !dataContext)
			return "";
		return moment(CMN.millisecondsToDate(value)).format(dateTimeFormat);
	}

	function userLevelFormatter(row, cell, value, columnDef, dataContext) {
		if (columnDef || dataContext) {
			switch (value) {
				case 0:
					return "Admin";
				case 1:
					return "Engineer";
				case 2:
					return "Supervisor";
				case 3:
					return "Technician";
				case 4:
					return "Operator";
				case 5:
					return "Guest";
			}
		}
		return "";
	}

	var options = {
		enableCellNavigation: true,
		enableColumnReorder: false,
		rowHeight: 23
	};

	var columns = [
//		{
//			id: 'colId',
//			name: 'ID',
//			field: 'id',
//			sortable: true,
//			width: 37,
//			//minWidth: 20,
//			//maxWidth: 70,
//		},
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
			width: 74,
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
			width: 53,
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
	];

	var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();

	var data = getJson("../data/userssessions.json");

	var notDeletedRowsFilter = function(item) {
		return item.deleted === 0;
	};

	dataview = new Slick.Data.DataView({
		inlineFilters: true,
		groupItemMetadataProvider: groupItemMetadataProvider
	});

	dataview.beginUpdate();
	dataview.setItems(data, "id");
	dataview.setFilter(notDeletedRowsFilter);
	dataview.endUpdate();

	var gridSorter = function(field, sortAsc) {
		var comparer = function(a, b) {
			return a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0;
		};
		// Delegate the sorting to DataView. (This will fire the change events and update the grid).
		dataview.sort(comparer, sortAsc);
	};

	grid = new Slick.Grid("#secGrid", dataview, columns, options);

	grid.setSortColumn("sec_colUsername", true);

	// Register the group item metadata provider to add expand/collapse group handlers
	grid.registerPlugin(groupItemMetadataProvider);

	grid.setSelectionModel(new Slick.RowSelectionModel());
	//grid.setSelectionModel(new Slick.CellSelectionModel());

	//var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);
	//var pager = new Slick.Controls.Pager(dataview, grid, $("#pager"));

	dataview.syncGridSelection(grid);

	dataview.onRowsChanged.subscribe(function(e, args) {
		grid.invalidateRows(args.rows);
		grid.render();
	});

	dataview.onRowCountChanged.subscribe(function() {
		grid.updateRowCount();
		grid.render();
	});

	grid.onSort.subscribe(function(e, args) { // args: sort information.
		gridSorter(args.sortCol.field, args.sortAsc);
	});

	// grid.onSelectedRowsChanged.subscribe(function() {
	// 	var rows = grid.getSelectedRows();
	// 	if (rows) {
	// 		var dataItem = grid.getDataItem(rows[0]);
	// 		DEMO.loadFormFromDataItem(dataItem);
	// 	}
	// });

	// grid.onClick.subscribe(function(e) {
	// 	var cell = grid.getCellFromEvent(e);
	// 	if (cell && grid.getColumns()[cell.cell].id == 'sec_colEnabled') {
	// 		if (!grid.getEditorLock().commitCurrentEdit()) {
	// 			return;
	// 		}
	// 		e.stopPropagation();
	// 	}
	// 	grid.setActiveCell({});
	// });

	gridSorter("username", true);

	groupByUsername();

	function groupByUsername() {
		dataview.setGrouping({
			getter: "username",
			formatter: function(g) {
				return g.value + "  <span style='color:green'>(" + g.count + " items)</span>";
			},
			//aggregators: [
			//	new Slick.Data.Aggregators.Avg("percentComplete"),
			//	new Slick.Data.Aggregators.Sum("cost")
			//],
			//lazyTotalsCalculation: true,
			collapsed: true,
			aggregateCollapsed: true,
			displayTotalsRow: false
		});
	}
	// -------------------------------------------------------------------------------------------
	// Returns json data from the specified URL.
	// -------------------------------------------------------------------------------------------
	 function getJson(url) {
		var retVal;
		$.ajax({
			type: "GET",
			url: url,
			dataType: "json",
			async: false,
			success: function(dta) {
				retVal = dta;
			},
			error: function(jqXHR) {
				CFG.showError(jqXHR);
			}
		});
		// console.table(retVal)
		return retVal;
	};
};

//	  dataview.setAggregators([
//		 new Slick.Data.Aggregators.Avg("percentComplete"),
//		 new Slick.Data.Aggregators.Sum("cost")
//	  ], true, false);
//
//	function groupByMultiColumns() {
//		dataview.groupBy(
//			 ["Username", "UserLevel", "DateCreated"],
//			 [
//				(function(g) {
//					return "Username:  " + g.value + "  <span style='color:green'>(" + g.count + " items)</span>";
//				}),
//				(function(g) {
//					return "UserLevel:  " + g.value + "  <span style='color:green'>(" + g.count + " items)</span>";
//				}),
//				(function(g) {
//					return "DateCreated:  " + g.value + "  <span style='color:green'>(" + g.count + " items)</span>";
//				})
//			 ],
//			 [
//				function(a, b) { // string sorting
//					var x = a.value, y = b.value;
//					return x == y ? 0 : (x > y ? 1 : -1);
//				},
//					function(a, b) {
//						return a.value - b.value;
//					},
//					function(a, b) {
//						return a.value - b.value;
//					}
//				 ]
//			  );
//	}
//
//	dataview.getItemMetadata = function(row) {
//		var dt = dataview.getItem(row);
//		if (dt.rows == undefined) {
//			//console.log(dt.value);
//			return {
//				"columns": {
//					0: {
//						"colspan": 6
//					}
//				}
//			};
//		} else {
//			return {
//				"columns": {
//					0: {
//						"colspan": "*"
//					}
//				}
//			};

//			return {
//				"columns": {
//					1: {
//						"colspan": 5
//					},
//					6: {
//						"colspan": "*"
//					}
//				}
//			};
//		}
//		//      if (row % 2 === 1) {
//		//        return {
//		//          "columns": {
//		//            "Id": {
//		//              "colspan": 5
//		//            }
//		//          }
//		//        };
//		//      } else {
//		//	      //return {
//		//		      //    "columns": {
//		//		      //      0: {
//		//		      //        "colspan": "*"
//		//		      //      }
//		//		      //    }
//		//		      //  };
//		//	      return null;
//		//      }
//	};
//
//	dataview.groupBy(
//		// Grouping value
//		function (row) {
//			return row["Username"]+":"+row["UserLevel"]+":"+row["DateCreated"]+":"+row["DateModified"]+":"+row["Enabled"];
//		},
//		// Group display
//		function (group) {
//			var values = group.value.split(":", 5); // 5 is number of grouping columns*
//			return "Col1: "+values[0]+", Col2: "+values[1]+", Col3:" + values[2]+", Col4:" + values[3]+", Col5:" + values[4];
//		},
//		// Group comparator/sorting
//		function (a, b) {
//			return a.value - b.value;
//		}
//	);
//
//$(".grid-header .ui-icon")
//    .addClass("ui-state-default ui-corner-all")
//    .mouseover(function(e) { $(e.target).addClass("ui-state-hover"); })
//    .mouseout(function(e) { $(e.target).removeClass("ui-state-hover"); });


//# sourceURL=jsontest.js