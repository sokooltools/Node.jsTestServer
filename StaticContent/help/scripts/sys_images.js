// ----------------------------------------------------------
// SystemSettings Help image generation script.
// ----------------------------------------------------------
UTL.cb('out "help/images/~temp"');

// Make sure we are on the SYS tab.
$("#SYS").click();
UTL.cb("aux");

$("#sys_btnRefresh").click();
wait();

$("#sys_txtMachineName").val("PAC001053999973x");
$("#sys_txtMachineDesc").val("Windows CE 7 Devicex");

SYS.enableSaveAndResetButtons();

UTL.cb("cap img01 1000");
wait();


$("#sys_btnRefresh").focus();
UTL.cb("cap img02 1000");
