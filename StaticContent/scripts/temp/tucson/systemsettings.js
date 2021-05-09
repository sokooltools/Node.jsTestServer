var CFG=window.CFG;var CMN=window.CMN;var DTS=window.DTS;var MOCK=window.MOCK;$("head").append('<link rel="stylesheet" type="text/css" href="themes/tucson/systemsettings.css">');
var SYS={};SYS.xml=null;SYS.json={};SYS.isSaveEnabled=true;SYS.msgs={MACHINENAME_EXISTS:{key:"SYS",id:1},MACHINENAME_MIN:{key:"SYS",id:2},MACHINENAME_REQD:{key:"SYS",id:3},MACHINENAME_VALID:{key:"SYS",id:4},CONFIRM_REBOOT:{key:"SYS",id:5},INTERNETTIMESERVER_MIN:{key:"SYS",id:6},INTERNETTIMESERVER_REQD:{key:"SYS",id:7},REFRESHINTERVAL_MIN:{key:"SYS",id:8},REFRESHINTERVAL_REQD:{key:"SYS",id:9}};
SYS.$container=$("#frmSystemSettings div.errcontainer");SYS.$validator=$("#frmSystemSettings").validate({debug:true,errorContainer:SYS.$container,errorLabelContainer:$("ol",SYS.$container),errorClass:"invalid",validClass:"valid",wrapper:"li",rules:{sys_txtMachineDesc:{required:false},sys_chkIsSyncWithMyClock:{required:false},sys_chkIsSyncWithInternet:{required:false},sys_chkIsAutoDst:{required:false},sys_txtRefreshInterval:{required:true},sys_cboInternetTimeServer:{required:true}}});
$("input").bind("mouseup",function(b){var a=$(this),c=a.val();if(c===""){return;}window.setTimeout(function(){var d=a.val();
if(d===""){a.trigger("cleared");SYS.enableSaveAndResetButtons(b);}},1);});$("#sys_txtMachineName").contextDelete({cut:function(a){SYS.enableSaveAndResetButtons(a);
},paste:function(a){if(CMN.processCutPaste(a,"alphanumeric",a.target.id==="sys_txtMachineDesc")){SYS.enableSaveAndResetButtons(a);
}},contextDelete:function(a){SYS.enableSaveAndResetButtons(a);}});$("#sys_txtMachineName").bind("keypress keydown",function(a){if(CMN.processKey(a,"alphanumeric")){SYS.enableSaveAndResetButtons(a);
}});$("#sys_txtMachineName").bind("cut paste",function(a){if(CMN.processCutPaste(a,"alphanumeric")){SYS.enableSaveAndResetButtons(a);
}});$("#sys_txtMachineDesc").bind("keypress keydown",function(a){if(CMN.processKey(a,"alphanumeric",true)){SYS.enableSaveAndResetButtons(a);
}});$("#sys_txtMachineDesc").bind("cut paste",function(a){if(CMN.processCutPaste(a,"alphanumeric",true)){SYS.enableSaveAndResetButtons(a);
}});$("#sys_txtMachineDesc").contextDelete({cut:function(a){SYS.enableSaveAndResetButtons(a);
},paste:function(a){if(CMN.processCutPaste(a,"alphanumeric",true)){SYS.enableSaveAndResetButtons(a);
}},contextDelete:function(a){SYS.enableSaveAndResetButtons(a);}});$("#sys_txtRefreshInterval").bind("keypress keydown",function(a){if(CMN.processKey(a,"numeric")){SYS.enableSaveAndResetButtons(a);
}});$("sys_txtRefreshInterval").bind("cut paste",function(a){if(CMN.processCutPaste(a,"numeric")){SYS.enableSaveAndResetButtons(a);
}});$("#sys_txtRefreshInterval").on("spin",function(){SYS.enableSaveAndResetButtons(this);
$("#frmSystemSettings").valid();});$("#sys_btnHelp").on("click",function(){window.open("help/systemsettings.htm");
return false;});$("#sys_btnRefresh, #sys_btnReset").on("click",function(){SYS.doRefresh();
return false;});$("#sys_btnReboot").on("click",function(){SYS.doReboot();return false;
});$("#sys_btnSave, #sys_btnSaveD").on("click",function(){SYS.doSave();return false;
});$("#sys_chkIsSyncWithMyClock").on("click",function(){return DTS.syncWithMyClock(this);
});$("#sys_chkIsSyncWithInternet").on("click",function(){DTS.syncWithInternet(this);
$("#frmSystemSettings").valid();return true;});$("#sys_chkIsAutoDst, select#sys_cboRefreshUnits").change(function(){SYS.enableSaveAndResetButtons(this);
return true;});SYS.doRefresh=function(){var a=$("#sys_btnSave").is(":disabled")?CMN.msgs.REFRESHING:CMN.msgs.RESETTING;
CFG.performFunction(function(){SYS.loadPage();SYS.loadData();DTS.loadData();},CFG.getCaption(a));
};SYS.doReboot=function(){var d=$("#sys_lblSystemSettings").text();var c=CFG.lookup(SYS.msgs.CONFIRM_REBOOT);
var a=CFG.lookup(CMN.msgs.DIALOG_OK);var b=CFG.lookup(CMN.msgs.DIALOG_CANCEL);CMN.showConfirm(c,d,CMN.icons.EXCLAMATION,a,b).then(function(e){if(e.toString()===a){CFG.doReboot();
}});};SYS.doSave=function(){if(!SYS.isSaveEnabled){return;}if(!$("#frmSystemSettings").valid()){CFG.showInvalid();
return;}if(!SYS.isRefreshIntervalValid()){var a="<div class='img_exclamation'></div><div id='invalid_text'>";
a+=CFG.lookup(SYS.msgs.REFRESHINTERVAL_MIN);a+="</div>";CMN.showDialog(a);return;
}var b=$("#sys_txtMachineName").val();var c=$(SYS.xml).find("MachineName").text();
if(b!==c){CMN.showBusy("Validating '<b>Machine Name</b>'... Please wait.");}CFG.performFunction(function(){DTS.saveData();
SYS.savePage();},CFG.getCaption(CMN.msgs.SAVING));};SYS.loadPage=function(){$.ajax({type:"GET",url:"/services/network/systemsettings?lang="+CFG.getLanguage(),dataType:"xml",async:false,cache:false,success:function(a){SYS.loadPageFromXml(a);
},error:function(a){CFG.handleError(a);}});};SYS.loadPageFromXml=function(a){CFG.setLabelsAndTitles(a);
SYS.addValidatorRules();SYS.makeSecure();SYS.xml=a;DTS.init();};SYS.loadData=function(){$.ajax({type:"GET",url:"/services/network/systemdata",dataType:"json",cache:false,async:false,success:function(a){SYS.loadPageData(a);
},error:function(a){CFG.handleError(a);}});};SYS.loadPageData=function(a){SYS.json=a;
$("#sys_txtMachineName").val(a.machinename);$("#sys_txtMachineDesc").val(a.machinedesc);
$("#sys_cboInternetTimeServer").val(a.internettimeservers[0]);var b=DTS.millisecondsToTime(a.refreshinterval);
spinner.spinner("value",b.timeValue);$("#sys_cboRefreshUnits").val(b.units);$("#sys_chkIsSyncWithMyClock").prop("checked",false);
DTS.isSyncWithMyClock=false;$("#sys_chkIsSyncWithInternet").prop("checked",!a.isautoupdate);
$("#sys_chkIsSyncWithInternet").trigger("click");SYS.disableSaveAndResetButtons();
};SYS.savePage=function(){var a=SYS.getJsonFromPage();if(CMN.compare(a,SYS.json)){SYS.disableSaveAndResetButtons();
return;}SYS.saveJson(a);};SYS.saveJson=function(a){$.ajax({type:"PUT",url:"/services/network/systemdata",dataType:"json",headers:{"x-auth-token":localStorage.accessToken,"Content-Type":"application/json"},global:false,async:false,data:JSON.stringify(a),complete:function(b){if(b.status===200){SYS.json=a;
SYS.disableSaveAndResetButtons();$("span#net_txtMachineName").text($("#sys_txtMachineName").val());
}},error:function(b){CFG.handleError(b);}});};SYS.getJsonFromPage=function(){var a=($("#sys_cboInternetTimeServer").val());
var b={machinename:$("#sys_txtMachineName").val(),machinedesc:$("#sys_txtMachineDesc").val(),isautoupdate:$("#sys_chkIsSyncWithInternet").is(":checked"),internettimeservers:[a],isautodst:$("#sys_chkIsAutoDst").is(":checked"),refreshinterval:SYS.getRefreshInterval(),serverrole:SYS.json.serverrole,threshold:SYS.json.threshold,recoveryrefresh:SYS.json.recoveryrefresh};
return b;};SYS.isRefreshIntervalValid=function(){return !SYS.isInternetTimeServerChecked()||SYS.getRefreshInterval()>=300000;
};SYS.isInternetTimeServerChecked=function(){return $("#sys_chkIsSyncWithInternet").is(":checked");
};SYS.getRefreshInterval=function(){var a=spinner.spinner("value");var b=parseInt($("#sys_cboRefreshUnits").val(),10);
return DTS.timeToMilliseconds(a,b);};SYS.isExistingMachineName=function(a){var b;
$.ajax({type:"GET",url:"/services/network/isexisting/"+a,dataType:"json",async:false,success:function(c){b=c.isExisting;
},error:function(c){CFG.handleError(c);}});return b;};SYS.doSynchNow=function(){var a=false;
$("#sys_btnSyncNow").blur();CMN.showBusy("Synchronizing <b>'Machine Date Time'</b>... Please wait.");
$.ajax({type:"PUT",url:"/services/network/synchnow",dataType:"json",headers:{"x-auth-token":localStorage.accessToken,"Content-Type":"application/json"},global:false,async:false,cache:false,data:null,complete:function(b){if(b.status===200){DTS.loadData(true);
a=true;}},error:function(){}});CMN.hideBusy();return a;};SYS.showExistingMachineNameDialog=function(b){var a="<div class='img_exclamation'></div><div id='invalid_text'>";
a+=String.format(CFG.lookup(SYS.msgs.MACHINENAME_EXISTS),b);a+="</div>";CMN.showDialog(a);
};SYS.enableSaveAndResetButtons=function(a){$("#sys_btnSave").prop("disabled",false);
$("#sys_btnSyncNow").prop("disabled",true);$("#sys_btnRefresh").addClass("hidden");
$("#sys_btnReset").removeClass("hidden");if(!a.id){CMN.validateMe(a);}SYS.isSaveEnabled=true;
};SYS.disableSaveAndResetButtons=function(){$("#sys_btnSave").prop("disabled",true);
$("#sys_btnSyncNow").prop("disabled",false);$("#sys_btnReset").addClass("hidden");
$("#sys_btnRefresh").removeClass("hidden");if(SYS.$validator){SYS.$validator.resetForm();
}SYS.isSaveEnabled=false;};SYS.getDateFormat=function(){var a=$(SYS.xml).find("DateFormat").text();
return a?a:"mm/dd/yy";};SYS.getTimeFormat=function(){var a=$(SYS.xml).find("TimeFormat").text();
return a?a:"hh:mm:ss TT";};SYS.setInitialFocus=function(){$("#sys_txtMachineName").focus().select();
};SYS.makeSecure=function(){$("#sys_txtMachineName, #sys_txtMachineDesc, #sys_chkIsAutoDst, #sys_cboMachineTimeZone, #sys_chkIsSyncWithMyClock, #sys_chkIsSyncWithInternet, #sys_cboInternetTimeServer, #sys_txtRefreshInterval, #sys_cboRefreshUnits, #sys_btnReboot").prop("disabled",!CMN.isAdminLevel());
};SYS.addValidatorRules=function(){var a=$("#sys_txtMachineName");a.rules("remove");
a.rules("add",{required:{},minlength:{param:4},validmachinename:true,messages:{required:CFG.lookup(SYS.msgs.MACHINENAME_REQD),minlength:CFG.lookup(SYS.msgs.MACHINENAME_MIN),validmachinename:CFG.lookup(SYS.msgs.MACHINENAME_VALID)}});
a=$("#sys_txtRefreshInterval");a.rules("remove");a.rules("add",{required:{depends:function(){return SYS.isInternetTimeServerChecked();
}},range:{depends:function(){return SYS.isInternetTimeServerChecked();},param:[1,9999]},messages:{required:CFG.lookup(SYS.msgs.REFRESHINTERVAL_REQD),range:CFG.lookup(SYS.msgs.REFRESHINTERVAL_MIN)}});
a=$("#sys_cboInternetTimeServer");a.rules("remove");a.rules("add",{required:{depends:function(){return SYS.isInternetTimeServerChecked();
}},minlength:{depends:function(){return SYS.isInternetTimeServerChecked();},param:4},messages:{required:CFG.lookup(SYS.msgs.INTERNETTIMESERVER_REQD),minlength:CFG.lookup(SYS.msgs.INTERNETTIMESERVER_MIN)}});
};jQuery.validator.addMethod("validrefreshinterval",function(){return !SYS.isInternetTimeServerChecked()||SYS.getRefreshInterval()>=300000;
});jQuery.validator.addMethod("validmachinename",function(a){var b=/^[a-zA-Z]{1}[a-zA-Z0-9\-_]{2,13}[^\-_]$/;
return a.replace(b,"")==="";});CFG.performFunction(function(){CMN.loadScript("scripts/tucson/datetimesettings.js",true,{});
SYS.loadPage();SYS.loadData();DTS.loadData();},CFG.getCaption(CMN.msgs.LOADING));
$.widget("custom.combobox",{_create:function(){this.wrapper=$("<span>").addClass("custom-combobox").insertAfter(this.element);
this.element.hide();this._createAutocomplete();this._createShowAllButton();},_createAutocomplete:function(){var a=this.element.children(":selected"),b=a.val()?a.text():"";
this.input=$("<input>").appendTo(this.wrapper).on("keypress keydown",function(c){if(CMN.processKey(c,"alphanumeric")){SYS.enableSaveAndResetButtons(c);
}}).on("cut paste",function(c){if(CMN.processCutPaste(c,"alphanumeric")){SYS.enableSaveAndResetButtons(c);
}}).val(b).attr("title","").attr("spellcheck","false").addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left").autocomplete({delay:0,minLength:0,source:$.proxy(this,"_source")}).tooltip({classes:{"ui-tooltip":"ui-state-highlight"}});
this._on(this.input,{autocompleteselect:function(c,d){d.item.option.selected=true;
this._trigger("select",c,{item:d.item.option});if($(SYS.xml).find("InternetTimeServer").text()!==d.item.option.value){SYS.enableSaveAndResetButtons({id:0});
}}});},_createShowAllButton:function(){var a=this.input,b=false;$("<a>").attr("tabIndex",-1).attr("title","Show All Items").tooltip().appendTo(this.wrapper).button({icons:{primary:"ui-icon-triangle-1-s"},text:false}).removeClass("ui-corner-all").addClass("custom-combobox-toggle ui-corner-right").on("mousedown",function(){b=a.autocomplete("widget").is(":visible");
}).on("click",function(){a.trigger("focus");if(b){return;}a.autocomplete("search","");
});},_source:function(b,c){var a=new RegExp($.ui.autocomplete.escapeRegex(b.term),"i");
c(this.element.children("option").map(function(){var d=$(this).text();if(this.value&&(!b.term||a.test(d))){return{label:d,value:d,option:this};
}return{};}));},_destroy:function(){this.wrapper.remove();this.element.show();}});
$("#sys_selInternetTimeServer").combobox();$("#sys_ui-widget > span.custom-combobox > input.ui-autocomplete-input").attr("id","sys_cboInternetTimeServer");
$("#sys_cboInternetTimeServer").css("background","white").css("font-weight","600").attr("name","sys_cboInternetTimeServer");
var spinner=$("#sys_txtRefreshInterval").spinner();$("#sys_txtRefreshInterval").spinner("option","min",1);
$("#sys_txtRefreshInterval").spinner("option","max",9999);