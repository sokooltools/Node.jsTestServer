var CMN=window.CMN;var CFG=window.CFG;var MOCK=window.MOCK;$("head").append('<link rel="stylesheet" type="text/css" href="themes/tucson/xpresssettings.css">');
var XPS={};XPS.xml=null;XPS.win=null;XPS.msgs={PROJECTNAME_REQD:{key:"XPS",id:1},PROJECTNAME_MIN_LEN:{key:"XPS",id:2},VERSION1_REQD:{key:"XPS",id:3},VERSION2_REQD:{key:"XPS",id:4},INVALID_FILETYPE:{key:"XPS",id:5},SENDING_PROJECTFILE:{key:"XPS",id:6},RESTARTING_XPRESS:{key:"XPS",id:7},DELETING_PROJECTFILE:{key:"XPS",id:8},STILL_LOADING1:{key:"XPS",id:9},STILL_LOADING2:{key:"XPS",id:10}};
$("#xps_btnHelp").on("click",function(){window.open("help/XpressSettings.htm");return false;
});$("#xps_btnLaunchShell").on("click",function(){if(XPS.isProjectLoaded()){var b=(MOCK.isMockMode()?window.location.origin+"/services/xpressshell":"http://"+window.location.hostname);
var c="xpressshell";var a="height=577, width=849, resizable=yes, location=no, toolbar=no, menubar=no, scrollbars=no, directories=no, status=no";
XPS.win=CMN.openWindow(b,c,a,XPS.win);}return false;});$("#xps_chkAutoGenPlcTags").on("click",function(a){XPS.enableSaveAndResetButtons(a);
});$("#xps_btnProjDel").on("click",function(){$("#xps_txtProjName, #xps_txtProjVers1, #xps_txtProjVers2").addClass("xps_to_delete").prop("disabled",true);
$("#xps_btnProjDel, #xps_btnProjSend, #xps_btnProjGet, #xps_txtProjFile").prop("disabled",true);
XPS.enableSaveAndResetButtons(this);return false;});$("#xps_btnProjGet").on("click",function(){if(MOCK.isMockMode()){CFG.showInfo();
}else{var a=$("#xps_txtProjName").val().replace(/#/g,"x").replace(/&/g,"x");window.location.href="download.aspx?="+a+".lrp";
}return false;});$("#xps_txtProjFile").on("change",function(){window.setTimeout(function(){$("#xps_btnProjSend").prop("disabled",($("#xps_txtProjFile").val()===EMPTY));
},10);});$("#frmXpressSettings").submit(function(a){var c=$("#xps_txtProjFile").val();
if(c.length>0){var b=c.substring(c.lastIndexOf("."),c.length);if(b.toLowerCase()===".lrp"){if(MOCK.isMockMode()){location.reload();
}else{a.target.submit();CMN.showBusy(CFG.lookup(XPS.msgs.SENDING_PROJECTFILE));}}else{CFG.showInfo(XPS.msgs.INVALID_FILETYPE,c.split("\\").pop());
}}return false;});$("input").bind("mouseup",function(b){var a=$(this),c=a.val();if(c===""){return;
}window.setTimeout(function(){var d=a.val();if(d===""){a.trigger("cleared");XPS.enableSaveAndResetButtons(b);
}},1);});$("#xps_txtProjName").contextDelete({cut:function(a){XPS.enableSaveAndResetButtons(a);
},paste:function(a){XPS.enableSaveAndResetButtons(a);},contextDelete:function(a){XPS.enableSaveAndResetButtons(a);
}});$("#xps_txtProjName").bind("keypress keydown",function(a){if(CMN.processKey(a,"filepath",true)){XPS.enableSaveAndResetButtons(a);
}});$("#xps_txtProjName").bind("cut paste",function(a){if(CMN.processCutPaste(a,"filepath",true)){XPS.enableSaveAndResetButtons(a);
}});$("#xps_txtProjVers1, #xps_txtProjVers2").bind("keypress keydown",function(a){if(CMN.processKey(a,"numeric")){XPS.enableSaveAndResetButtons(a);
}});$("#xps_txtProjVers1, #xps_txtProjVers2").bind("cut paste",function(a){if(CMN.processCutPaste(a,"numeric")){XPS.enableSaveAndResetButtons(a);
}});$("#xps_btnSave").on("click",function(){if(!$("#xps_btnProjDel").is(":disabled")&&!$("#frmXpressSettings").valid()){CFG.showInvalid();
return false;}if($(XPS.getXmlFromPage()).find("Data").find("XpressProject").find("Name").text()===EMPTY){XPS.deleteProject();
}else{CFG.performFunction(XPS.savePage,CFG.getCaption(CMN.msgs.SAVING));}return false;
});$("#xps_btnRefresh, #xps_btnReset").on("click",function(){var a=$("#xps_btnSave").is(":disabled")?CMN.msgs.REFRESHING:CMN.msgs.RESETTING;
CFG.performFunction(XPS.loadPage,CFG.getCaption(a));return false;});XPS.loadPage=function(){var a="/services/network/xpresssettings?lang="+CFG.getLanguage();
$.ajax({type:"GET",url:a,dataType:"xml",async:false,cache:false,success:function(b){if(MOCK.isMockMode()){b=MOCK.addValuesToXpressSettingsXml(b);
}XPS.loadPageFromXml(b);},error:function(b){CFG.handleError(b);}});};XPS.loadPageFromXml=function(b){$(".xps_to_delete").removeClass("xps_to_delete").prop("disabled",false);
var a=$(b).find("Data");$("#xps_chkAutoGenPlcTags").prop("checked",(a.find("AutoGeneratePlcTags").text().toLowerCase()==="true"));
a=$(a).find("XpressProject");$("#xps_txtProjName").val(a.find("Name").text());$("#xps_txtProjVers1").val(a.find("ProjectVersion1").text());
$("#xps_txtProjVers2").val(a.find("ProjectVersion2").text());CFG.setLabelsAndTitles(b);
XPS.clearFileInputs($("#frmXpressSettings"));XPS.disableSaveAndResetButtons();XPS.addValidatorRules();
XPS.resetValidation();XPS.makeSecure(b);XPS.xml=b;};XPS.savePage=function(){var b=XPS.getXmlFromPage();
if(MOCK.isMockMode()){XPS.xml=b;XPS.loadPage();}else{var a="/services/network/xpressdata";
$.ajax({type:"PUT",url:a,contentType:"text/xml",global:false,async:false,cache:false,data:CMN.getDataXml(b),complete:function(c){if(c.status===200){XPS.loadPage();
}},error:function(c){CFG.handleError(c);}});}};XPS.getXmlFromPage=function(){var b=CMN.cloneXmlDoc(XPS.xml);
var a=$(b).find("Data");if($("#xps_btnProjDel").is(":disabled")){if(MOCK.isMockMode()){a.find("Name").text("BlankProject");
a.find("ProjectVersion1").text("1");a.find("ProjectVersion2").text("0");a.find("IsEnabled").text("false");
}else{a.find("Name").text("");a.find("ProjectVersion1").text("");a.find("ProjectVersion2").text("");
}}else{a.find("Name").text($("#xps_txtProjName").val());a.find("ProjectVersion1").text($("#xps_txtProjVers1").val());
a.find("ProjectVersion2").text($("#xps_txtProjVers2").val());}a.find("AutoGeneratePlcTags").text(CMN.isChecked($("#xps_chkAutoGenPlcTags")));
return b;};XPS.enableSaveAndResetButtons=function(a){$("#xps_btnSave").prop("disabled",false);
$("#xps_btnRefresh").addClass("hidden");$("#xps_btnReset").removeClass("hidden");
if(!a.id){CMN.validateMe(a);}};XPS.disableSaveAndResetButtons=function(){$("#xps_btnSave").prop("disabled",true);
$("#xps_btnReset").addClass("hidden");$("#xps_btnRefresh").removeClass("hidden");
};XPS.makeSecure=function(d){var c=$(d).find("IsLicensed").text().toLowerCase()==="true";
var b=$(d).find("IsEnabled").text().toLowerCase()==="true";var a=CMN.isAdminLevel();
$("#xps_txtProjName, #xps_txtProjVers1, #xps_txtProjVers2").prop("disabled",!c||!a||!b);
$("#xps_btnProjGet, #xps_btnProjDel").prop("disabled",!c||!a||!b);$("#xps_chkAutoGenPlcTags, #xps_txtProjFile").prop("disabled",!c||!a);
$("#xps_btnLaunchShell").prop("disabled",!c);$("#xps_btnProjSend").prop("disabled",!c||!a||$("#xps_txtProjFile").val()==="");
};XPS.isProjectLoaded=function(){function a(){return $(XPS.xml).find("IsProjectLoaded").text().toLowerCase()==="true";
}if(a()){return true;}XPS.loadPage();if(a()){return true;}var b='<div id="stillLoading1">'+CFG.lookup(XPS.msgs.STILL_LOADING1)+"</div>";
b+='<div id="stillLoading2">'+CFG.lookup(XPS.msgs.STILL_LOADING2)+"</div>";CFG.showInvalid(b);
return false;};XPS.deleteProject=function(){CMN.showBusy(CFG.lookup(XPS.msgs.DELETING_PROJECTFILE));
window.setTimeout(function(){XPS.savePage();CMN.hideBusy();},1000);};XPS.resetValidation=function(){XPS.$validator.resetForm();
$("#xps_txtProjName, #xps_txtProjVers1, #xps_txtProjVers2").removeClass("invalid");
};XPS.clearFileInputs=function(a){a.find('input[type="file"]').each(function(){$(this).wrap("<form>").closest("form").get(0).reset();
$(this).unwrap();});};XPS.$container=$("#frmXpressSettings div.errcontainer");XPS.$validator=$("#frmXpressSettings").validate({errorContainer:XPS.$container,errorLabelContainer:$("ol",XPS.$container),errorClass:"invalid",validClass:"valid",wrapper:"li"});
XPS.addValidatorRules=function(){var a=$("#xps_txtProjName");a.rules("remove");a.rules("add",{required:{},minlength:{param:3},messages:{required:CFG.lookup(XPS.msgs.PROJECTNAME_REQD),minlength:CFG.lookup(XPS.msgs.PROJECTNAME_MIN_LEN)}});
a=$("#xps_txtProjVers1");a.rules("remove");a.rules("add",{required:{},messages:{required:CFG.lookup(XPS.msgs.VERSION1_REQD)}});
a=$("#xps_txtProjVers2");a.rules("remove");a.rules("add",{required:{},messages:{required:CFG.lookup(XPS.msgs.VERSION2_REQD)}});
a=$("#xps_txtProjFile");a.rules("remove");a.rules("add",{required:false,messages:{}});
};CFG.performFunction(function(){XPS.loadPage();},CFG.getCaption(CMN.msgs.LOADING));
$(document).ready(function(){CMN.checkForError();});