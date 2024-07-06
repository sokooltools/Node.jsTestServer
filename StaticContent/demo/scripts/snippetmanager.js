void function () {

    let app_window;
    let docx;

    let _dropZoneElement;

    let _isSelecting = false;
    let _eventTargetInnerText;

    const isDevToolsOfDevTools = location.origin.startsWith("devtools://devtools");
    const isLocalHost = location.hostname === "localhost";

    const WIN_TITLE = "DevTools Snippet Manager";

    const EXT_BGRINS = "https://raw.githubusercontent.com/bgrins/devtools-snippets/master/snippets/";
    const EXT_BAHMUTOV = "https://raw.githubusercontent.com/bahmutov/code-snippets/master/";

    const DROP_ZONE_PROMPT = "Drop a '.json' file or multiple '.js' files here (or click here to select the files) to add to [Current Snippets]…";

    const NO_CHECKMARKS_WARNING = `To {0}, requires at least one item to be selected in [Current Snippets].`;

    const state = {
        scriptSnippets: [],
        lastIdentifier: 0,
        thisSnippet: [],
        thisSnippetName: "DevToolsSnippetManager"
    };

    /** -------------------------------------------------------------------------------------------
    * Opens a new window as app_window.
    */
    function openAppWindow() {
        //closeAppWindow();
        console.log("Opening app window...");
        let deltaW = Math.abs(window.outerWidth - window.innerWidth);
        let deltaH = Math.abs(window.outerHeight - window.innerHeight);
        let winWth = 738 + (isDevToolsOfDevTools ? 16 : 0);
        let winHgt = 526 + (isDevToolsOfDevTools ? deltaH : 0);
        let winLft = (window.screen.width - winWth) / 2;
        let winTop = (window.screen.height - winHgt) / 2;
        const windowFeatures = `popup, menubar=no, left=${winLft}, top=${winTop}, width=${winWth}, height=${winHgt}`;
        console.log(`${windowFeatures}, deltaW=${deltaW}, deltaH=${deltaH}`);
        app_window = window.open("", "", windowFeatures);
        docx = app_window.document;
        docx.head.innerHTML = META + TITLE + STYLE + SCRIPT;
        docx.body.innerHTML = HTML;
        initializePage();
    }

    /** -------------------------------------------------------------------------------------------
    * Opens this window.
    */
    function openThisWindow() {
        console.log("Opening this window...");
        app_window = window;
        docx = app_window.document;
        docx.addEventListener("DOMContentLoaded", () => {
            initializePage();
        }
        );
    }

    /** -------------------------------------------------------------------------------------------
     * Performs multiple steps needed to initialize this page.
     */
    function initializePage() {
        console.log("Initializing Page...")
        docx.querySelector("title").textContent = WIN_TITLE;
        docx.getElementById("page_header").innerHTML = WIN_TITLE;
        docx.getElementById("drop-zone__prompt").innerHTML = DROP_ZONE_PROMPT;
        loadCurrentSnippets();
        preserveThisSnippet();
        setElementTitles();
        addClickEventToButtons();
        addEventsToDropZone();
    }

    /** -------------------------------------------------------------------------------------------
     * Loads or reloads the snippets from DevTools to [Current Snippets] when this code 
     * is being run from DevTools of DevTools. In all other cases it Loads or reloads a example set 
     * of sequentially numbered snippets (such as 'example_snippet1', 'example_snippet2', etc.) to 
     * [Current Snippets].
    */
    function loadCurrentSnippets() {
        if (isDevToolsOfDevTools) {
            console.log("Loading snippets from DevTools...")
            getSnippetsFromDevTools().then((snips) => {
                state.scriptSnippets = snips;
                getLastIdentifierFromDevTools().then((id) => {
                    state.lastIdentifier = id;
                    finishLoad();
                }
                );
            }
            );
        } else if (isLocalHost) {
            console.log("Loading snippets from DevTools (via 'LocalHost')...")
            doGet("/test/snippets", (snips) => {
                if (typeof snips === "object") {
                    state.scriptSnippets = snips;
                } else {
                    console.error(snips);
                    state.scriptSnippets = [];
                }
                finishLoad();
            }
                , 1000);
        } else {
            console.log("Loading example snippets...")
            state.scriptSnippets = [];
            for (let index = 0; index < 30; index++) {
                state.scriptSnippets.push(createSnippet(`example_snippet${index}`, `snippet${index} content`));
            }
            state.lastIdentifier = `${state.scriptSnippets.length}`;
            finishLoad();
        }

        /**
         * Finishes the load.
         */
        function finishLoad() {
            renderCurrentSnippets();
            addChangeEventToAllSnippetCheckboxes();
            addMouseEventsToAllSnippetCheckboxes();
            updateCurrentSnippetsHeader();
            enableDisableButtons();
        }
    }

    function checkAllCheckboxes() {
        const checkboxes = docx.querySelectorAll(".snip_row input");
        checkboxes.forEach((checkbox, index) => {
            setTimeout(() => {
                checkbox.checked = true;
                addOrRemoveCustomCheckmark({
                    target: checkbox
                });
            }
                , index * 10);
        }
        );
    }

    function uncheckAllCheckboxes() {
        const checkboxes = docx.querySelectorAll(".snip_row input");
        checkboxes.forEach((checkbox, index) => {
            setTimeout(() => {
                checkbox.checked = false;
                addOrRemoveCustomCheckmark({
                    target: checkbox
                });
            }
                , index * 10);
        }
        );
    }

    function invertAllCheckboxes() {
        const checkboxes = docx.querySelectorAll(".snip_row input");
        checkboxes.forEach((checkbox, index) => {
            setTimeout(() => {
                checkbox.checked = !checkbox.checked;
                addOrRemoveCustomCheckmark({
                    target: checkbox
                });
            }
                , index * 10);
        }
        );
    }

    function removeSnippets() {
        let cnt = getAllCheckedSnippets().length;
        if (!cnt) {
            app_window.alert(NO_CHECKMARKS_WARNING.format("'Remove' snippets"));
            return;
        }
        const checkboxes = docx.querySelectorAll("div.snip_custom_box");
        for (let index = checkboxes.length - 1; index >= 0; index--) {
            const checkbox = checkboxes[index];
            if (checkbox.classList.contains("active")) {
                //console.debug(`Removing: "${checkbox.nextElementSibling.innerHTML}".`);
                checkbox.parentElement.remove();
                state.scriptSnippets.splice(index, 1);
            }
        }
        updateCurrentSnippetsHeader();
        enableDisableButtons();
    }

    /** -------------------------------------------------------------------------------------------
    * Saves the snippets defined in the 'state' object to Devtools following user confirmation. 
    */
    function saveSnippets() {
        let total = state.scriptSnippets.length;
        let checkedSnippets = getAllCheckedSnippets();
        let cnt = checkedSnippets.length;
        if (!cnt) {
            app_window.alert(NO_CHECKMARKS_WARNING.format("'Save' snippets to DevTools"));
            return;
        }
        let token = "";
        // Make sure to add state.thisSnippet to the array if it's missing.
        let index = checkedSnippets.findIndex(s => s.name.toLowerCase() === state.thisSnippetName.toLowerCase());
        if (index < 0) {
            checkedSnippets.push(state.thisSnippet);
            token += `\n\n(Note the currently running snippet: "${state.thisSnippetName}",`
                + ` will always be saved in 'DevTools' no matter whether it is selected in [Current Snippets] or not).`;
        }
        token += `\n\nPlease be aware that performing SAVE results in all snippets in 'DevTools' being replaced by the selected`
                      + ` snippets in [Current Snippets].`;
        let msg = (cnt < total)
            ? `Ok to save the ${cnt} selected items in [Current Snippets] to DevTools?${token}`
            : `Ok to save all the items in [Current Snippets] to DevTools?${token}`;
        if (app_window.confirm(msg)) {
            saveSelectedSnippetsToDevTools(checkedSnippets);
        }
    }

    /** -------------------------------------------------------------------------------------------
    * Downloads all the snippets into a single unified ".json" file as an array of snippets. 
    * The information for each file comes from the state.scriptSnippets object and the file 
    * is downloaded to the user's "Downloads" folder. 
    */
    function downloadSingleJsonFile() {
        let snippets = getAllCheckedSnippets();
        let cnt = snippets.length;
        if (!cnt) {
            app_window.alert(NO_CHECKMARKS_WARNING.format("'Download' a single '.json' file"));
            return;
        }
        let total = state.scriptSnippets.length;
        let fname = `edge-snippets${getDateTimeToken()}.json`;
        const json_data = serialize({
            'snippets': snippets
        }, ['snippets', 'name', 'content'], 2);
        download(json_data, fname);
        console.log(`Downloaded file "${fname}" containing ${cnt} out of the ${total} items in [Current Snippets].`);
    }

    /** -------------------------------------------------------------------------------------------
     * Downloads all the snippets as individual ".js" files. 
     * The information for each downloaded file is defined in the 'state' object and all the files
     * are downloaded to the user's "Downloads" folder. 
     */
    async function downloadMultipleJsFiles() {
        let snippets = getAllCheckedSnippets();
        let cnt = snippets.length;
        if (!cnt) {
            app_window.alert(NO_CHECKMARKS_WARNING.format("'Download' multiple '.js' files"));
            return;
        }
        let total = state.scriptSnippets.length;
        if (app_window.confirm(`Ok to download "${cnt}" of "${total}" snippets in [Current Snippets]?\r\n\r\n`
            + `(Note: To circumvent multiple security confirmations, the files will be downloaded`
            + ` with a ".txt" extension instead of a ".js" extension).`)) {
            console.clear();
            for (let i = 0; i < cnt; i++) {
                let snippet = snippets[i];
                let fname = snippet.name + '.txt';
                download(snippet.content, fname);
                console.log(`Downloaded (${i + 1} of ${cnt}) files: "${fname}".`);
                await wait(100);
            }
        }
    }

    function addSnippets_bgrins() {
        const brings_snippets = ['allcolors', 'cachebuster', 'cssreload', 'cssprettifier', 'hashlink']
        brings_snippets.forEach((snippet) => {
            xhrGetRequest(EXT_BGRINS + snippet + '/' + snippet + '.js', (request) => {
                const snippetContentString = request.target.response;
                addCurrentSnippet(snippet, snippetContentString);
            }
            );
        }
        );
    }

    function addSnippets_bahmutov() {
        const bahmutov_snippets = ['timing', 'profile-method-call', 'time-method-call']
        bahmutov_snippets.forEach((snippet) => {
            xhrGetRequest(EXT_BAHMUTOV + snippet + '.js', (request) => {
                const snippetContentString = request.target.response;
                addCurrentSnippet(snippet, snippetContentString);
            }
            );
        }
        );
    }

    /** -------------------------------------------------------------------------------------------
     * Returns an indication whether a snippet with the specified name exists in the  
     * state.scriptSnippets array.
     * 
     * @param {any} snippetName The name of the snippet to search for.
     * @returns true if a snippet with the specified name exists in the array; otherwise false.
     */
    function snippetExists(snippetName) {
        const result = state.scriptSnippets.filter((s) => s.name === snippetName)
        return (result) ? result.length > 0 : false;
    }

    function findSnippetIndex(snippetName) {
        let index = state.scriptSnippets.findIndex(s => s.name === snippetName);
        return index ? index : -1;
    }

    /** -------------------------------------------------------------------------------------------
    * Closes the app window, but only if it is open.
    */
    function closeAppWindow() {
        if (app_window && !app_window.closed) {
            console.log(`Closing '${WIN_TITLE}' window...`);
            app_window.close();
            app_window = undefined;
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
        const cont = docx.getElementById("snip_list");
        if (newSnippet) {
            renderSnippet(newSnippet);
        } else {
            cont.innerHTML = "";
            state.scriptSnippets.forEach((snippet) => {
                renderSnippet(snippet);
            }
            );
        }
        function renderSnippet(snippet) {
            const labl = docx.createElement("label");
            const inpt = docx.createElement("input");
            const chek = docx.createElement("div");
            const cust = docx.createElement("div");
            const lin1 = docx.createElement("div");
            const lin2 = docx.createElement("div");
            const p = docx.createElement("p");
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

    function updateCurrentSnippetsHeader() {
        let cnt = state.scriptSnippets.length;
        const hdr = docx.getElementById("snip_header");
        hdr.innerHTML = `${cnt} Current Snippets${(isDevToolsOfDevTools) ? "" : (isLocalHost) ? " (Read-Only)" : " (Examples)"}`;
    }

    /** -------------------------------------------------------------------------------------------
     * Adds the specified snippet to the state.scriptSnippets array as long as it does not exist;  
     * otherwise it replaces the contents of the existing snippet or adds the snippet with "_copy" 
     * appended (depending on settings in the UI).
     * 
     * @param {string} name The name of the snippet.
     * @param {string} content The content of the snippet.
     */
    function addCurrentSnippet(name, content) {
        let index = findSnippetIndex(name);
        if (index > 0) {
            let addItRadioButton = docx.querySelector('label#add_it_radio input');
            if (addItRadioButton.checked)
                addCurrentSnippet(name + "_copy", content);
            else {
                state.scriptSnippets[index].content = content;
                //console.log(`Replaced snippet: '${name}'`);
            }
        } else {
            let newSnippet = createSnippet(name, content);
            state.scriptSnippets.push(newSnippet);
            state.lastIdentifier = newSnippet.id;
            renderCurrentSnippets(newSnippet);
            addChangeEventToNewSnippetCheckbox();
            addMouseEventsToNewSnippetCheckbox();
            updateCurrentSnippetsHeader();
            //console.log(`Added snippet: '${name}'`);
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
     * Saves the selected snippets from [Current Snippets] to DevTools.
     */
    //async function saveSelectedSnippetsToDevTools(snippetArray) {
    function saveSelectedSnippetsToDevTools(snippetArray) {

        let snippets = serialize(snippetArray);
        let lastIdentifier = `"${snippetArray.length}"`;

        //console.log("\"script-snippets\":", snippets);
        //console.log("\"script-snippets-last-identifier\":", lastIdentifier);

        if (isDevToolsOfDevTools) {
            //InspectorFrontendHost.setPreference("script-snippets", snippets);
            //InspectorFrontendHost.setPreference("script-snippets-last-identifier", lastIdentifier);
        }

        //await wait(100);
        setTimeout(() => {
            app_window.alert(`To see the changes reflected in the 'Snippets' tab of 'DevTools',`
                + `you will need to close both 'DevTools' windows, then re-open to a new 'DevTools' window.\n\n`
                + `In the meantime, before you close the 'DevTools' windows, you can continue to manage the [Current Snippets]...`);
        }, 500);
    }

    /** -------------------------------------------------------------------------------------------
     * Returns a promise with an ordered array of all the snippets in DevTools, (or optionally just   
     * the single snippet having the specified name).
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
            }
            );
        }
        );
    }

    /** -------------------------------------------------------------------------------------------
     * Gets the specified array of snippet objects back in ascending order by snippet name.
     * 
     * @param {object} snippets The array of snippets.
     * @returns The snippet array sorted in ascending order by snippet name.
     */
    function sortSnippets(snippets) {
        const newSnippets = snippets.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
        }
        );
        return newSnippets;
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
            }
            );
        }
        );
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

    function debugMe() {
        debugger;
        testLoadSnippetFromPreferences();
    }

    // Snippet List  //////////////////////////////////////////////////////////////////

    function addOrRemoveCustomCheckmark(event) {
        const checkbox = event.target;
        const customCheckboxBox = checkbox.parentElement.querySelector(".snip_custom_box");
        if (checkbox.checked) {
            customCheckboxBox.classList.add("active");
        } else {
            customCheckboxBox.classList.remove("active");
        }
        enableDisableButtons();
    }

    /** -------------------------------------------------------------------------------------------
    * Enables or disables buttons based on whether there are any checkboxes in [Current Snippets] 
    * containing a checkmark.
    */
    function enableDisableButtons() {
        let isNoChecked = !isAnyCheckedSnippets();
        docx.getElementById("snip_remove_btn").disabled = isNoChecked;
        docx.getElementById("snip_save_btn").disabled = isNoChecked || isLocalHost;
        docx.getElementById("snip_downloadSingleJson_btn").disabled = isNoChecked;
        docx.getElementById("snip_downloadMultipleJs_btn").disabled = isNoChecked;
    }

    /** -------------------------------------------------------------------------------------------
    * Gets an array of all the snippet ojects containing a checkmark.
    */
    function getAllCheckedSnippets() {
        let snippets = [];
        const checkboxes = docx.querySelectorAll(".snip_row input");
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked)
                snippets.push(state.scriptSnippets[index]);
        }
        );
        return snippets;
    }

    function isAnyCheckedSnippets() {
        const checked = docx.querySelectorAll(".snip_row input:checked");
        return (checked) ? checked.length > 0 : false;
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
    * Sets the title attribute of various elements in the UI.
    */
    function setElementTitles() {
        function setTitle(elementId, text) {
            docx.getElementById(elementId).setAttribute("title", text);
        }

        setTitle("snip_checkall_btn", "Adds a checkmark to all the snippets in [Current Snippets].");
        setTitle("snip_uncheckall_btn", "Removes the checkmark from all the snippets in [Current Snippets].");
        setTitle("snip_invert_btn", "Inverts the checkmark of all the snippets in [Current Snippets]\n"
            + "(i.e., switches currently 'checked' with 'unchecked').");

        setTitle("snip_reload_btn", "Reloads all snippets in [Current Snippets] with the snippets from DevTools.");
        setTitle("snip_remove_btn", "Removes the selected items from [Current Snippets].");

        let save_msg = `Saves the selected items in [Current Snippets] to 'DevTools'.\n` 
                        + `*******\n`;
        save_msg += isDevToolsOfDevTools
            ? "Note: Since all the snippets in 'DevTools' will be REPLACED by the selected items in\n"
            + "[Current Snippets], you will be prompted to confirm this action prior to it being performed."
            : "Note: This action can only be performed when being run from a\n"
            + "'DevTools' of 'DevTools' window.";
        setTitle("snip_save_btn", save_msg);

        setTitle("snip_downloadSingleJson_btn", "Downloads the selected items in [Current Snippets] to a single unified '.json' file.");
        setTitle("snip_downloadMultipleJs_btn", "Downloads the selected items in [Current Snippets] to multiple '.js' files.");

        setTitle("enter_debug_button", "Opens this snippet's code window in debug mode.");

        setTitle("add_or_replace_it", "Indicates what should happen when adding a snippet which already exists in [Current Snippets].");
        setTitle("add_it_radio", `When hilighted, the snippet will be ADDED to [Current Snippets]\n` 
            + `as a new snippet with '_copy' appended to its name.`);
        setTitle("replace_it_radio", "When hilighted, the snippet will REPLACE the existing snippet in [Current Snippets].");

        setTitle("drop_files", "Click or drop a '.js' or '.json' file here…");

        setTitle("snip_header", `Initially shows a list of all snippets saved in 'DevTools' when this window is opened from 'DevTools' of 'DevTools'.\n`
            + `Snippets added, replaced, or removed during the current session will also be reflected in this list.\n`
            + `*******\n`
            + `Click anywhere on a row in the list to select or deselect the snippet;\n`
            + `Hold down the SHIFT key while dragging to select multiple snippets;\n`
            + `Hold down the SHIFT key + CTRL key while dragging to deselect multiple snippets.`
        );

        setTitle("external_bgrins_button", `Adds snippets to [Current Snippets] from the following repository:\n   "${EXT_BGRINS}"`);
        setTitle("external_bahmutov_button", `Adds snippets to [Current Snippets] from the following repository:\n   "${EXT_BAHMUTOV}"`);
    }

    // Drag/Drop zone related stuff ---------------------------------------------------------------

    /** -------------------------------------------------------------------------------------------
     * Loads [Current Snippets] using the array of snippet objects read from a '.json' file.
     * 
     * @param {any} contentString An array of snippet objects. 
     * (Each element of the array contains a 'name' and a 'content' property).
     */
    function loadSnippetsFromJsonFile(contentString) {
        let jsonData = deserialize(contentString);
        jsonData.snippets.forEach(snippet => {
            addCurrentSnippet(snippet.name, snippet.content);
        }
        );
    }

    function loadFiles(files) {
        const stack = Object.keys(files).forEach((key) => {
            const file = files[key];
            const reader = new FileReader();
            reader.fileName = file.name;
            reader.onerror = (() => {
                throw Error;
            }
            )
            reader.onabort = (() => {
                throw Error;
            }
            )
            reader.onload = fileLoaded;
            reader.readAsText(file);
        }
        );
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
        updateCurrentSnippetsHeader();
    }

    /** -------------------------------------------------------------------------------------------
     * Adds multiple events ('change', 'click', 'drag', 'drop', etc.) to the elements composing a 
     * drop zone.
     * 
     */
    function addEventsToDropZone() {
        // Loads all events used by the drop zone input class.
        docx.querySelectorAll(".drop-zone__input").forEach((elem) => {
            // Search up the DOM tree for element which matches a specified CSS selector.
            _dropZoneElement = elem.closest(".drop-zone");

            // Handles the 'click' event of the drop zone 'input' element.
            elem.addEventListener("click", () => {
                elem.value = null;
            }
            );

            // Handles the 'change' event of the drop zone 'input' element.
            elem.addEventListener("change", (e) => {
                if (elem.files.length) {
                    loadFiles(elem.files);
                }
            }
            );

            // Handles the 'click' event of the drop zone element.
            _dropZoneElement.addEventListener("click", () => {
                elem.click();
            }
            );

            // Handles the 'dragover' event.
            _dropZoneElement.addEventListener("dragover", (e) => {
                e.preventDefault();
                _dropZoneElement.classList.add("drop-zone--over");
            }
            );

            // Handles both the 'dragleave' and 'dragend' events.
            ["dragleave", "dragend"].forEach((type) => {
                _dropZoneElement.addEventListener(type, () => {
                    _dropZoneElement.classList.remove("drop-zone--over");
                }
                );
            }
            );

            // Handles the 'drop' event.
            _dropZoneElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length) {
                    elem.files = e.dataTransfer.files;
                    loadFiles(elem.files);
                }
                _dropZoneElement.classList.remove("drop-zone--over");
            }
            );
        }
        );
    }

    /** -------------------------------------------------------------------------------------------
     * Adds a 'change' event listener to the checkbox of all snippets in [Current Snippets].
     */
    function addChangeEventToAllSnippetCheckboxes() {
        const checkboxes = docx.querySelectorAll(".snip_row input");
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener("change", addOrRemoveCustomCheckmark);
        }
        );

    }
    /** -------------------------------------------------------------------------------------------
    * Adds a 'change' event listener to the checkbox of a new snippet, (i.e., the 'last' snippet)
    * added to [Current Snippets].
    */
    function addChangeEventToNewSnippetCheckbox() {
        const checkboxes = docx.querySelectorAll(".snip_row input");
        let lastCheckbox = checkboxes[checkboxes.length - 1];
        lastCheckbox.addEventListener("change", addOrRemoveCustomCheckmark);
    }

    /** -------------------------------------------------------------------------------------------
     * Adds various mouse events (such as 'mousedown', 'mouseup', 'mouseenter', 'mouseleave') to the 
     * checkbox of all snippets in [Current Snippets].
     */
    function addMouseEventsToAllSnippetCheckboxes() {
        const snipRows = docx.querySelectorAll(".snip_row");
        snipRows.forEach((snipRow) => {
            snipRow.addEventListener("mousedown", processMouseDown);
            snipRow.addEventListener("mouseenter", processMouseEnter);
        }
        );
        const snipList = docx.querySelector("#snip_list");
        snipList.addEventListener("mouseup", processMouseUp);
        snipList.addEventListener("mouseleave", processMouseLeave);
    }

    /** -------------------------------------------------------------------------------------------
     * Adds a 'MouseDown' and a 'MouseEnter' event listener to the checkbox of a new snippet (i.e.,  
     * the 'last' snippet) added to [Current Snippets].
     */
    function addMouseEventsToNewSnippetCheckbox() {
        const snipRows = docx.querySelectorAll(".snip_row");
        const snipRow = snipRows[snipRows.length - 1];
        snipRow.addEventListener("mousedown", processMouseDown);
        snipRow.addEventListener("mouseenter", processMouseEnter);
    }

    /** -------------------------------------------------------------------------------------------
     * Adds a 'click' event listener to all the buttons in the UI.
     */
    function addClickEventToButtons() {
        addEventToAnElement("external_bgrins_button").on("click", addSnippets_bgrins);
        addEventToAnElement("external_bahmutov_button").on("click", addSnippets_bahmutov);
        addEventToAnElement("enter_debug_button").on("click", debugMe);
        addEventToAnElement("snip_checkall_btn").on("click", checkAllCheckboxes);
        addEventToAnElement("snip_uncheckall_btn").on("click", uncheckAllCheckboxes);
        addEventToAnElement("snip_invert_btn").on("click", invertAllCheckboxes);
        addEventToAnElement("snip_reload_btn").on("click", loadCurrentSnippets);
        addEventToAnElement("snip_remove_btn").on("click", removeSnippets);
        addEventToAnElement("snip_save_btn").on("click", saveSnippets);
        addEventToAnElement("snip_downloadSingleJson_btn").on("click", downloadSingleJsonFile);
        addEventToAnElement("snip_downloadMultipleJs_btn").on("click", downloadMultipleJsFiles);
    }

    /** -------------------------------------------------------------------------------------------
     * Attaches an event (defined by its 'name' and callback 'function') to an element having the 
     * specified id.
     * 
     * @param {string} id The element identifier.
     * @returns The element having the specified id.
     */
    function addEventToAnElement(id) {
        const element = docx.getElementById(id);
        element.on = function on(eventName, fn) {
            this.addEventListener(eventName, fn);
            return this;
        }
        return element;
    }

    /** -------------------------------------------------------------------------------------------
     * Adds an event listener for closing the app_window when its ancestor closes.
    */
    // window.parent.addEventListener('unload', function () {
    //     if (app_window && !app_window.closed) {
    //         console.log(`Closing '${WIN_TITLE}' window…`);
    //         app_window.close();
    //     }
    // });

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
        }
        );
    }

    /** -------------------------------------------------------------------------------------------
     * Sends an XML Http Get Request to the server.
     * 
     * @param {string} url The URL (Uniform Resource Locater).
     * @param {any} success The callback function.
     * @returns 
     */
    function xhrGetRequest(url, success) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = success;
        xhr.onerror = function (err) {
            console.error(err);
        }
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
     * @param {string} data The data contained in the file.
     * @param {string} name The name to give the downloaded file.
     */
    function download(data, name) {
        const blob = new window.Blob([data], {
            'type': 'text/utf-8'
        })
        const link = docx.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = name;
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

    function letsTry(fn) {
        console.log("Trying: " + fn.name)
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
        }
            ;
    }

    // NodeJS methods ---------------------------------------------------------------------------

    const defaultRoot = "http://localhost:3000";

    /** -------------------------------------------------------------------------------------------
     * Performs a GET to the server.
     *
     * @param {string} route The route.
     * @param {function} callback The function callback.
     * @param {number} msTimeout The timeout in milliseconds to abort the request.
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
                callback("Fetch request timed out.");
        }
            , msTimeout || 5000);

        // Handle the fetch request.
        fetchPromise.then((response) => {
            // Check if the request was successful.
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
            // Handle any errors that occurred during the fetch.
            //console.error(error);
        }
        ).finally(() => {
            // Clear the timeout.
            clearTimeout(timeoutId);
        }
        );
        function getFullRoute(route) {
            return route.startsWith("http") ? route : defaultRoot + (route.startsWith("/") ? route : "/" + route);
        }
    }

    const META = `
    <meta http-equiv="Content-Security-Policy" content="script-src-elem https://ajax.googleapis.com">
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    `;

    const TITLE = `
    <title>DevTools Snippet Manager</title>`;

    const SCRIPT = `
    <script></script>`;

    const STYLE = `
    <style>
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
        width: 98%;
        padding: 6px;
        background: tomato;
        color: white;
        font-weight: bold;
        font-size: 24px;
        text-align: center;
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
        color: #cccccc;
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
        font-weight: 600;
        margin: 0.5em;
        margin-top: 8px;
        margin-bottom: 8px;
        text-align: center;
        -webkit-user-select: none;
        user-select: none;
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
        transition: 100ms;
    }
    
    #snip_list label:hover {
        background-color: #c5cae9;
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
        border-radius: 100px;
        transition: 100ms;
    }
    
    label .active .snip_custom_chk .snip_custom_chk_line1 {
        height: 100%;
        transition: 100ms;
        transition-delay: 100ms;
    }
    
    label .snip_custom_box .snip_custom_chk .snip_custom_chk_line2 {
        position: absolute;
        height: 2px;
        width: 0%;
        bottom: 0px;
        background-color: #1e88e5;
        border-radius: 100px;
        transition: 100ms;
    }
    
    label .active .snip_custom_chk .snip_custom_chk_line2 {
        width: 100%;
        transition: 100ms;
        transition-delay: 100ms;
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
    
    div.my_radio_div {
        margin-bottom: 0.25em;
    }
    
    label.my_radio_label span:first-of-type {
        margin-left: 0.25em;
    }
    
    button.snip_button {
        margin: 4px;
        padding: 2px 4px;
        border-width: 1px;
        border-radius: 4px;
        height: 21px;
    }
    
    button.ml8 {
        margin-left: 8px;
    }
    
    button.snip_button:hover {
        background-color: rgb(207, 207, 207);
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
    
    </style>`;

    const HTML = `<html lang="en">
        <head>
        </head>
        <body>
            <div id="page_header">
                <span>Snippet Manager</span>
            </div>
            <div class="flex-parent-element">
                <div class="flex-child-element">
                    <div class="drop-zone">
                        <span id="drop-zone__prompt" class="drop-zone__prompt"></span>
                        <input id="drop_files" class="drop-zone__input" type="file" multiple="true" accept=".js,.json" title="." />
                    </div>
                    <fieldset id="add_or_replace">
                        <legend id="add_or_replace_it">If adding a snippet that already exists:</legend>
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
                            <button type="button" class="snip_button ml8" id="external_bgrins_button">Add from 'bgrins/devtools-snippets repo'</button>
                        </div>
                        <div class="button_row">
                            <button type="button" class="snip_button ml8" id="external_bahmutov_button">Add from 'bahmutov/code-snippets repo'</button>
                            <button type="button" class="snip_button" id="enter_debug_button">Debug…</button>
                        </div>
                    </div>
                </div>
                <div class="flex-child-element">
                    <div id="snip_container">
                        <span id="snip_header">Current Snippets</span>
                        <div id="snip_list"></div>
                        <div class="button_row">
                            <button type="button" class="snip_button" id="snip_checkall_btn">Check All</button>
                            <button type="button" class="snip_button" id="snip_uncheckall_btn">Uncheck All</button>
                            <button type="button" class="snip_button" id="snip_invert_btn">Invert</button>
                        </div>
                        <div class="button_row">
                            <button type="button" class="snip_button" id="snip_reload_btn">Reload</button>
                            <button type="button" class="snip_button" id="snip_remove_btn">Remove</button>
                            <button type="button" class="snip_button" id="snip_save_btn">Save...</button>
                        </div>
                        <div class="button_row">
                            <button type="button" class="snip_button" id="snip_downloadSingleJson_btn">Download single 'json' file</button>
                            <button type="button" class="snip_button" id="snip_downloadMultipleJs_btn">Download multiple 'js' files</button>
                        </div>
                    </div>
                </div>
            </div>
        </body>
    </html>`;

    if (location.href.includes(state.thisSnippetName.toLowerCase())) {
        openThisWindow();
    } else {
        openAppWindow();
    }
    ;

}();
