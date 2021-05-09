@echo off
set argC=0
for %%x in (%*) do Set /A argC+=1
if %argC%==4 goto SKIP_HELP

echo :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
echo :: StaticContent prebuild.cmd  (c) 2012-2017 The Parker Hannifin Corporation.
echo :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
echo ::
echo :: This command file is normally executed using the project's "Pre-build" event inside Visual Studio 2008.  
echo :: 
echo :: Its purpose is to:
echo ::   1) Check a select group of internally developed javascript files for errors prior to 
echo ::      compressing them for release.
echo ::   2) Copy another group of externally developed and pre-compressed javascript files for release.
echo ::   3) Update files copied for release with the current date and time to ensure their deployment.
echo :: 
echo :: To execute the script requires four arguments be specified such as:
echo ::
echo :: [Using Visual Studio]:
echo ::   "$(ProjectDir)PreBuild.cmd" "$(ConfigurationName)" "$(ProjectName)" "$(ProjectDir)" "$(TargetDir)"
echo ::
echo :: [Using Windows Explorer]:
echo ::   PreBuild.cmd 
echo ::              "Release"
echo ::              "StaticContent" 
echo ::              "C:\Parker\Tucson\trunk\ParkerWebCF\StaticContent\" 
echo ::              "S:\Tucson\Release\Web\Inetpub\"
echo ::
echo :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
echo.
pause
exit 0
::
:SKIP_HELP
::
:: call "$(DevEnvDir)..\Tools\vsvars32.bat"
::
:: Remove quotes from all args...
call:RemoveQuotes %1% _configName
call:RemoveQuotes %2% _projectName
call:RemoveQuotes %3% _projectDir
call:RemoveQuotes %4% _targetDir
::
set _ln=-------------------

set _srcScripts=%_projectDir%scripts\deploy\%_configName%\
set _prjScripts=%_projectDir%scripts\
set _tgtScripts=%_targetDir%scripts\
set _releaseIndicatorFile="%_projectDir%release"
::
set _ceTargetDir=\Windows\Parker\Web\Inetpub
set _docopyFileName=docopy.cmd
set _docopyCmd=%_prjScripts%temp\%_docopyFileName%
set _postbuildCmd=%_projectDir%postbuild.cmd
set _postdeplyCmd=%_projectDir%postdeploy.cmd
::
call:GetParentFolder "%_projectDir%" _solutionDir
set _compressExe=%_solutionDir%References\SharpLinter\SharpLinter.exe
::
echo.
echo.
echo +- %date% %time% -- Pre-build processing for ParkerWebCF "%_projectName%" started. %_ln%---+
echo.^|
echo ^|%_ln%+%_ln%%_ln%%_ln%%_ln%%_ln%--
echo ^| _configName       ^| %_configName%
echo ^| _projectName      ^| %_projectName%
echo ^| _projectDir       ^| %_projectDir%
echo ^| _solutionDir      ^| %_solutionDir%
echo ^| _targetDir        ^| %_targetDir%
echo ^| _postbuildCmd     ^| %_postbuildCmd%
echo ^| _postdeplyCmd     ^| %_postdeplyCmd%
echo ^| _docopyCmd        ^| %_docopyCmd%
echo ^| _prjScripts       ^| %_prjScripts%
echo ^| _srcScripts       ^| %_srcScripts%
echo ^| _tgtScripts       ^| %_tgtScripts%
echo ^| _compressExe      ^| %_compressExe%
echo ^| _ceTargetDir      ^| %_ceTargetDir%
echo ^|%_ln%+%_ln%%_ln%%_ln%%_ln%%_ln%--

call:CreatePostCmdFile "%_postbuildCmd%" build

call:CreatePostCmdFile "%_postdeplyCmd%" deploy

echo echo ^^^| The following javascript files are being reset:>>"%_postdeplyCmd%"
echo echo.^^^|>>"%_postdeplyCmd%"

echo if exist "%_targetDir%%_projectName%.dll" (>>"%_postbuildCmd%"
echo.	echo.^^^|  Deleting extraneous %_projectName%.dll from the target folder...>>"%_postbuildCmd%"
echo.	del/q "%_targetDir%%_projectName%.dll">>"%_postbuildCmd%"
echo.)>>"%_postbuildCmd%"
echo echo.^^^|>>"%_postbuildCmd%"

if "%_configName%" NEQ "Release" (
	echo goto SKIP>>"%_postbuildCmd%" 
)
:: Determine whether the configuration mode has changed.
:: Files only need to be copied when the configuration mode has been changed.
if "%_configName%"=="Release" (
	set extn=.min.js
	if exist %_releaseIndicatorFile% (
		goto DO_COMPRESSION
	) else (
		echo tmp>%_releaseIndicatorFile%
	)
) else (
	set extn=.js
	if exist %_releaseIndicatorFile% (
		del %_releaseIndicatorFile%
	) else (
		goto DO_COMPRESSION
	)
)

:: Copy configuration specific files to the project folder...
call:zcopy "%_srcScripts%detect%extn%"                     "%_prjScripts%detect.js"
call:zcopy "%_srcScripts%jquery%extn%"                     "%_prjScripts%jquery.js"
call:zcopy "%_srcScripts%jquery.mousewheel%extn%"          "%_prjScripts%jquery.mousewheel.js"
call:zcopy "%_srcScripts%jquery.validate%extn%"            "%_prjScripts%jquery.validate.js"
call:zcopy "%_srcScripts%jquery-migrate%extn%"             "%_prjScripts%jquery-migrate.js"
call:zcopy "%_srcScripts%moment%extn%"                     "%_prjScripts%moment.js"
call:zcopy "%_srcScripts%jquery-ui%extn%"                  "%_prjScripts%ui\jquery-ui.js"
call:zcopy "%_srcScripts%jquery-ui-timepicker-addon%extn%" "%_prjScripts%ui\jquery-ui-timepicker-addon.js"
call:zcopy "%_srcScripts%jquery.blockUI%extn%"             "%_prjScripts%ui\jquery.blockUI.js"

echo.^|
echo.^| Updating files copied to the project folder with current datetime to ensure deployment...
chdir/d "%_prjScripts%
copy/y  "%_prjScripts%detect.js" +,, >NUL
copy/y  "%_prjScripts%jquery.js" +,, >NUL
copy/y  "%_prjScripts%jquery.mousewheel.js" +,, >NUL
copy/y  "%_prjScripts%jquery.validate.js" +,, >NUL
copy/y  "%_prjScripts%jquery-migrate.js" +,, >NUL
copy/y  "%_prjScripts%moment.js" +,, >NUL
chdir/d "%_prjScripts%ui
copy/y  "%_prjScripts%ui\jquery-ui.js" +,, >NUL
copy/y  "%_prjScripts%ui\jquery-ui-timepicker-addon.js" +,, >NUL
copy/y  "%_prjScripts%ui\jquery.blockUI.js" +,, >NUL

:DO_COMPRESSION

call:GetDirectory "%_docopyCmd%" _path
if not exist "%_path%" (
	echo.^|
	echo ^| Creating "%_path%"...
	mkdir "%_path%"
)

echo.^|
echo ::=================================================================================== >"%_docopyCmd%"
echo :: Run this auto-generated command file on the CE 'post-deployment' in order to copy >>"%_docopyCmd%"
echo :: the following compressed files from this folder to the parent folder:             >>"%_docopyCmd%"
echo ::===================================================================================>>"%_docopyCmd%"
echo @echo off>>"%_docopyCmd%"
echo chdir "%_ceTargetDir%\scripts\temp">>"%_docopyCmd%"

echo.^| Checking modified javascript files for syntax errors (and performing compression) where necessary...

for /f %%f in ('dir /b %_prjScripts%tucson\*') do call:zcomp tucson\%%f

call:zcomp ui\jquery.ipaddress.js
:: call:zcomp ui\jquery.language.switcher.js

echo pause>>"%_docopyCmd%"

:: Add the footer to the end of the postbuild.cmd file.
call:AppendPostBuildFooter "%_postbuildCmd%"

echo echo.^^^|>>"%_postdeplyCmd%"
echo call:GetDT dt>>"%_postdeplyCmd%"
echo echo +- %%dt%% -- Post-deploy processing for ParkerWebCF "%_projectName%" completed. %_ln%+>>"%_postdeplyCmd%"
echo goto:EOF>>"%_postdeplyCmd%"
echo :GetDT>>"%_postdeplyCmd%"
echo set %%1=%%date%% %%time%%>>"%_postdeplyCmd%"
echo goto:EOF>>"%_postdeplyCmd%"

echo.^|
call:GetDT dt
echo +- %dt% -- Pre-build processing for ParkerWebCF "%_projectName%" completed. %_ln%-+
echo.
echo.
exit 0

::=============================================================================
:: REMOVEQUOTES
:: ----------------------------------------------------------------------------
:: Removes quotes from the input variable (arg1) returning the modified value 
:: in the output (arg2) variable.
:: Example -> call:RemoveQuotes "quotedString" retVar
:: ----------------------------------------------------------------------------
:RemoveQuotes
setlocal
for /f "useback tokens=*" %%a in ('%~1') do set ret=%%~a
endlocal&set %2=%ret%
goto:EOF
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


::=============================================================================
:: GETDIRECTORY
:: ----------------------------------------------------------------------------
:: Gets the directory portion of the path (i.e., the path minus the file)
:: Example ->  call:GetDirectory "pathIncludingFile" retVar
:: ----------------------------------------------------------------------------
:GetDirectory
set %2=%~dp1
goto:EOF
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


::=============================================================================
:: GETPARENTFOLDER
:: ----------------------------------------------------------------------------
:: Example ->  call:GetParentFolder "directoryPath" retVar
:: ----------------------------------------------------------------------------
:GetParentFolder
set tmpDir=%~1
if "%tmpDir:~-1%"=="\" set tmpDir=%tmpDir:~0,-1%
setlocal
for %%d in ("%tmpDir%") do set ret=%%~dpd
endlocal&set %2=%ret%
goto:EOF
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


::=============================================================================
:: ZCOPY
:: ----------------------------------------------------------------------------
:: Copies from source (arg1) to destination (arg2) echoing info to the console.
:: Example ->  call:zcopy %1 %2
:: ----------------------------------------------------------------------------
:zcopy
echo.^|
echo ^|  Copying %1
echo ^|       to %2...
copy/y %1 %2
if %errorlevel%==0 goto:EOF
echo The specified file could not be copied.
echo.
goto:EOF
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


::=================================================================================================
:: ZCOMP
:: ------------------------------------------------------------------------------------------------
:: 1) Copies the project folder + [project subfolder\file] (arg1) to a temporary folder.
:: 2) Performs compression on it using the predefined compression application.
:: 3) Copies the compressed file from the temporary folder to the target folder.
:: 
:: Example ->  call:zcomp %1
:: ------------------------------------------------------------------------------------------------
:zcomp
if not exist "%_compressExe%" (
	echo ^| Compression could not be performed because "%_compressExe%" could not be found.
	goto:EOF
)

set prjPath=%_prjScripts%%1
if not exist "%prjPath%" (
	echo ^| Compression could not be performed because "%prjPath%" could not be found.
	goto:EOF
)

:: Create the diff folder path if necessary.
set difPath=%_prjScripts%diff\%1
call:GetDirectory "%difPath%" _path
if not exist "%_path%" (
	mkdir %_path%
)

:: Create the temp folder path if necessary.
set tmpPath=%_prjScripts%temp\%1
call:GetDirectory "%tmpPath%" _path
if not exist "%_path%" (
	mkdir %_path%
)

if not exist "%difPath%" goto :START_COMPRESSION

:: Check whether the file has changed and if so skip compression.
fc "%prjPath%" "%difPath%" > nul
if %errorlevel%==0 goto:COPY_TO_TARGET

:START_COMPRESSION

echo.^|
echo ^| Checking "%prjPath%"

:: Copy the file from the project folder to the temp folder for compression.
copy/y "%prjPath%" "%tmpPath%">NUL

set ttc="%TEMP%\jslint.log"
:: Compress the file.
echo|set /p=^^^| & call "%_compressExe%" -ph best *.js -f "%tmpPath%" >%ttc%
type  %ttc%
findstr /c:"No errors found." /i %ttc% >NUL
if %errorlevel%==1 goto:EOF

::echo.^|

:END_COMPRESSION

:: Copy the file from the project folder to the diff folder for future comparison.
copy/y "%prjPath%" "%difPath%">NUL

:COPY_TO_TARGET
echo echo ^^^|  Copying "%%scrTmp%%%1"    >>"%_postbuildCmd%"
echo echo ^^^|       to "%%scrDst%%%1"... >>"%_postbuildCmd%"
echo echo^|set /p=^^^^^^^| ^& copy/y       "%%scrTmp%%%1" "%%scrDst%%%1">>"%_postbuildCmd%"

:POST_DEPLOY
echo echo ^^^|  "%%scrTmp%%%1"...>>"%_postdeplyCmd%"
echo echo. ^>"%%scrTmp%%%1"  >>"%_postdeplyCmd%"
::
:: Add a command to the batch file for running post-deployment on the PAC.
echo echo Copying "%1" to "..\%1">>"%_docopyCmd%"
echo copy "%1" "..\%1">>"%_docopyCmd%"
echo echo.>>"%_docopyCmd%"
goto:EOF
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


::=============================================================================
:: CREATEPOSTCMDFILE
:: ----------------------------------------------------------------------------
:: Example ->  call:CreatePostCmdFile "logFilepath" build|deploy 
:: ----------------------------------------------------------------------------
:CreatePostCmdFile
echo :: %_ln%%_ln%%_ln%%_ln%           >%1
echo :: This command file is auto-generated by the 'pre-build command file in StaticContent. >>%1
echo ::                               >>%1
echo :: (c) 2013-2017 Parker Hannifin >>%1
echo :: %_ln%%_ln%%_ln%%_ln%          >>%1
echo @echo off>>%1
echo set scrTmp=%_prjScripts%temp\>>%1
echo set scrDst=%_tgtScripts%>>%1
echo echo.>>%1
echo echo.>>%1
echo call:GetDT dt>>%1
echo echo +- %%dt%% -- Post-%2 processing for ParkerWebCF "%_projectName%" started. %_ln%---+>>%1
echo echo.^^^|>>%1
goto:EOF
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


::=============================================================================
:: APPENDPOSTBUILDFOOTER
:: ----------------------------------------------------------------------------
:: Example ->  call:AppendPostBuildFooter "logFilepath"
:: ----------------------------------------------------------------------------
:AppendPostBuildFooter
echo echo.^^^|>>%1
echo :SKIP>>%1
if "%_configName%"=="Debug" (
	echo echo ^^^| ===========================================================================================================>>%1
	echo echo ^^^|  To fully test the PAC, run the following command file at least once 'post-deployment' on the CE device:   >>%1
	echo echo.^^^|          "%_ceTargetDir%\scripts\temp\%_docopyFileName%"                                                   >>%1
	echo echo ^^^|  [This will allow full testing of the compressed javascript files which are used in the final release...]  >>%1
	echo echo ^^^| ===========================================================================================================>>%1
	echo echo.^^^|>>%1
	echo echo.^^^|>>%1
)
echo call:GetDT dt>>%1
echo echo +- %%dt%% -- Post-build processing for ParkerWebCF "%_projectName%" completed. %_ln%-+>>%1
echo echo.>>%1
echo echo.>>%1
echo goto:EOF>>%1
echo :GetDT>>%1
echo set %%1=%%date%% %%time%%>>%1
echo goto:EOF>>%1
goto:EOF
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


::=============================================================================
:: GetDT
:: ----------------------------------------------------------------------------
:GetDT
set %1=%date% %time%
goto:EOF
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
