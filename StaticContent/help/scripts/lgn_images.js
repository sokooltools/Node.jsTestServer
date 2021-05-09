// ----------------------------------------------------------
// Login Help image generation script.
// ----------------------------------------------------------

UTL.cb('out "help/images/~temp"');
$("#lgn_txtUsername").val("Admin");
$("#lgn_txtPassword").val("");
UTL.cb("aut");
UTL.cb("cap");      // 01
wait();
LGN.login();
UTL.cb("aut");
UTL.cb("cap 500");  // 02
UTL.cb("cap 2000"); // 03
wait(3000);
$("#net_rdoStatic").click();
UTL.cb("cap");      // 04
wait();
$("#net_txtIPAddress").ipAddress("192.168.10.");
NET.validateIpAddress($("#net_txtIPAddress"));
UTL.cb("aux");
UTL.cb("cap");      // 05
wait();
$("#net_btnReset").focus();
UTL.cb("cap");      // 06
wait();
CMN.showBusy(CFG.getCaption(CMN.msgs.RESETTING)); // Cheat.
UTL.cb("cap");		// 07
$("#net_btnReset").click();
wait();
UTL.cb("aut");
$("#net_cboNetworkAdapters").val(2);
NET.loadPage();
UTL.cb("cap");      // 08
wait();
$("#net_rdoStatic").click();
UTL.cb("aux");
UTL.cb("cap");      // 09
wait();
$("#net_txtIPAddress").ipAddress("192.168.10.50");
$("#net_txtSubnetMask").ipAddress("255.255.255.0");
NET.validateIpAddress($("#net_txtIPAddress"));
NET.validateIpAddress($("#net_txtSubnetMask"));
UTL.cb("aut");
UTL.cb("cap");      // 10
wait();
$("#net_cboNetworkAdapters").val(1);
NET.loadPage();
UTL.cb("cap");      // 11
