// -----------------------------------------------------------------------
// DevTools Snippet Manager.
// -----------------------------------------------------------------------

console.clear();

let _app_window;
let _docx;
let _dropZoneElement;
let _isSelecting = false;
let _eventTargetInnerText;

let count = new class Counters {
	filesToProcess = 0;
	filesProcessed = 0;
	added = 0;
	replaced = 0;
	total = 0;
	initialize() {
		this.filesToProcess = 0;
		this.filesProcessed = 0;
		this.added = 0;
		this.replaced = 0;
		this.total = 0;
	}
}

const state = {
	scriptSnippets: [],
	lastIdentifier: 0,
	thisSnippet: [],
	thisSnippetName: "DevToolsSnippetManager",
	thisSnippetDesc: "DevTools Snippet Manager"
};

/** -------------------------------------------------------------------------------------------
* Provides an indication as to whether this window was opened from 'DevTools' of 'DevTools'.
*/
const isDevToolsOfDevTools = location.origin.startsWith("devtools://devtools");

/** -------------------------------------------------------------------------------------------
* Provides an indication as to whether this window was opened from a webpage connected to LocalHost.
*/
const isLocalHost = location.hostname === "localhost";

const HZLN = `${"-".repeat(65)}\n`;
const DEVTOOLS = `<i>DevTools</i>`;
const CS = "[Current Snippets]";
const CURRENT_SNIPPETS = `<span class='bracket left'>[</span><span class='current_snippets'>Current Snippets</span><span class='bracket right'>]</span>`;
const DEFAULT_ROOT = "http://localhost:3000";

const HTML_FILENAME = `snippetmanager.htm`;
const WIN_TITLE = `DevTools Snippet Manager`;
const URL_BGRINS = `https://raw.githubusercontent.com/bgrins/devtools-snippets/master/snippets/`;
const URL_BAHMUTOV = `https://raw.githubusercontent.com/bahmutov/code-snippets/master/`;
const DROP_ZONE_PROMPT = `Drop a '.json' file or multiple '.js' files here (or click here to select the files) to add to ${CURRENT_SNIPPETS}…`;
const NO_CHECKMARKS_WARNING = `To {0}, requires at least one item to be selected in ${CURRENT_SNIPPETS}.`;

const SAVE_SUCCESS = `<p>The selected snippets were successfully saved to ${DEVTOOLS}.</p>
<p>Note:&nbsp;You can continue to manage ${CURRENT_SNIPPETS} using this <i>DevTools Snippet Manager</i>.</p>
<p>To see the changes reflected in the <b>Snippets</b> tab of ${DEVTOOLS},
you will need to close this window and all ${DEVTOOLS} windows; then open a new ${DEVTOOLS} window.<p>`;

const CONFIRM_DOWNLOAD = `<p>Ok to download <cnt>{0}</cnt> of <cnt>{1}</cnt> snippets in ${CURRENT_SNIPPETS}?<p/>
<p>(Note:&nbsp;To circumvent multiple security confirmations, the files will be downloaded with a "<i>.txt</i>"
extension instead of a "<i>.js</i>" extension).</p>`;

const SAVE_TITLE = `Saves the selected items in ${CS} to 'DevTools'.\n`
	+ HZLN + (isDevToolsOfDevTools
		? `Note: Since all the snippets in 'DevTools' will be REPLACED by the selected items in\n`
		+ `${CS}, you will be prompted to confirm this action prior to it actually being performed.`
		: `Note: This action can only be performed when "${state.thisSnippetDesc}" is opened in 'DevTools' of 'DevTools'.\n`
		+ `Try the following 3 steps:\n`
		+ `	Close this window.\n`
		+ `	Press CTRL+SHIFT+I.\n`
		+ `	Run this "${state.thisSnippetDesc}" snippet again.`);

const SAVE_TOKEN_MSG1 = `<p>Note: the currently running snippet (i.e., "{0}"),
will always be saved in ${DEVTOOLS} even when it has not been selected in ${CURRENT_SNIPPETS}.</p>`;

const SAVE_TOKEN_MSG2 = `<p>Please be aware that performing the <i>Save...</i> results in all the snippets in ${DEVTOOLS}
being overwritten by the selected snippets in ${CURRENT_SNIPPETS}.</p>`;

const DialogButton = Object.freeze({
	CANCEL: 0,
	CLOSE: 1,
	OK: 2
});

let buttons = new class Buttons {
	Checkall;
	Uncheckall;
	Invert;
	Remove;
	Sort;
	Reload;
	Save;
	DownloadSingleJson;
	DownloadMultipleJs;
	LoadBgrins;
	LoadBalmutov;
	DoTest;
	initialize() {
		this.Checkall = _docx.getElementById("snip_checkall_btn");
		this.Checkall.addEventListener("click", checkAllCheckboxes);
		this.Checkall.setAttribute("title", `Adds a checkmark to all the snippets in ${CS}.`);

		this.Uncheckall = _docx.getElementById("snip_uncheckall_btn");
		this.Uncheckall.addEventListener("click", uncheckAllCheckboxes);
		this.Uncheckall.setAttribute("title", `Removes the checkmark from all the snippets in ${CS}.`);

		this.Invert = _docx.getElementById("snip_invert_btn");
		this.Invert.addEventListener("click", invertAllCheckboxes);
		this.Invert.setAttribute("title", `Inverts the checkmark of all the snippets in ${CS}\n`
			+ "(i.e., switches currently 'checked' with 'unchecked' and vice versa).");

		this.Remove = _docx.getElementById("snip_remove_btn");
		this.Remove.addEventListener("click", removeSnippets);
		this.Remove.setAttribute("title", `Removes the selected items from ${CS}.`);

		this.Sort = _docx.getElementById("snip_sort_btn");
		this.Sort.addEventListener("click", sortCurrentSnippets);
		this.Sort.setAttribute("title", `Sorts all the snippets in ${CS} in case-insensitive ascending order.`);

		this.Reload = _docx.getElementById("snip_reload_btn");
		this.Reload.addEventListener("click", loadCurrentSnippets);
		this.Reload.setAttribute("title", `Reloads ${CS} with the snippets from DevTools.`);

		this.Save = _docx.getElementById("snip_save_btn");
		this.Save.addEventListener("click", saveSnippets);
		this.Save.setAttribute("title", SAVE_TITLE);

		this.DownloadSingleJson = _docx.getElementById("snip_downloadSingleJson_btn");
		this.DownloadSingleJson.addEventListener("click", downloadSingleJsonFile);
		this.DownloadSingleJson.setAttribute("title", `Downloads the selected items in ${CS} as a single unified '.json' file.`);

		this.DownloadMultipleJs = _docx.getElementById("snip_downloadMultipleJs_btn");
		this.DownloadMultipleJs.addEventListener("click", downloadMultipleJsFiles);
		this.DownloadMultipleJs.setAttribute("title", `Downloads the selected items in ${CS} as multiple '.js' files.`);

		this.LoadBgrins = _docx.getElementById("snip_loadbgrins_btn");
		this.LoadBgrins.addEventListener("click", loadSnippetsFromBgrins);
		this.LoadBgrins.setAttribute("title", `Adds snippets to ${CS} from the following repository:\n..."${URL_BGRINS}"`);

		this.LoadBalmutov = _docx.getElementById("snip_loadbahmutov_btn");
		this.LoadBalmutov.addEventListener("click", loadSnippetsFromBahmutov);
		this.LoadBalmutov.setAttribute("title", `Adds snippets to ${CS} from the following repository:\n..."${URL_BAHMUTOV}"`);

		this.DoTest = _docx.getElementById("snip_dotest_btn");
		this.DoTest.addEventListener("click", doTest);
		this.DoTest.setAttribute("title", `Runs a pre-defined unit test.`);
	}
}

function doTest() {
	//debugger;
	console.log(DialogButton.OK);
	doTest1();
}

async function doTest1() {
	console.clear();
	console.log("Test started...");
	let result = await showMsg(CONFIRM_DOWNLOAD.format(getCheckmarkedSnippetCount(), state.scriptSnippets.length), ["OK*", "Cancel"], false);
	console.log(result);
	if (result === "OK") {
		result = await showMsg(SAVE_SUCCESS, ["OK", "Cancel", "Other…*"], false, 10);
		console.log(result);
		if (result === "Other…")
			result = await showMsg("You chose button: <i>'Other…'</i> in the preceding dialog.");
		if (result === "OK") {
			result = await showMsg(SAVE_TOKEN_MSG1.format(state.thisSnippet.name), ["OK"]);
			console.log(result);
			if (result === "OK") {
				result = await showMsg(SAVE_TOKEN_MSG2, [], true, 10);
				console.log(result);
			}
		}
	}
	console.log("Test finished.");
}

function decode(msg) {
	msg = msg.replace(/\<[bi]?\>|\<\/[bi]\>/, "");
	return msg;
}

/** -------------------------------------------------------------------------------------------
* Opens a new window as _app_window.
*/
function openAppWindow() {
	console.log(`[openAppWindow] Opening '${WIN_TITLE}' window…`);
	let deltaW = Math.abs(window.outerWidth - window.innerWidth);
	let deltaH = Math.abs(window.outerHeight - window.innerHeight);
	let winWth = 738 + (isDevToolsOfDevTools ? 16 : 0);
	let winHgt = 526 + (isDevToolsOfDevTools ? deltaH : 0);
	let winLft = (window.screen.width - winWth) / 2;
	let winTop = (window.screen.height - winHgt) / 2;
	const windowFeatures = `popup, menubar=0, left=${winLft}, top=${winTop}, width=${winWth}, height=${winHgt}`;
	_app_window = window.open("", "", windowFeatures);
	_app_window.addEventListener('beforeunload', () => {
		console.log(`[openAppWindow] Closing '${WIN_TITLE}' window…`);
	});
	window.addEventListener('beforeunload', () => {
		console.log(`[openAppWindow] Browser about to be unloaded…`);
		closeAppWindow();
	});
	_docx = _app_window.document;
	_docx.head.innerHTML = `
	${HTML_META}
	<title>${HTML_TITLE}</title>
	<style>${HTML_STYLE}</style>
	<script>${HTML_SCRIPT}</script>`;
	_docx.body.innerHTML = HTML_BODY;
	initializePage();
}

/** -------------------------------------------------------------------------------------------
* Opens this window.
*/
function openThisWindow(winName) {
	console.log(`Opening "${winName}"…`);
	_app_window = window;
	_app_window.addEventListener('beforeunload', () => {
		console.log(`[openThisWindow] '${WIN_TITLE}' window about to be unloaded…`);
	});
	_docx = _app_window.document;
	_docx.addEventListener("DOMContentLoaded", () => {
		initializePage();
	});
}

/** -------------------------------------------------------------------------------------------
 * Performs the steps needed to initialize this page.
 */
function initializePage() {
	console.log("Initializing Page…")
	_docx.querySelector("title").textContent = WIN_TITLE;
	_docx.getElementById("page_header").innerHTML = WIN_TITLE;
	_docx.getElementById("drop-zone__prompt").innerHTML = DROP_ZONE_PROMPT;
	loadCurrentSnippets();
	preserveThisSnippet();
	buttons.initialize();
	setMiscElementTitles();
	addEventsToDropZone();
}

/** -------------------------------------------------------------------------------------------
 * Sorts the [Current Snippets] in ascending order by its (case-insensitive) name.
 */
function sortCurrentSnippets() {
	// Hold onto the checkmarked snippets so they can be re-checkmarked following the sort.
	let checkedSnippets = getCheckmarkedSnippets();
	state.scriptSnippets = sortSnippets(state.scriptSnippets);
	finishLoad();
	setCheckmarkedSnippets(checkedSnippets)
}

/** -------------------------------------------------------------------------------------------
 * Loads or reloads the snippets from DevTools into [Current Snippets] when this code is being 
 * run from DevTools of DevTools. In all other cases it loads or reloads an example set of 
 * sequentially numbered snippets (e.g. 'example_snippet1', 'example_snippet2', etc.) to
 * [Current Snippets].
*/
function loadCurrentSnippets() {
	if (isDevToolsOfDevTools) {
		console.log(`Loading ${CS} directly from DevTools…`)
		getSnippetsFromDevTools().then((snips) => {
			state.scriptSnippets = snips;
			getLastIdentifierFromDevTools().then((id) => {
				state.lastIdentifier = id;
				finishLoad();
			});
		});
	} else if (isLocalHost) {
		console.log(`Loading ${CS} from DevTools… (via NodeJS)`)
		doGet("/test/snippets", (snips) => {
			if (typeof snips === "object") {
				state.scriptSnippets = snips;
			} else {
				console.error(snips);
				state.scriptSnippets = [];
			}
			finishLoad();
		}, 1000);
	} else {
		console.log(`Loading ${CS} with samples…`)
		state.scriptSnippets = [];
		for (let index = 0; index < 30; index++) {
			state.scriptSnippets.push(createSnippet(`example_snippet${index}`, `snippet${index} content`));
		}
		state.lastIdentifier = `${state.scriptSnippets.length}`;
		finishLoad();
	}
}

/** -------------------------------------------------------------------------------------------
 * Finishes, i.e., 'performs' the last step of the load process.
*/
function finishLoad() {
	renderCurrentSnippets();
	addChangeEventToAllSnippetCheckboxes();
	addMouseEventsToAllSnippetCheckboxes();
	updateCurrentSnippetsHeader();
	enableOrDisableButtons();
}

/** -------------------------------------------------------------------------------------------
 * Changes the checkboxes of all snippets in [Current Snippets] to be 'checked'.
 */
function checkAllCheckboxes() {
	const checkboxes = _docx.querySelectorAll(".snip_row input");
	checkboxes.forEach((checkbox, index) => {
		if (!checkbox.checked) {
			checkbox.checked = true;
			addOrRemoveCustomCheckmark({
				target: checkbox
			});
		}
	});
}

/** -------------------------------------------------------------------------------------------
 * Changes the checkboxes of all snippets in [Current Snippets] to be 'unchecked'.
 */
function uncheckAllCheckboxes() {
	const checkboxes = _docx.querySelectorAll(".snip_row input");
	checkboxes.forEach((checkbox, index) => {
		if (checkbox.checked) {
			checkbox.checked = false;
			addOrRemoveCustomCheckmark({
				target: checkbox
			});
		}
	});
}

/** -------------------------------------------------------------------------------------------
 * Inverts the checkboxes of all snippets in [Current Snippets], i.e, changes currrently 
 * 'checked' to 'unchecked' and vice versa.
 */
function invertAllCheckboxes() {
	const checkboxes = _docx.querySelectorAll(".snip_row input");
	checkboxes.forEach((checkbox, index) => {
		checkbox.checked = !checkbox.checked;
		addOrRemoveCustomCheckmark({
			target: checkbox
		});
	});
}

/** -------------------------------------------------------------------------------------------
 * Removes all checkmarked snippets from [Current Snippets].
 */
async function removeSnippets() {
	let cnt = getCheckmarkedSnippets().length;
	if (!cnt) {
		await showMsg(NO_CHECKMARKS_WARNING.format("<i>Remove</i> snippets"), ["OK"], true, 15);
		return;
	}
	const checkboxes = _docx.querySelectorAll("div.snip_custom_box");
	for (let index = checkboxes.length - 1; index >= 0; index--) {
		const checkbox = checkboxes[index];
		if (checkbox.classList.contains("active")) {
			checkbox.parentElement.remove();
			state.scriptSnippets.splice(index, 1);
		}
	}
	updateCurrentSnippetsHeader();
	enableOrDisableButtons();
}

/** -------------------------------------------------------------------------------------------
* Saves all the checkmarked snippets in [Current Snippets] to 'Devtools' following user 
* confirmation.
*/
async function saveSnippets() {
	let total = state.scriptSnippets.length;
	let checkedSnippets = getCheckmarkedSnippets();
	let cnt = checkedSnippets.length;
	if (!cnt) {
		await showMsg(NO_CHECKMARKS_WARNING.format(`<i>Save</i> snippets to ${DEVTOOLS}`), ["OK"], true, 15);
		return;
	}
	let token = "</br></br>";
	// Make sure to add state.thisSnippet to the array if it's missing.
	let index = checkedSnippets.findIndex(s => s.name.toLowerCase() === state.thisSnippetName.toLowerCase());
	if (index < 0) {
		checkedSnippets.push(state.thisSnippet);
		token += SAVE_TOKEN_MSG1.format(state.thisSnippet.name);
	}
	token += SAVE_TOKEN_MSG2;
	let msg = (cnt < total)
		? `Save just <cnt>${cnt}</cnt> of <cnt>${total}</cnt> items in ${CURRENT_SNIPPETS} to ${DEVTOOLS}?${token}`
		: `Save all <cnt>${total}</cnt> items in ${CURRENT_SNIPPETS} to ${DEVTOOLS}?${token}`;
	let result = await showMsg(msg, ["Save", "Cancel"]);
	if (result === "Save") {
		saveCkeckmarkedSnippetsToDevTools(checkedSnippets);
	}
}

/** -------------------------------------------------------------------------------------------
* Downloads all the snippets as a single unified ".json" file containg an array of snippets.
* The information for each file comes from the state.scriptSnippets object and the file
* is downloaded to the user's default "Downloads" folder.
*/
async function downloadSingleJsonFile() {
	let snippets = getCheckmarkedSnippets();
	let cnt = snippets.length;
	if (!cnt) {
		await showMsg(NO_CHECKMARKS_WARNING.format("'Download' a single '.json' file"), ["OK"]);
		return;
	}
	let total = state.scriptSnippets.length;
	let fname = `edge-snippets${getDateTimeToken()}.json`;
	const json_data = serialize({
		"script-snippets": snippets
	}, ["script-snippets", "name", "content"], 2);
	download(json_data, fname);
	console.log(`Downloaded file "${fname}" containing ${cnt} of ${total} items in ${CS}.`);
}

/** -------------------------------------------------------------------------------------------
 * Downloads all the snippets as individual ".js" files.
 * The information for each downloaded file is defined in the 'state' object and all the files
 * are downloaded to the user's default "Downloads" folder.
 */
async function downloadMultipleJsFiles() {
	let snippets = getCheckmarkedSnippets();
	let cnt = snippets.length;
	if (!cnt) {
		await showMsg(NO_CHECKMARKS_WARNING.format("'Download' multiple '.js' files"), ["OK"]);
		return;
	}
	let total = state.scriptSnippets.length;
	let result = await showMsg(CONFIRM_DOWNLOAD.format(cnt, total));
	if (result === "OK") {
		console.clear();
		for (let i = 0; i < cnt; i++) {
			let snippet = snippets[i];
			let fname = snippet.name + ".txt";
			download(snippet.content, fname);
			console.log(`Downloaded (${i + 1} of ${cnt}) files: "${fname}".`);
			await wait(100);
		}
	}
}

/** -------------------------------------------------------------------------------------------
 * Returns an indication whether a snippet with the specified name exists in the
 * state.scriptSnippets array.
 *
 * @param {any} snippetName The name of the snippet to find.
 * @returns true if a snippet with the specified name exists in the array; otherwise false.
 */
function snippetExists(snippetName) {
	const result = state.scriptSnippets.filter((s) => s.name === snippetName)
	return (result) ? result.length > 0 : false;
}

/** -------------------------------------------------------------------------------------------
 * Returns the index in the state.scriptSnippets array containing the snippet with the specified
 * name; Returns -1 when the specified name is not found in the array. 
 *
 * @param {any} snippetName The name of the snippet to find.
 * @returns The index in the state.scriptSnippets array containing the snippet with the 
 * specified name; otherwise -1.
 */
function findSnippetIndex(snippetName) {
	let index = state.scriptSnippets.findIndex(s => s.name === snippetName);
	return index;
}

/** -------------------------------------------------------------------------------------------
* Closes the app window, but only if it is open.
*/
function closeAppWindow() {
	if (_app_window && !_app_window.closed) {
		console.log(`Closing '${WIN_TITLE}' window…`);
		_app_window.close();
		_app_window = undefined;
	}
}

/** -------------------------------------------------------------------------------------------
 * Renders all snippet objects in state.scriptSnippets array unless a value for the 'newSnippet'
 * argument is provided, in which case it simply appends the new snippet to [Current Snippets].
 * @example
 *
 *  <label class="snip_row" title="snippet0 content">
		<input type="checkbox" class="snip_input" />
		<div class="snip_custom_box">
			<div class="snip_custom_chk">
				<div class="snip_custom_chk_line1"></div>
				<div class="snip_custom_chk_line2"></div>
			</div>
		</div>
		<p>snippet0</p>
	</label>
 *
 * @param {object} newSnippet An optional new snippet object to append to [Current Snippets].
 */
function renderCurrentSnippets(newSnippet) {
	const cont = _docx.getElementById("snip_list");
	if (newSnippet) {
		renderSnippet(newSnippet);
	} else {
		cont.innerHTML = "";
		state.scriptSnippets.forEach((snippet) => {
			renderSnippet(snippet);
		});
	}
	function renderSnippet(snippet) {
		const labl = _docx.createElement("label");
		const inpt = _docx.createElement("input");
		const chek = _docx.createElement("div");
		const cust = _docx.createElement("div");
		const lin1 = _docx.createElement("div");
		const lin2 = _docx.createElement("div");
		const p = _docx.createElement("p");
		//
		labl.classList.add("snip_row");
		labl.setAttribute("title", snippet.content);
		inpt.setAttribute("type", "checkbox");
		inpt.classList.add("snip_input");
		chek.classList.add("snip_custom_box");
		cust.classList.add("snip_custom_chk");
		lin1.classList.add("snip_custom_chk_line1");
		lin2.classList.add("snip_custom_chk_line2");
		//
		chek.appendChild(cust);
		cust.appendChild(lin1);
		cust.appendChild(lin2);
		labl.appendChild(inpt);
		labl.appendChild(chek);
		labl.appendChild(p).innerHTML = snippet.name;
		cont.appendChild(labl);
	}
}

/** -------------------------------------------------------------------------------------------
 * Updates the header of [Current Snippets] to show the number of snippets
 */
function updateCurrentSnippetsHeader() {
	const snip_cnt = _docx.getElementById("snip_cnt");
	snip_cnt.innerHTML = `${state.scriptSnippets.length}`;
	const snip_mode = _docx.getElementById("snip_mode");
	snip_mode.innerHTML = `${(isDevToolsOfDevTools) ? "" : (isLocalHost) ? "(Read-Only)" : "(Examples)"}`;
}

/** -------------------------------------------------------------------------------------------
 * Adds the specified snippet to the state.scriptSnippets array if it does not already exist;
 * otherwise it either replaces the contents of the existing snippet or adds the snippet with 
 * "_copy" appended (depending on the radio button setting in the UI).
 *
 * @param {string} name The name of the snippet.
 * @param {string} content The content of the snippet.
 */
function addCurrentSnippet(name, content) {
	let index = findSnippetIndex(name);
	if (index >= 0) {
		let addItRadioButton = _docx.querySelector("label#add_it_radio input");
		if (addItRadioButton.checked) {
			addCurrentSnippet(name + "_copy", content);
		} else {
			state.scriptSnippets[index].content = content;
			count.replaced++;
			count.total++;
		}
	} else {
		let newSnippet = createSnippet(name, content);
		state.scriptSnippets.push(newSnippet);
		state.lastIdentifier = newSnippet.id;
		renderCurrentSnippets(newSnippet);
		addChangeEventToNewSnippetCheckbox();
		addMouseEventsToNewSnippetCheckbox();
		updateCurrentSnippetsHeader();
		enableOrDisableButtons();
		count.added++;
		count.total++;
	}
}

/** -------------------------------------------------------------------------------------------
 * Creates and returns a new snippet object based on the specified name and content.
 *
 * @param {any} name The name of the snippet.
 * @param {any} content The content of the snippet.
 * @returns A new snippet having a name, content and auto-generated id.
 */
function createSnippet(name, content) {
	return {
		name: name,
		content: content //,id: serialize(parseInt(state.lastIdentifier) + 1)
	}
}

/** -------------------------------------------------------------------------------------------
 * Saves the checkmarked snippets in [Current Snippets] to DevTools.
 */
async function saveCkeckmarkedSnippetsToDevTools(snippetArray) {
	let snippets = serialize(snippetArray);
	let lastIdentifier = serialize(`${snippetArray.length}`);
	// console.log("\"script-snippets\":", snippets);
	// console.log("\"script-snippets-last-identifier\":", lastIdentifier);
	if (isDevToolsOfDevTools) {
		InspectorFrontendHost.setPreference("script-snippets", snippets);
		InspectorFrontendHost.setPreference("script-snippets-last-identifier", lastIdentifier);
	}
	await showMsg(SAVE_SUCCESS, ["OK"], true, 15);
}

/** -------------------------------------------------------------------------------------------
 * Returns a promise containing an ordered array of all the snippets in DevTools, (or optionally 
 * just the single snippet having the specified name).
 *
 * @param {string} snippetName The name of a single snippet to find.
 */
function getSnippetsFromDevTools(snippetName) {
	return new Promise((resolve, reject) => {
		InspectorFrontendHost.getPreferences(prefs => {
			let data = deserialize(prefs["script-snippets"]);
			if (snippetName === undefined) {
				data = sortSnippets(data);
			} else {
				data = data.find(t => t.name === snippetName);
			}
			resolve(data);
		});
	});
}

/** -------------------------------------------------------------------------------------------
 * Sorts the array of snippet objects in ascending order by snippet name and returns it.
 *
 * @param {object} snippets The array of snippets.
 * @returns The snippet array sorted in ascending order by snippet name.
 */
function sortSnippets(snippets) {
	return snippets.sort((a, b) => {
		return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
	});
}

/** -------------------------------------------------------------------------------------------
 * Gets the last script snippets identifier stored inside DevTools.
 *
 * @returns The last script snippets identifier stored inside DevTools.
 */
function getLastIdentifierFromDevTools() {
	return new Promise((resolve, reject) => {
		InspectorFrontendHost.getPreferences(prefs => {
			const data = (prefs["script-snippets-last-identifier"]);
			resolve(data);
		});
	});
}

/** -------------------------------------------------------------------------------------------
 * Preserve a copy of this snippet to make sure it is in DevTools following a request to 'save'
 * the selected snippets to DevTools.
 */
function preserveThisSnippet() {
	if (isDevToolsOfDevTools) {
		getSnippetsFromDevTools(state.thisSnippetName).then(function (result) {
			state.thisSnippet = result;
		}, function (error) {
			console.error(error);
		});
	} else {
		state.thisSnippet = createSnippet(state.thisSnippetName, "Example content of 'This Snippet'")
	}
}

// Snippet List  //////////////////////////////////////////////////////////////////

/** -------------------------------------------------------------------------------------------
 * Adds or removes the checkmark from the custom checkbox by adding an "active" class or 
 * removing the "active" class from it.
 * 
 * @param {any} event The event whose target's parent is the custom checkbox
 */
function addOrRemoveCustomCheckmark(event) {
	const checkbox = event.target;
	const customCheckboxBox = checkbox.parentElement.querySelector(".snip_custom_box");
	if (checkbox.checked) {
		customCheckboxBox.classList.add("active");
	} else {
		customCheckboxBox.classList.remove("active");
	}
	enableOrDisableButtons();
}

/** -------------------------------------------------------------------------------------------
* Enables or disables buttons based on several conditions: 
* 1) whether there are any snippets in [Current Snippets]. 
* 2) whether there are any checkboxes in [Current Snippets] containing a checkmark.
* 3) whether this window was opened from a 'DevTools of DevTools' window.
*/
function enableOrDisableButtons() {
	let isNoneChecked = getCheckmarkedSnippetCount() === 0;
	let noSnippets = state.scriptSnippets.length === 0;
	buttons.Checkall.disabled = noSnippets;
	buttons.Uncheckall.disabled = noSnippets;
	buttons.Invert.disabled = noSnippets;
	buttons.Remove.disabled = isNoneChecked;
	buttons.Sort.disabled = noSnippets;
	buttons.Reload.disabled = false;
	buttons.Save.disabled = isNoneChecked || !isDevToolsOfDevTools;
	buttons.DownloadSingleJson.disabled = isNoneChecked;
	buttons.DownloadMultipleJs.disabled = isNoneChecked;
}

/** -------------------------------------------------------------------------------------------
* Gets an array of all the snippet ojects in [Current Snippets] containing a checkmark.
*/
function getCheckmarkedSnippets() {
	let snippets = [];
	const checkedboxes = _docx.querySelectorAll(".snip_row input");
	checkedboxes.forEach((checkbox, index) => {
		if (checkbox.checked)
			snippets.push(state.scriptSnippets[index]);
	});
	return snippets;
}

function setCheckmarkedSnippets(checkedSnippets) {
	let index;
	const checkedboxes = _docx.querySelectorAll(".snip_row input");
	checkedSnippets.forEach((snippet) => {
		index = findSnippetIndex(snippet.name);
		if (index) {
			let checkbox = checkedboxes[index];
			checkbox.checked = true;
			addOrRemoveCustomCheckmark({
				target: checkbox
			});
		}
	});
}

// The following 4 function handlers are used in conjunction with the [Current Snippets] list.

/** -------------------------------------------------------------------------------------------
 * Gets the number of snippets in [Current Snippets] containing a checkmark.
 *
 * @returns The number of [Current Snippets] containing a checkmark.
 */
function getCheckmarkedSnippetCount() {
	const checkedboxes = _docx.querySelectorAll(".snip_row input:checked");
	return (checkedboxes) ? checkedboxes.length : 0;
}

function processMouseDown(event) {
	if (event.shiftKey) {
		_isSelecting = true;
		processMouseEnter(event);
		event.preventDefault();
	}
}

function processMouseLeave() {
	_isSelecting = false;
	_eventTargetInnerText = "";
}

function processMouseUp() {
	_isSelecting = false;
	_eventTargetInnerText = "";
}

function processMouseEnter(event) {
	let txt = event.target.innerText;
	if (_isSelecting && (txt === "" || txt !== _eventTargetInnerText)) {
		if (event.shiftKey) {
			let checkbox = event.target.closest(".snip_row").firstElementChild;
			checkbox.checked = event.ctrlKey === false;
			addOrRemoveCustomCheckmark({
				target: checkbox
			});
		}
		_eventTargetInnerText = txt;
	}
}

/** -------------------------------------------------------------------------------------------
* Sets the 'title' attribute of several miscellaneous elements in the UI.
*/
function setMiscElementTitles() {
	setTitle("add_or_replace_it", `Indicates what should happen when adding a snippet which already exists in ${CS}.`);
	setTitle("add_it_radio", `When hilighted, the snippet will be 'ADDED' to ${CS}\n`
		+ `as a new snippet with '_copy' appended to its name.`);
	setTitle("replace_it_radio", `When hilighted, the snippet will 'REPLACE' the existing snippet in ${CS}.`);
	setTitle("drop_files", "Click or drop a '.js' or '.json' file here…");
	setTitle("snip_header",
		`Initially shows a list of all snippets saved in 'DevTools', i.e., when this\n`
		+ `snippet is run from 'DevTools' of 'DevTools' by pressing Ctrl+Shft+I,\n`
		+ `or when run in 'DevTools' opened from a web page served up from 'NodeJS'.\n`
		+ `In all other cases, this list is shown using auto-generated "example" snippets.\n`
		+ HZLN
		+ `Subsequent snippets added, replaced, or removed during the current session will\n`
		+ `also be reflected in this list.\n`
		+ HZLN
		+ `Click anywhere on a row in this list to select or deselect the snippet;\n`
		+ `Hold down the SHIFT key while dragging to select multiple snippets;\n`
		+ `Hold down the SHIFT key + CTRL key while dragging to deselect multiple snippets.`);
	setTitle("modal_close_btn", `Click to close this dialog.\n`
		+ `(Note: when this button is 'red', you can also \n`
		+ `click anywhere outside the dialog to close it.)`);
	function setTitle(elementId, text) {
		_docx.getElementById(elementId).setAttribute("title", text);
	}
}

/** -------------------------------------------------------------------------------------------
 * Shows a rollup message containing the overall count of snippets added and/or snippets
 * replaced in [Current Snippets].
 *
 * @ count.total The total number of snippets added or replaced.
 * @ count.added The number of snippets added to [Current Snippets].
 * @ count.replaced The number of snippets replaced in [Current Snippets].
 */
async function showRollup() {
	let msg;
	if (count.total === count.added)
		msg = `${getToken(count.total, 'added')} to ${CURRENT_SNIPPETS}.`;
	else if (count.total === count.replaced)
		msg = `${getToken(count.total, 'replaced')} in ${CURRENT_SNIPPETS}.`;
	else
		msg = `${getToken(count.added, 'added')};&nbsp;&nbsp;`
			+ `${getToken(count.replaced, 'replaced')} in ${CURRENT_SNIPPETS}.`;
	const result = await showMsg(msg, [], true, 10);
	function getToken(cnt, txt) {
		return `<cnt>${cnt}</cnt> Snippet${cnt === 1 ? ' was' : 's were'} <b>${txt}</b>`;
	}
}

/** -------------------------------------------------------------------------------------------
 * Loads [Current Snippets] using the array of snippet objects read from a '.json' file.
 *
 * @param {any} contentString An array of snippet objects.
 * (Each element of the array contains a 'name' and a 'content' property).
 */
function loadSnippetsFromJsonFile(contentString) {
	let jsonData = deserialize(contentString);
	let jsonDataSorted = sortSnippets(jsonData["script-snippets"]);
	jsonDataSorted.forEach(snippet => {
		addCurrentSnippet(snippet.name, snippet.content);
	});
}

function loadSnippetsFromBgrins() {
	loadSnippetsFromExternal(`${URL_BGRINS}{0}/{0}.js`, ['allcolors', 'cachebuster', 'cssreload', 'cssprettifier', 'hashlink']);
}

function loadSnippetsFromBahmutov() {
	loadSnippetsFromExternal(`${URL_BAHMUTOV}{0}.js`, ['timing', 'profile-method-call', 'time-method-call']);
}

function loadSnippetsFromExternal(url, snippetsArray) {
	document.querySelector("html").style.cursor = "wait";
	try {
		count.initialize();
		snippetsArray.forEach((snippetName) => {
			xhrGetRequest(url.format(snippetName), (request) => {
				addCurrentSnippet(snippetName, request.target.response);
			});
		});
	} finally {
		setTimeout(() => {
			document.querySelector("html").style.cursor = "default";
		}, 200);
	}
	showRollup();
}

function loadFiles(files) {
	count.initialize();
	count.filesToProcess = files.length;
	const stack = Object.keys(files).forEach((key) => {
		const file = files[key];
		const reader = new FileReader();
		reader.fileName = file.name;
		reader.onerror = (() => {
			throw Error;
		})
		reader.onabort = (() => {
			throw Error;
		})
		reader.onload = fileLoaded;
		reader.onloadend = fileLoadedEnd;
		reader.readAsText(file);
	});
}

/** -------------------------------------------------------------------------------------------
 * Called whenever a file is loaded. Used to extract the 'name', (i.e., filename minus
 * extension), and 'content' from the file. Determines whether to add the file as a single
 * snippet or as a file containing multiple snippets (i.e., an array of snippets).
 *
 * @param {any} event The event whose target object contains a 'filename' property and
 * a 'content' property.
 */
function fileLoaded(event) {
	const contentString = event.target.result;
	const fileName = event.target.fileName;
	const fileNameMinusExt = /(.+?)(\.[^.]*$|$)/.exec(fileName)[1];
	const extension = /\.[0-9a-z]+$/.exec(fileName)[0];
	if (extension === ".json") {
		loadSnippetsFromJsonFile(contentString);
	} else {
		addCurrentSnippet(fileNameMinusExt, contentString);
	}
}

/** -------------------------------------------------------------------------------------------
 * Called at the end of file loading.
 */
function fileLoadedEnd() {
	if (++count.filesProcessed >= count.filesToProcess) {
		updateCurrentSnippetsHeader();
		enableOrDisableButtons();
		showRollup();
	}
}

// Drag/Drop zone related stuff ---------------------------------------------------------------

/** -------------------------------------------------------------------------------------------
 * Adds multiple events ('change', 'click', 'drag', 'drop', etc.) to the elements composing a
 * drop zone.
 */
function addEventsToDropZone() {
	// Loads all events used by the drop zone input class.
	_docx.querySelectorAll(".drop-zone__input").forEach((elem) => {
		// Search up the DOM tree for element which matches a specified CSS selector.
		_dropZoneElement = elem.closest(".drop-zone");
		// Handles the 'click' event of the drop zone 'input' element.
		elem.addEventListener("click", () => {
			elem.value = null;
		});

		// Handles the 'change' event of the drop zone 'input' element.
		elem.addEventListener("change", (e) => {
			if (elem.files.length) {
				loadFiles(elem.files);
			}
		});

		// Handles the 'click' event of the drop zone element.
		_dropZoneElement.addEventListener("click", () => {
			elem.click();
		});

		// Handles the 'dragover' event.
		_dropZoneElement.addEventListener("dragover", (e) => {
			e.preventDefault();
			_dropZoneElement.classList.add("drop-zone--over");
		});

		// Handles both the 'dragleave' and 'dragend' events.
		["dragleave", "dragend"].forEach((type) => {
			_dropZoneElement.addEventListener(type, () => {
				_dropZoneElement.classList.remove("drop-zone--over");
			});
		});

		// Handles the 'drop' event.
		_dropZoneElement.addEventListener("drop", (e) => {
			e.preventDefault();
			if (e.dataTransfer.files.length) {
				elem.files = e.dataTransfer.files;
				loadFiles(elem.files);
			}
			_dropZoneElement.classList.remove("drop-zone--over");
		});
	});
}

/** -------------------------------------------------------------------------------------------
 * Adds a 'change' event listener to the checkbox of all snippets in [Current Snippets].
 */
function addChangeEventToAllSnippetCheckboxes() {
	const checkboxes = _docx.querySelectorAll(".snip_row input");
	checkboxes.forEach((checkbox) => {
		checkbox.addEventListener("change", addOrRemoveCustomCheckmark);
	});

}
/** -------------------------------------------------------------------------------------------
* Adds a 'change' event listener to the checkbox of a new snippet, (i.e., the 'last' snippet)
* added to [Current Snippets].
*/
function addChangeEventToNewSnippetCheckbox() {
	const checkboxes = _docx.querySelectorAll(".snip_row input");
	let lastCheckbox = checkboxes[checkboxes.length - 1];
	lastCheckbox.addEventListener("change", addOrRemoveCustomCheckmark);
}

/** -------------------------------------------------------------------------------------------
 * Adds various mouse events (such as 'mousedown', 'mouseup', 'mouseenter', 'mouseleave') to the
 * checkbox of all snippets in [Current Snippets].
 */
function addMouseEventsToAllSnippetCheckboxes() {
	const snipRows = _docx.querySelectorAll(".snip_row");
	snipRows.forEach((snipRow) => {
		snipRow.addEventListener("mousedown", processMouseDown);
		snipRow.addEventListener("mouseenter", processMouseEnter);
	});
	const snipList = _docx.querySelector("#snip_list");
	snipList.addEventListener("mouseup", processMouseUp);
	snipList.addEventListener("mouseleave", processMouseLeave);
}

/** -------------------------------------------------------------------------------------------
 * Adds a 'MouseDown' and a 'MouseEnter' event listener to the checkbox of a new snippet (i.e.,
 * snippet appended to [Current Snippets]).
 */
function addMouseEventsToNewSnippetCheckbox() {
	const snipRows = _docx.querySelectorAll(".snip_row");
	const snipRow = snipRows[snipRows.length - 1];
	snipRow.addEventListener("mousedown", processMouseDown);
	snipRow.addEventListener("mouseenter", processMouseEnter);
}

// Utility methods ----------------------------------------------------------------------------

/** -------------------------------------------------------------------------------------------
 * Returns a promise which waits the specified number of milliseconds before execution is
 * continued.
 *
 * @param {any} milliseconds The number of milliseconds to wait.
 * @returns A new Promise
 */
function wait(milliseconds) {
	return new Promise(resolve => {
		setTimeout(resolve, milliseconds);
	});
}

/** -------------------------------------------------------------------------------------------
 * Sends an XML Http Get Request to the server.
 *
 * @param {string} url The URL (Uniform Resource Locater).
 * @param {any} callback The callback function.
 * @returns
 */
function xhrGetRequest(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);
	xhr.onload = callback;
	xhr.onerror = (err) => {
		console.error(xhr.statusText);
	};
	xhr.send();
	return xhr;
}

/** -------------------------------------------------------------------------------------------
 * Converts the specified javascript value into a Javascript Object Notation (JSON) string.
 *
 * @param {any} object A javascript value, (usually an object or array), to convert.
 * @param {any} rest  A function which accepts an indefinite number of arguments as an array.
 * @returns A JSON string.
 */
function serialize(object, ...rest) {
	if (!object)
		throw Error("The serialize function requires an object argument.");
	return JSON.stringify(object, ...rest);
}

/** -------------------------------------------------------------------------------------------
 * Converts a JavaScript Object Notation (JSON) string into an object.
 *
 * @param {string} text A valid JSON string.
 * @returns An object.
 */
function deserialize(text) {
	if (typeof text !== "string" || text === "")
		throw Error("The 'deserialize' function requires a non-empty string argument.");
	return JSON.parse(text);
}

/** -------------------------------------------------------------------------------------------
 * Downloads a text file containing the specified data and with the specified name to the
 * user's 'Downloads' folder.
 *
 * @param {string} data The data to write to the file.
 * @param {string} filename The name to give the file.
 */
function download(data, filename) {
	const blob = new window.Blob([data], {
		'type': 'text/utf-8'
	})
	const link = _docx.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.setAttribute('target', '_blank')
	link.click();
	URL.revokeObjectURL(link.href);
}

/** -------------------------------------------------------------------------------------------
 * Gets a tokenized version of the current 'Date' and 'Time' useful for constructing a unique
 * filename. (For example: "_20240621_091635" )
 *
 * @returns A tokenized version of the current 'Date' and 'Time'.
 */
function getDateTimeToken() {
	let d = new Date();
	var fileName = "_" + d.getFullYear();
	let month = d.getMonth() + 1;
	fileName += "" + ((month < 10) ? "0" + month : month);
	let day = d.getDate();
	fileName += "" + ((day < 10) ? "0" + day : day);
	let hours = d.getHours();
	fileName += "_" + ((hours < 10) ? "0" + hours : hours);
	let minutes = d.getMinutes();
	fileName += "" + ((minutes < 10) ? "0" + minutes : minutes);
	let seconds = d.getSeconds();
	fileName += "" + ((seconds < 10) ? "0" + seconds : seconds);
	return fileName;
}

function tryFunction(fn) {
	console.log("Tring function: " + fn.name)
	try {
		fn();
	} catch (exception) {
		console.warn(exception.stack.replace(/:(\d+):(\d+)/g, "$& (Line $1, Column $2)"));
	}
}

/** -------------------------------------------------------------------------------------------
*  Extends the javascript string class with a method similar to 'String.Format' in C#.
*/
if (!String.prototype.format) {
	String.prototype.format = function () {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
}

/** -------------------------------------------------------------------------------------------
*  Extends the javascript array class with a 'contains' method that returns an indication as to
*  whether the array contains a (case-insensitive) string value.
*/
if (!Array.prototype.contains) {
	Array.prototype.contains = function () {
		if (typeof arguments[0] !== 'string')
			return false;
		let upperCaseNames = this.map(function (x) {
			return x.toUpperCase();
		});
		return upperCaseNames.indexOf(arguments[0].toUpperCase()) >= 0;
	};
}

/** -------------------------------------------------------------------------------------------
 * Performs a GET to the NodeJS server using a promise.
 *
 * @param {string} route The route to the server.
 * @param {function} callback The callback function.
 * @param {number} msTimeout The timeout in milliseconds before request aborts (Default is 5000).
*/
function doGet(route, callback, msTimeout) {
	// Create a new AbortController instance.
	const controller = new AbortController();
	const signal = controller.signal;
	// Make the fetch request with the signal.
	const fetchPromise = fetch(getFullRoute(route), {
		signal,
	});
	// Timeout after specified number of milliseconds.
	const timeoutId = setTimeout(() => {
		controller.abort();
		// Abort the fetch request.
		if (callback)
			callback("Server fetch request timed out.");
	}, msTimeout || 5000);
	// Handle the fetch request.
	fetchPromise.then((response) => {
		if (!response.ok) {
			throw new Error(response.statusText);
		}
		// Parse the response as JSON.
		return response.json();
	}
	).then((data) => {
		// Handle the JSON data.
		if (callback)
			callback(data);
	}
	).catch((error) => {
		//console.error(error);
	}
	).finally(() => {
		// Clear the timeout.
		clearTimeout(timeoutId);
	}
	);
	function getFullRoute(route) {
		return route.startsWith("http") ? route : DEFAULT_ROOT + (route.startsWith("/") ? route : "/" + route);
	}
}

/** -------------------------------------------------------------------------------------------
 * Shows a message dialog.
 *
 * @async
 *
 * @param {string} message The message to display in the dialog.
 * @param {[string]} buttons An array containing the names of buttons to be displayed in the 
 * dialog. 
 * Note: 
 * An asterisk appended to the name of the button indicates it is the default button.
 * @param {bool} clickOutsideToCancel Indicates clicking outside this dialog will close it
 * when true otherwise false.
 * @param {number?} secsUntilAutoClose  Indicates the number of seconds to wait until this 
 * dialog is automatically closed.  
 * 
 * @returns {Promise<string>} The dialog result ("OK", "Cancel", etc.).
 */
async function showMsg(message, buttons, clickOutsideToCancel, secsUntilAutoClose) {
	let result;
	let modalIntervalId;
	let cpos1 = 0, cpos2 = 0, cpos3 = 0, cpos4 = 0;
	return new Promise((resolve) => {

		// Always make sure to reference the '_docx' object and not 'document'!

		const modal_background = _docx.getElementById("modal_background");
		const modal_dialog = _docx.getElementById("modal_dialog");
		const modal_title_bar = _docx.getElementById("modal_title_bar");
		const modal_buttons = _docx.getElementById("modal_buttons");
		const modal_close_btn = _docx.getElementById("modal_close_btn");
		const modal_text = _docx.getElementById("modal_text");
		const secs_until_autoclose = _docx.querySelector("#time_until_autoclose");

		modal_text.innerHTML = message || "message missing";
		modal_close_btn.classList = clickOutsideToCancel ? "clickout" : "";

		// Use 'OK' button as default when none is specified.
		if (!buttons)
			buttons = ["OK"];

		// A button name with an asterisk ('*') appended to it is the 'default' button;
		// If no asterisk, the first button in the 'buttons' array is the 'default' button.
		let defaultButtonIndex = 1;
		for (let index = 0; index < buttons.length; index++) {
			const btn = String(buttons[index]);
			if (btn.endsWith("*")) {
				buttons[index] = btn.replace("*", "");
				defaultButtonIndex = index + 1;
			}
		}

		// Create the html button elements dynamically based on the specified 'buttons' array.
		let btnNum = 0;
		buttons.forEach(btn => {
			let button = document.createElement('button');
			button.textContent = btn;
			button.type = "button";
			button.classList = "snip_button modal_button";
			button.id = `button_${++btnNum}`;
			button.addEventListener("click", (event) => {
				event.stopPropagation();
				doResolve(btn);
			});
			modal_buttons.appendChild(button);
		});
		const default_button = _docx.getElementById(`button_${defaultButtonIndex}`);

		modal_background.style.display = "block";
		modal_dialog.style.display = "block";
		modal_dialog.style.top = "150px";
		modal_dialog.style.left = "200px";

		if (default_button)
			default_button.focus();

		modal_close_btn.addEventListener("click", (event) => {
			//event.stopPropagation();
			doResolve("Cancel");
			event.preventDefault();
		});

		_app_window.addEventListener("keydown", app_window_keydown);
		_app_window.addEventListener("mousedown", app_window_mousedown);
		_app_window.addEventListener("click", app_window_click);

		secs_until_autoclose.setAttribute("title", `Click here to stop this dialog from auto-closing.`);
		if (!isNaN(secsUntilAutoClose) && secsUntilAutoClose > 0) {
			let toggleClass = clickOutsideToCancel ? "clickout" : "autoclose";
			let numZeros = String(secsUntilAutoClose).match(/\d/g).length;
			secs_until_autoclose.innerHTML = getTimeToCloseMessage(secsUntilAutoClose, numZeros);
			secs_until_autoclose.addEventListener("click", time_until_autoclose_click);
			modalIntervalId = setInterval(() => {
				if (--secsUntilAutoClose <= 0) {
					doResolve("Cancel");
				}
				modal_close_btn.classList = modal_close_btn.classList == toggleClass ? "" : toggleClass;
				secs_until_autoclose.innerHTML = getTimeToCloseMessage(secsUntilAutoClose, numZeros);
			}, 1000);
		} else {
			secs_until_autoclose.innerHTML = "";
		}

		function getTimeToCloseMessage(secsUntilClose, numZeros) {
			return `Click here to stop this dialog from auto-closing in <b>${String(secsUntilClose).padStart(numZeros, '0')}</b> seconds...`;
		}

		function getFocusable(context = "_docx") {
			return Array.from(context.querySelectorAll('button, [href], input:not([type="hidden"]),'
				+ ' textarea, select, [tabindex]:not([tabindex="-1"])')).filter(function (el) {
					return !el.closest("[hidden]");
				});
		}

		// Get a list of items in this dialog which are focusable so we can control tabbing.
		let focusableItems = getFocusable(modal_dialog);

		function time_until_autoclose_click() {
			clearInterval(modalIntervalId);
			modal_close_btn.classList = clickOutsideToCancel ? "clickout" : "";
			secs_until_autoclose.innerHTML = "This dialog will no longer auto-close.";
			setTimeout(() => {
				secs_until_autoclose.innerHTML = "";
			}, 2000);
		}

		function app_window_click(e) {
			if (clickOutsideToCancel && e.target === modal_background) {
				doResolve("Cancel");
				e.preventDefault();
			}
		}

		function app_window_mousedown(e) {
			if (default_button && focusableItems.indexOf(e.target) < 0) {
				default_button.focus();
				e.preventDefault();
			}
		}

		/** ------------------------------------------------------------------------------------
		 * Handles the Esc, Tab, and Shift+Tab keydown events.
		 * 
		 * @param {any} e 
		 */
		function app_window_keydown(e) {
			if (e.keyCode === 27) { // Escape
				doResolve("Cancel");
			} else if (e.keyCode === 9) { // Tab or Shift+Tab
				const focusedItem = e.target;
				const focusedItemIndex = focusableItems.indexOf(focusedItem);
				if (e.shiftKey) {
					if (!modal_dialog.contains(e.target) || focusedItemIndex === 0) {
						focusableItems[focusableItems.length - 1].focus();
					} else {
						focusableItems[focusedItemIndex - 1].focus();
					}
				} else {
					if (!modal_dialog.contains(e.target) || focusedItemIndex === focusableItems.length - 1) {
						focusableItems[0].focus();
					} else {
						focusableItems[focusedItemIndex + 1].focus();
					}
				}
				e.preventDefault();
			}
		}

		/** ------------------------------------------------------------------------------------ 
		* Following 4 functions used for dragging the showMsg dialog.
		*/
		(function dragElement() {
			modal_title_bar.onmousedown = dragMouseDown;
		})();

		function dragMouseDown(e) {
			e.preventDefault();
			// Get the mouse cursor position at startup:
			cpos3 = e.clientX;
			cpos4 = e.clientY;
			// Call function whenever the cursor moves:
			_docx.onmousemove = elementDrag;
			_docx.onmouseup = closeDragElement;
		}

		function elementDrag(e) {
			e.preventDefault();
			// Calculate the new cursor position:
			cpos1 = cpos3 - e.clientX;
			cpos2 = cpos4 - e.clientY;
			cpos3 = e.clientX;
			cpos4 = e.clientY;
			// Set the element's new position:
			modal_dialog.style.left = (modal_dialog.offsetLeft - cpos1) + "px";
			modal_dialog.style.top = (modal_dialog.offsetTop - cpos2) + "px";
		}

		/** ------------------------------------------------------------------------------------
		 * Stops moving the dialog when the mouse button is released.
		 */
		function closeDragElement() {
			_docx.onmousemove = null;
			_docx.onmouseup = null;
		}

		/** ------------------------------------------------------------------------------------
		 * Removes the buttons when this dialog is closed.
		 */
		function removeButtons() {
			for (let index = 0; index < buttons.length; index++) {
				let elem = _docx.getElementById(`button_${index + 1}`);
				if (elem)
					elem.remove();
			};
		}

		function cleanup() {
			clearTimeout(modalIntervalId);
			removeButtons();
			modal_background.style.display = "none";
			modal_dialog.style.display = "none";
			_app_window.removeEventListener("click", app_window_click);
			_app_window.removeEventListener("mousedown", app_window_mousedown);
			_app_window.removeEventListener("keydown", app_window_keydown);
			modal_close_btn.classList = "";
		}

		/** ------------------------------------------------------------------------------------
		 * Resolves the promise after performing some cleamup tasks.
		 * 
		 * @param {any} reslt The result.
		 */
		function doResolve(reslt) {
			result = reslt;
			cleanup();
			resolve();
		}
	}
	).then(() => {
		return result;
	});
}

//#region META DATA

const HTML_META = `
    <meta http-equiv="Content-Security-Policy" content="script-src-elem https://ajax.googleapis.com" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
`;

//#endregion

const HTML_TITLE = `DevTools Snippet Manager`;

const HTML_SCRIPT = `<script></script>`;

const HTML_STYLE = `

* {
	font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
	padding: 0px;
	margin: 0px;
}

body {
	align-items: center;
	justify-content: center;
	margin: 5px;
}

#page_header {
	font-weight: bold;
	font-size: 24px;
	text-align: center;
	width: 98%;
	padding: 6px;
	background: tomato;
	color: white;
}

#drop_files {
	opacity: 0;
	width: 100%;
	height: 20vh;
	z-index: 1000;
}

.drop-zone {
	height: 200px;
	padding: 25px;
	text-align: center;
	font-weight: 500;
	font-size: 20px;
	cursor: pointer;
	background-color: white;
	border: 4px dashed #009578;
	border-radius: 10px;
	align-items: center;
	margin: 8px;
}

.drop-zone--over {
	border-style: solid;
}

.drop-zone__input {
	display: none;
}

.drop-zone__prompt {
	color:  #cccccc !important;
}

ul {
	font-size: 0.75em;
	margin-top: 4px;
}

fieldset {
	font-size: 0.85rem;
	font-weight: 300;
	margin: 8px;
	padding: 8px;
}

legend,
label {
	cursor: pointer;
}

div.first_radio {
	margin-bottom: 4px;
}

div.columnheader_div {
	font-size: 0.8em;
	margin: 0 0.5em;
	background: tomato;
	height: 2.5em;
	display: inline-flex;
	align-items: center;
	border: 1px solid green;
}

div#snippets_div {
	border: 1px solid gray;
	width: 96%;
	height: 57vh;
	overflow-y: scroll;
	margin-top: 0.4em;
	margin-left: 0.4em;
}

span.columnheader_span {
	text-align: center;
	width: 100%;
	cursor: pointer;
}

div.flex-child-element {
	background-color: #eee;
}

#snip_header {
	margin: 8px;
	-webkit-user-select: none;
	user-select: none;
}

#snip_cnt {
	font-family: monospace;
	font-size: 0.75rem;
	font-weight: 700;
	color: rgb(0, 0, 0);
	background-color: #c5cae9;
	padding: 2px 5px 2px 5px;
	border: thin #aaaaaa solid;
	border-radius: 90%;
	margin: 0px;
}

#snip_desc {
	font-weight: 600;
	text-align: center;
	font-style: italic;
}

#snip_mode {
	font-size: 0.75em;
	margin-left: 16px;
}

#snip_container {
	width: 100%;
	height: 85vh;
	background-color: #eee;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 444px;
}

#snip_list {
	font-size: 8pt;
	width: 90%;
	height: 100%;
	padding: 0 0 0 4px;
	margin-bottom: 2px;
	background-color: #fff;
	overflow-y: scroll;
}

#snip_list label {
	display: flex;
	align-items: center;
	margin: 1px 0;
	padding: 2px;
	border-radius: 5px;
	cursor: pointer;
	transition: 50ms;
}

#snip_list label:hover {
	background-color: #c5cae9;
}

#snip_save_btn{
	margin-left: 12px;
}

input.snip_input[type="checkbox"] {
	display: none;
}

label .snip_custom_box {
	width: 15px;
	height: 15px;
	background-color: #f2f2f2;
	border-radius: 0.25em;
}

label .snip_custom_box .snip_custom_chk {
	width: 1.5em;
	height: 8px;
	left: 2px;
	-webkit-transform: rotate(-45deg);
	-moz-transform: rotate(-45deg);
	-o-transform: rotate(-45deg);
	-ms-transform: rotate(-45deg);
	transform: rotate(-45deg);
	position: relative;
}

label .snip_custom_box .snip_custom_chk .snip_custom_chk_line1 {
	position: absolute;
	height: 0%;
	width: 2px;
	background-color: #1e88e5;
	border-radius: 50px;
	transition: 50ms;
}

label .active .snip_custom_chk .snip_custom_chk_line1 {
	height: 100%;
	transition: 50ms;
	transition-delay: 50ms;
}

label .snip_custom_box .snip_custom_chk .snip_custom_chk_line2 {
	position: absolute;
	height: 2px;
	width: 0%;
	bottom: 0px;
	background-color: #1e88e5;
	border-radius: 100px;
	transition: 50ms;
}

label .active .snip_custom_chk .snip_custom_chk_line2 {
	width: 100%;
	transition: 50ms;
	transition-delay: 50ms;
}

label p {
	font-size: 8pt;
	margin-left: 8px;
	-webkit-user-select: none;
	user-select: none;
}

div.button_row {
	display: flex;
	flex-direction: row;
}

div.button_row_block {
	display: float;
}

div.my_radio_div {
	margin-bottom: 0.25em;
}

label.my_radio_label span:first-of-type {
	margin-left: 0.25em;
}

.snip_button {
	margin: 4px;
	padding: 2px 4px;
	border-width: 1px;
	border-radius: 4px;
	height: 21px;
}

.snip_button:hover {
	background-color: rgb(207, 207, 207);
}

#snip_dotest_btn{
	float: right;
    margin-right: 10px;
}

button.ml8 {
	margin-left: 8px;
}

.flex-parent-element {
	display: flex;
	width: 70%;
}

.flex-child-element {
	flex: 1;
	border: 2px solid lightgray;
	margin: 10px;
	min-width: 334px;
}

.flex-child-element:first-child {
	margin-right: 10px;
}

.modal_background {
	display: none; /* Hidden by default */
	position: fixed; /* Stay in place */
	z-index: 1; /* Sit on top */
	left: 0;
	top: 0;
	width: 100%; /* Full width */
	height: 100%; /* Full height */
	padding: 10px; 
	overflow: auto; /* Enable scroll if needed */
	background-color: rgb(0, 0, 0); /* Fallback color */
	background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
}

#modal_dialog {
	display: none;
	z-index: 2; /* Sit on top */
	background-color: #fefefe;
	border: 1px solid #888;
	width: 60%;
	position: fixed;
	-webkit-user-select: none;
	user-select: none;
}

#modal_title_bar {
	background-color: lightgray;
	padding: 6px 8px 6px 20px;
	font-weight: 700;
	cursor: move;
}

#modal_text {
	margin: 20px;
	-webkit-user-select: none;
	user-select: none;
}

#modal_text p {
	line-height: 1.2rem;
	margin-bottom: 0.75rem;
}

#modal_buttons {
	margin: 10px;
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	justify-content: flex-end;
}

.modal_button {
	border-width: 1px;
	border-radius: 4px;
	margin: 4px;
	padding: 2px 4px;
	height: 23px;
	width: 75px;
}

#modal_close_btn {
	color: rgb(134, 134, 134);
	font-size: 28px;
	font-weight: bold;
	position: absolute;
	top: 0px;
	right: 10px;
}

#modal_close_btn.autoclose{
	color: black;
}

#modal_close_btn.clickout{
	color: red;
}

#modal_close_btn:hover,
#modal_close_btn:focus {
	color: black;
	text-decoration: none;
	cursor: pointer;
}

button:focus {
	border-color: #86b7fe;
	box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.25);
	outline: 0;
}

#time_until_autoclose {
	font-family: monospace;
	font-size: 0.6rem;
	color: rgb(134, 134, 134);
	float: right;
	margin-top: 14px;
	margin-right: 20px;
	cursor: pointer;
}

#time_until_autoclose:hover,
#time_until_autoclose:focus {
	color: black;
	text-decoration: none;
}

.bracket {
	font-size: 1.25em;
	font-weight: 100;
	color: #c5cae9;
}

.bracket.left {
	margin-right: -.2rem;
}

.bracket.right {
	margin-left: -.2rem;
}

.current_snippets {
	font-size: 0.9em;
	font-style: italic;
	font-weight: 600;
	padding: 2px;
}

cnt {
	font-family: monospace;
	font-weight: 700;
	font-size: 0.8rem;
	border: thin #aaaaaa solid;
	border-radius: 90%;
	color: #000;
	background-color: #c5cae9;
	margin: 0px;
	padding: 0 5px 2px 5px;
}

`;

const HTML_BODY =
	`
	<div id="page_header">
			<span>DevTools Snippet Manager</span>
	</div>
	<div class="flex-parent-element">
		<div class="flex-child-element">
			<div class="drop-zone">
				<span id="drop-zone__prompt" class="drop-zone__prompt"></span>
				<input id="drop_files" class="drop-zone__input" type="file" multiple="true" accept=".js,.json" title="." />
			</div>
			<fieldset id="add_or_replace">
				<legend id="add_or_replace_it">&nbsp;If adding a snippet that already exists:&nbsp;</legend>
				<div class="my_radio_div">
					<label id="add_it_radio" class="my_radio_label">
						<input type="radio" name="add_or_replace" value="true" checked="true" />
						<span>Add as new snippet with '_copy' appended</span>
					</label>
				</div>
				<div class="my_radio_div">
					<label id="replace_it_radio" class="my_radio_label">
						<input type="radio" name="add_or_replace" value="false" />
						<span>Replace existing snippet</span>
					</label>
				</div>
			</fieldset>
			<div>
				<div class="button_row">
					<button type="button" class="snip_button ml8" id="snip_loadbgrins_btn">Add from 'bgrins/devtools-snippets repo'</button>
				</div>
				<div class="button_row_block">
					<button type="button" class="snip_button ml8" id="snip_loadbahmutov_btn">Add from 'bahmutov/code-snippets repo'</button>
					<button type="button" class="snip_button" id="snip_dotest_btn">Perform Test…</button>
				</div>
			</div>
		</div>
		<div class="flex-child-element">
			<div id="snip_container">
				<div id="snip_header">
					<span id="snip_cnt">0</span>
					<span class="bracket left">[</span>
					<span id="snip_desc">Current Snippets</span>
					<span class="bracket right">]</span>
					<span id="snip_mode"></span>
				</div>
				<div id="snip_list"></div>
				<div class="button_row">
					<button type="button" class="snip_button" id="snip_checkall_btn">Check All</button>
					<button type="button" class="snip_button" id="snip_uncheckall_btn">Uncheck All</button>
					<button type="button" class="snip_button" id="snip_invert_btn">Invert</button>
				</div>
				<div class="button_row">
					<button type="button" class="snip_button" id="snip_remove_btn">Remove</button>
					<button type="button" class="snip_button" id="snip_sort_btn">Sort</button>
					<button type="button" class="snip_button" id="snip_reload_btn">Reload</button>
					<button type="button" class="snip_button" id="snip_save_btn">Save...</button>
				</div>
				<div class="button_row">
					<button type="button" class="snip_button" id="snip_downloadSingleJson_btn">Download single 'json' file</button>
					<button type="button" class="snip_button" id="snip_downloadMultipleJs_btn">Download multiple 'js' files</button>
				</div>
			</div>
		</div>
	</div>
	<div id="modal_background" class="modal_background">			
	</div>
	<div id="modal_dialog" role="dialog" aria-modal="true">
		<div id="modal_title_bar">
			<span>DevTools Snippet Manager</span>
			<span id="modal_close_btn">&times;</span>
		</div>
		<div id="modal_text"></div>
		<div id="modal_buttons">
			<span id="time_until_autoclose"></span>
		</div>
	</div>
`;

if (location.href.toLowerCase().includes(HTML_FILENAME.toLowerCase())) {
	openThisWindow(HTML_FILENAME);
} else if (location.href.toLowerCase().includes(state.thisSnippetName.toLowerCase())) {
	openThisWindow(state.thisSnippetName);
} else {
	openAppWindow();
}