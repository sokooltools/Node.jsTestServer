// ----------------------------------------------------------
// NetworkSettings Help image generation script.
// ----------------------------------------------------------
UTL.cb('out "help/images/~temp"');

// Make sure we are on the NET tab.
$("#NET").click();
UTL.cb("aux");
UTL.cb("cap img01 1000");
wait();

$("#net_txtIPAddress").ipAddress("192.168.10.57");
$("#net_txtSubnetMask").ipAddress("255.255.255.0");
NET.validateIpAddress($("#net_txtIPAddress"));
NET.validateIpAddress($("#net_txtSubnetMask"));
UTL.cb("aux");

CMN.showBusy(CFG.getCaption(CMN.msgs.SAVING));
UTL.cb("cap img10 1000");
wait();

CMN.showBusy(CMN.lookup(NET.xml, NET.msgs.CHANGES_TO_TAKE_EFFECT));
UTL.cb("cap img11 1000");
wait();

CMN.showBusy(String.format(CMN.lookup(NET.xml, NET.msgs.ATTEMPTING_RECONNECT), "192.168.10.57"));
UTL.cb("cap img12 1000");
wait();

NET.disableSaveAndResetButtons();
CMN.showBusy(CFG.getCaption(CMN.msgs.REFRESHING));
UTL.cb("cap img13 1000");
wait();

NET.enableSaveAndResetButtons();
CMN.showBusy(CFG.getCaption(CMN.msgs.RESETTING));
UTL.cb("cap img14 1000");
wait();

CMN.hideBusy();

