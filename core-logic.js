// ui-handlers.js (v6.0.3 - Autosave & Info Panel Update)
import * as core from './core-logic.js'; // Assuming core-logic.js is in the same directory

// --- DOM ELEMENTS ---
let loadingOverlay, appSidebar, mainContentArea, hamburgerBtn, sidebarNotebooksPageBtn, sidebarSettingsBtn,
    sidebarAllNotesBtn, sidebarFavoritesBtn, sidebarTrashBtn, notebooksContentDiv, notesContentDiv,
    settingsContentDiv, trashContentDiv, notebooksPageListContainer, notebooksPageNoNotebooksMessage,
    createNotebookModal, closeCreateNotebookModalBtn, cancelNotebookCreationBtn, createNotebookForm,
    cnNotebookTitleField, cnNotebookPurposeField, cnNotebookCoverPaletteContainer, cnNotebookCoverColorDisplay,
    editNotebookModal, closeEditNotebookModalBtn_notebook, cancelNotebookEditBtn, editNotebookForm,
    editingNotebookIdField, enNotebookTitleField, enNotebookPurposeField, enNotebookCoverPaletteContainer,
    enNotebookCoverColorDisplay, editTagModal, closeEditTagModalBtn_tag, cancelEditTagBtn, editTagForm,
    editingOriginalTagNameField, editingTagIdField, etTagNameField, editTagPaletteContainer,
    etTagColorDisplay, etTagPurposeField, deleteTagBtn, confirmTagDeleteModal, closeConfirmTagDeleteModalBtn,
    tagNameToDeleteDisplay, cancelTagDeletionBtn, executeTagDeletionBtn, confirmNotebookDeleteModal,
    closeConfirmNotebookDeleteModalBtn, notebookNameToDeleteDisplay, cancelNotebookDeletionBtn,
    executeNotebookDeletionBtn, confirmNoteActionModal, confirmNoteActionTitle, confirmNoteActionMessage,
    confirmNoteActionWarning, closeConfirmNoteActionModalBtn, cancelNoteActionBtn, executeNoteActionBtn,
    confirmThemeResetModal, closeConfirmThemeResetModalBtn, cancelThemeResetBtn, executeThemeResetBtn,
    defaultHomepageSelector, themeColorInputs, paletteColorsContainer, newPaletteColorPicker,
    addPaletteColorBtn, resetThemeBtn, editPaletteBtn, paletteLimitMessage, viewModeCompactRadio,
    viewModeComfortableRadio, allNotesPageTitle, notebookHeaderDisplay, allNotesSearchContainer,
    allNotesSearchInput, notesPreviewColumnOuter, notesListScrollableArea, noNotesMessagePreviewEl,
    noteInteractionPanel, noteInteractionPanelPlaceholder, noteInteractionFormContainer,
    interactionPanelForm, noteTitleInputField_panel, noteTextInputField_panel, noteTagsContainer_panel,
    noteTagsInputField_panel, panelNotebookSelectorContainer, panelNotebookSelector,
    notebookChangeConfirmationEl, panelCreationTimeContainer, interactionPanelCreationTimeDisplayField,
    interactionPanelCreationTimeInputsContainer, interactionPanelCreationDateInputField,
    interactionPanelCreationTimeInputField_time, panelActivityContainer, interactionPanelActivityDisplayField,
    interactionPanelActivityInputField, interactionPanelCurrentEditSessionContainer,
    interactionPanelEditsMadeInputField, noteInfoPanelContainer, noteInfoTags, noteInfoTagsValue,
    noteInfoCreated, noteInfoCreatedValue, noteInfoActivity, noteInfoActivityValue,
    noteInfoEditsContainer, noteInfoEditsList, settingsMenuItems, settingsContentSections,
    settingsTagsListContainer, settingsNoTagsMessage, adminModeToggle, fabCreateNote, fabNavigateBack,
    deletedNotesListContainer, noDeletedNotesMessage, emptyTrashBtn, restoreNoteWithOptionsModal,
    closeRestoreNoteWithOptionsModalBtn, restoreNoteOptionsMessage, restoreToNewNotebookBtn,
    restoreToExistingNotebookSelector, restoreToSelectedNotebookBtn, cancelRestoreWithOptionsBtn,
    confirmEmptyTrashModal, closeConfirmEmptyTrashModalBtn, cancelEmptyTrashBtn, executeEmptyTrashBtn,
    exportNotebookSelector, exportNotebookBtn, exportStatusMessage,
    // Autosave Status Elements
    autosaveStatusContainer, autosaveStatusIcon, autosaveStatusText;

// --- UI State ---
let lastSelectedNotePreviewElement = null;
let isAdminModeEnabled = false; 
let isPaletteEditMode = false;
let currentSelectedColorForTagEdit = null; 
let currentSelectedNotebookCoverColor = null; 
let currentSelectedNotebookCoverColor_create = null;
let autosaveTimeoutId = null; 

// --- UI Helper Functions ---
function showLoadingOverlay(message = "Loading...") { if(loadingOverlay) { loadingOverlay.innerHTML = `<i class="fas fa-spinner fa-spin fa-2x mr-3"></i> ${message}`; loadingOverlay.classList.remove('hidden');} }
function hideLoadingOverlay() { if(loadingOverlay) loadingOverlay.classList.add('hidden'); }
function getTimeOfDay(date) { return date.getHours()>=5&&date.getHours()<12?"Morning":date.getHours()>=12&&date.getHours()<17?"Afternoon":date.getHours()>=17&&date.getHours()<21?"Evening":"Night"; }
function formatDateFromTimestamp(timestamp) { 
    if (!timestamp) return "N/A"; 
    const date = timestamp instanceof core.Timestamp ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp)); 
    if (isNaN(date.getTime())) return "N/A"; 
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
 function formatFullDateFromTimestamp(timestamp) { 
    if (!timestamp) return "N/A";
    const date = timestamp instanceof core.Timestamp ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp));
    if (isNaN(date.getTime())) return "N/A";
    const t=date.toLocaleDateString(undefined,{month:"long"}),e=date.getDate(),o=date.getFullYear(),n=date.toLocaleDateString(undefined,{weekday:"long"}),a=getTimeOfDay(date).toLowerCase();let i=date.getHours();const r=i>=12?"PM":"AM";return i%=12,i||(i=12),`${t} ${e},${o} ${n} ${a} at ${i}:${date.getMinutes().toString().padStart(2,"0")} ${r}`
}
function getTextColorForBackground(hexColor) { if (!hexColor) return '#000000'; const r = parseInt(hexColor.slice(1, 3), 16); const g = parseInt(hexColor.slice(3, 5), 16); const b = parseInt(hexColor.slice(5, 7), 16); const luminance = (0.299 * r + 0.587 * g + 0.114 * b); return luminance > 128 ? '#000000' : '#FFFFFF'; }
function shadeColor(color, percent) { let R = parseInt(color.substring(1,3),16); let G = parseInt(color.substring(3,5),16); let B = parseInt(color.substring(5,7),16); R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100); R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255; R = Math.round(R); G = Math.round(G); B = Math.round(B); return "#"+(R.toString(16).padStart(2,'0'))+(G.toString(16).padStart(2,'0'))+(B.toString(16).padStart(2,'0')); }
function sanitizeFilename(filename) {
    if (!filename) return "untitled_export";
    return filename.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '').replace(/_+/g, '_');
}

// --- Autosave Status UI Function ---
function updateAutosaveStatusUI(status, message = "") {
    if (!autosaveStatusContainer || !autosaveStatusIcon || !autosaveStatusText) return;

    autosaveStatusContainer.style.display = 'flex';
    autosaveStatusIcon.className = 'fas mr-2'; 
    autosaveStatusIcon.classList.remove('fa-spin-custom', 'text-green-500', 'text-gray-500', 'text-yellow-500', 'text-red-500', 'text-blue-500');
    autosaveStatusText.textContent = message || status.charAt(0).toUpperCase() + status.slice(1);

    if (autosaveTimeoutId) clearTimeout(autosaveTimeoutId);

    switch (status) {
        case 'saving':
            autosaveStatusIcon.classList.add('fa-save', 'fa-spin-custom', 'text-blue-500');
            autosaveStatusText.textContent = message || "Saving...";
            autosaveStatusText.className = 'text-blue-500';
            break;
        case 'saved':
            autosaveStatusIcon.classList.add('fa-check-circle', 'text-green-500');
            autosaveStatusText.textContent = message || "Saved";
            autosaveStatusText.className = 'text-green-500';
            autosaveTimeoutId = setTimeout(() => {
                if (autosaveStatusText.textContent === "Saved" || autosaveStatusText.textContent === "Loaded" || autosaveStatusText.textContent === "No changes") { 
                    autosaveStatusContainer.style.display = 'none';
                }
            }, 2000); 
            break;
        case 'unsaved':
            autosaveStatusIcon.classList.add('fa-exclamation-circle', 'text-yellow-600');
            autosaveStatusText.textContent = message || "Unsaved changes";
            autosaveStatusText.className = 'text-yellow-600';
            break;
        case 'error':
            autosaveStatusIcon.classList.add('fa-times-circle', 'text-red-500');
            autosaveStatusText.textContent = message || "Error saving";
            autosaveStatusText.className = 'text-red-500';
            break;
        case 'initial': // For when a note is first loaded or new panel is shown
             autosaveStatusContainer.style.display = 'none';
            break;
        default:
            autosaveStatusContainer.style.display = 'none';
            break;
    }
}

// --- UI Rendering and Manipulation Functions ---
// (Most of these functions remain the same as v6.0.1, ensure DOM element checks are robust)
function applyCurrentViewMode() {
    document.body.classList.remove('view-mode-compact', 'view-mode-comfortable');
    document.body.classList.add(`view-mode-${core.themeSettings.viewMode}`);
    if (notesContentDiv && notesContentDiv.classList.contains('main-view-content-active')) {
        if (core.themeSettings.viewMode === 'comfortable') { /* Handled by switchToMainView */ } 
        else { 
            notesContentDiv.classList.remove('showing-grid', 'showing-editor');
            if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'flex';
            if(noteInteractionPanel) noteInteractionPanel.style.display = 'flex'; 
        }
    }
}

function switchToMainView(viewName, context = null) { 
    if(notebooksContentDiv) notebooksContentDiv.classList.remove("main-view-content-active");
    if(notesContentDiv) notesContentDiv.classList.remove("main-view-content-active");
    if(settingsContentDiv) settingsContentDiv.classList.remove("main-view-content-active");
    if(trashContentDiv) trashContentDiv.classList.remove("main-view-content-active");
    let targetViewElement = null;
    if (viewName === 'notebooks' && notebooksContentDiv) targetViewElement = notebooksContentDiv;
    else if ((viewName === 'notes' || viewName === 'favorites') && notesContentDiv) targetViewElement = notesContentDiv; 
    else if (viewName === 'settings' && settingsContentDiv) targetViewElement = settingsContentDiv;
    else if (viewName === 'trash' && trashContentDiv) targetViewElement = trashContentDiv;
    if (targetViewElement) targetViewElement.classList.add("main-view-content-active");
    else if(notebooksContentDiv) notebooksContentDiv.classList.add("main-view-content-active"); 
    applyCurrentViewMode(); 
    if (allNotesSearchContainer) {
        if ((viewName === 'notes' || viewName === 'favorites') && !core.currentlyViewedNotebookId) allNotesSearchContainer.style.display = 'block';
        else { allNotesSearchContainer.style.display = 'none'; if (allNotesSearchInput) allNotesSearchInput.value = ''; core.setCurrentSearchTerm(''); }
    }
    if (autosaveStatusContainer) autosaveStatusContainer.style.display = 'none';
    if (viewName === 'notes') {
        if (core.themeSettings.viewMode === 'comfortable') {
            if (context === 'openNote' || context === 'newNoteComfortable') {
                notesContentDiv.classList.add('showing-editor'); notesContentDiv.classList.remove('showing-grid');
                if(noteInteractionPanel) noteInteractionPanel.style.display = 'flex'; 
                if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'none'; 
                if(allNotesSearchContainer) allNotesSearchContainer.style.display = 'none'; 
                if(fabCreateNote) fabCreateNote.classList.add('hidden');
                if(fabNavigateBack) fabNavigateBack.classList.remove('hidden');
            } else { 
                notesContentDiv.classList.add('showing-grid'); notesContentDiv.classList.remove('showing-editor');
                if(noteInteractionPanel) noteInteractionPanel.style.display = 'none'; 
                if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'flex'; 
                if(allNotesSearchContainer && !core.currentlyViewedNotebookId) allNotesSearchContainer.style.display = 'block'; 
                if(fabCreateNote) fabCreateNote.classList.remove('hidden');
                if (core.currentlyViewedNotebookId || core.currentFilterTag || core.isFavoritesViewActive) { if (fabNavigateBack) fabNavigateBack.classList.remove('hidden'); } 
                else { if (fabNavigateBack) fabNavigateBack.classList.add('hidden'); }
            }
        } else { 
            notesContentDiv.classList.remove('showing-grid', 'showing-editor');
            if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'flex'; 
            if(noteInteractionPanel) noteInteractionPanel.style.display = 'flex'; 
            if(allNotesSearchContainer && !core.currentlyViewedNotebookId) allNotesSearchContainer.style.display = 'block';
            if (!core.currentlyViewedNotebookId && !core.currentFilterTag && !core.isFavoritesViewActive) { if (fabNavigateBack) fabNavigateBack.classList.add('hidden'); } 
            else { if (fabNavigateBack) fabNavigateBack.classList.remove('hidden'); }
        }
    } else if (viewName === 'notebooks' || viewName === 'settings' || viewName === 'trash') {
        if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        if (allNotesSearchContainer) allNotesSearchContainer.style.display = 'none';
        if (allNotesSearchInput) allNotesSearchInput.value = ''; core.setCurrentSearchTerm('');
    }
    if (viewName === 'settings' && !document.querySelector('.settings-menu-item-active')) switchToSettingsSection("admin"); 
    if (viewName === 'notebooks') renderNotebooksOnPage(); 
    if (viewName === 'trash') { renderDeletedNotesList(); if(fabCreateNote) fabCreateNote.classList.add('hidden'); } 
    else {
        if(fabCreateNote && !(notesContentDiv?.classList.contains('showing-editor') && core.themeSettings.viewMode === 'comfortable')) { if(fabCreateNote) fabCreateNote.classList.remove('hidden'); } 
        else if (fabCreateNote) { fabCreateNote.classList.add('hidden'); }
    }
    if ((viewName === 'notes' || viewName === 'favorites')) renderAllNotesPreviews();
}

function renderNotebooksOnPage() { /* ... same as v6.0.1 ... */ 
    if (!notebooksPageListContainer || !notebooksPageNoNotebooksMessage) return;
    notebooksPageListContainer.innerHTML = ""; 
    const sortedNotebooks = [...core.localNotebooksCache].sort((a,b) => a.title.localeCompare(b.title));
    if (sortedNotebooks.length === 0) notebooksPageNoNotebooksMessage.style.display = "block";
    else notebooksPageNoNotebooksMessage.style.display = "none";
    sortedNotebooks.forEach(notebook => {
        const card = document.createElement('div'); card.className = 'notebook-page-card';
        card.style.backgroundColor = notebook.coverColor || 'var(--default-notebook-cover-bg)'; card.dataset.notebookId = notebook.id; 
        card.innerHTML = `<div class="notebook-page-card-accent-bar" style="background-color: ${shadeColor(notebook.coverColor || '#cccccc', -20)};"></div><div class="notebook-page-card-title-container"><h3 class="notebook-page-card-title">${notebook.title}</h3></div><div class="notebook-page-card-spacer"></div> <div class="notebook-page-card-icons"><span class="notebook-page-card-icon edit-notebook-icon-btn" title="Edit Notebook"><i class="fas fa-pencil-alt"></i></span><span class="notebook-page-card-icon delete-notebook-icon-btn" title="Delete Notebook"><i class="fas fa-trash-alt"></i></span></div>`;
        card.addEventListener('click', (e) => {
            if (e.target.closest('.notebook-page-card-icon')) return;
            core.setCurrentlyViewedNotebookId(notebook.id); core.setIsFavoritesViewActive(false); core.setCurrentFilterTag(null);
            clearInteractionPanelUI(true); switchToMainView('notes'); 
            if (core.themeSettings.viewMode === 'comfortable') { notesContentDiv.classList.add('showing-grid'); notesContentDiv.classList.remove('showing-editor'); if(noteInteractionPanel) noteInteractionPanel.style.display = 'none'; if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'flex'; if(fabCreateNote) fabCreateNote.classList.remove('hidden'); }
            if (fabNavigateBack) fabNavigateBack.classList.remove('hidden'); 
            displayNotebookHeaderUI(notebook.id); core.setupNotesListenerAndLoadInitialBatch(); 
        });
        card.querySelector('.edit-notebook-icon-btn').addEventListener('click', (e) => { e.stopPropagation(); openEditNotebookModal(notebook.id); });
        card.querySelector('.delete-notebook-icon-btn').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteNotebook(notebook.id); });
        notebooksPageListContainer.appendChild(card);
    });
    const createCard = document.createElement('div'); createCard.className = 'create-notebook-card';
    createCard.innerHTML = `<i class="fas fa-plus create-notebook-card-icon"></i><span class="create-notebook-card-text">Create Notebook</span>`;
    createCard.addEventListener('click', () => { if(createNotebookModal) { openCreateNotebookModal(); createNotebookModal.style.display = 'flex'; }});
    notebooksPageListContainer.appendChild(createCard); 
}

function applyThemeSettingsUI() { /* ... same as v6.0.1 ... */ 
    const root = document.documentElement;
    root.style.setProperty('--theme-app-default-bg', core.themeSettings.appDefaultBackgroundColor);
    root.style.setProperty('--theme-bg-sidebar', core.themeSettings.themeSidebarBg);
    root.style.setProperty('--theme-bg-sidebar-hover', shadeColor(core.themeSettings.themeSidebarBg, -20)); 
    root.style.setProperty('--theme-bg-button-primary', core.themeSettings.themeButtonPrimary);
    root.style.setProperty('--theme-bg-button-primary-hover', shadeColor(core.themeSettings.themeButtonPrimary, -10)); 
    root.style.setProperty('--theme-border-accent', core.themeSettings.themeBorderAccent);
    root.style.setProperty('--theme-text-on-dark', getTextColorForBackground(core.themeSettings.themeSidebarBg)); 
    if(addPaletteColorBtn) addPaletteColorBtn.style.color = getTextColorForBackground(core.themeSettings.themeButtonPrimary);
    if(resetThemeBtn) resetThemeBtn.style.color = getTextColorForBackground(core.themeSettings.themeButtonPrimary);
    if(editPaletteBtn) editPaletteBtn.style.color = getTextColorForBackground(core.themeSettings.themeButtonPrimary);
    if(exportNotebookBtn) exportNotebookBtn.style.color = getTextColorForBackground(core.themeSettings.themeButtonPrimary);
    document.getElementById('themeAppDefaultBgColorPicker').value = core.themeSettings.appDefaultBackgroundColor;
    document.getElementById('themeSidebarBgColorPicker').value = core.themeSettings.themeSidebarBg;
    document.getElementById('themeButtonPrimaryColorPicker').value = core.themeSettings.themeButtonPrimary;
    document.getElementById('themeBorderAccentColorPicker').value = core.themeSettings.themeBorderAccent;
    if(defaultHomepageSelector) defaultHomepageSelector.value = core.themeSettings.defaultHomepage; 
    applyCurrentViewMode(); renderTagsInSettings(); renderNotebooksOnPage(); renderDeletedNotesList();
}
function updateViewModeRadiosUI(){ /* ... same as v6.0.1 ... */ 
    if (viewModeCompactRadio) viewModeCompactRadio.checked = core.themeSettings.viewMode === 'compact';
    if (viewModeComfortableRadio) viewModeComfortableRadio.checked = core.themeSettings.viewMode === 'comfortable';
}
function renderPaletteColorsUI() { /* ... same as v6.0.1 ... */ 
    if (!paletteColorsContainer) return; paletteColorsContainer.innerHTML = ''; 
    core.paletteColors.forEach((color, index) => { 
        const swatchWrapper = document.createElement('div'); swatchWrapper.className = 'palette-color-swatch'; 
        swatchWrapper.style.backgroundColor = color; swatchWrapper.title = `Use ${color}`; 
        swatchWrapper.addEventListener('click', () => { 
            if (editTagModal.style.display === 'flex' && etTagColorDisplay) { 
                currentSelectedColorForTagEdit = color; etTagColorDisplay.value = color; 
                etTagColorDisplay.style.backgroundColor = color; etTagColorDisplay.style.color = getTextColorForBackground(color); 
                editTagPaletteContainer.querySelectorAll('.palette-color-swatch').forEach(s => s.classList.remove('selected-for-tag-edit')); 
                const correspondingSwatch = Array.from(editTagPaletteContainer.querySelectorAll('.palette-color-swatch')).find(s => s.dataset.colorValue === color); 
                if(correspondingSwatch) correspondingSwatch.classList.add('selected-for-tag-edit'); 
            } else if (newPaletteColorPicker) newPaletteColorPicker.value = color; 
        }); 
        const initialPaletteColors = ["#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#fde047", "#facc15", "#eab308", "#f3f4f6"]; 
        if (isPaletteEditMode && !initialPaletteColors.includes(color)) { 
            const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '&times;'; deleteBtn.className = 'delete-palette-color-btn'; deleteBtn.title = `Remove ${color}`; 
            deleteBtn.onclick = async (e) => { 
                e.stopPropagation(); const originalColor = core.paletteColors[index]; core.paletteColors.splice(index, 1); 
                try { await core.saveAppSettings({ paletteColors: core.paletteColors }); renderPaletteColorsUI(); updatePaletteLimitMessageUI(); } 
                catch (err) { core.paletteColors.splice(index, 0, originalColor); renderPaletteColorsUI(); updatePaletteLimitMessageUI(); } 
            }; 
            swatchWrapper.appendChild(deleteBtn); 
        } 
        paletteColorsContainer.appendChild(swatchWrapper); 
    }); 
    updatePaletteLimitMessageUI();
}
function updatePaletteLimitMessageUI() { /* ... same as v6.0.1 ... */ 
    if (paletteLimitMessage) { const limit = core.PALETTE_BASE_LIMIT + core.localNotebooksCache.length; paletteLimitMessage.textContent = `Palette colors: ${core.paletteColors.length} / ${limit}`; }
}
function switchToSettingsSection(sectionName) { /* ... same as v6.0.1 ... */ 
    settingsMenuItems.forEach(t=>{t.classList.remove("settings-menu-item-active"),t.dataset.settingSection===sectionName&&t.classList.add("settings-menu-item-active")}); 
    settingsContentSections.forEach(t=>{t&&t.style&&(t.classList.remove("settings-content-section-active"),t.style.display="none",t.id===sectionName+"-settings-section"&&(t.classList.add("settings-content-section-active"),t.style.display="block"))}); 
    if (sectionName === 'tags') renderTagsInSettings(); 
    if (sectionName === 'appearance') { 
        document.getElementById('themeAppDefaultBgColorPicker').value = core.themeSettings.appDefaultBackgroundColor; 
        document.getElementById('themeSidebarBgColorPicker').value = core.themeSettings.themeSidebarBg; 
        document.getElementById('themeButtonPrimaryColorPicker').value = core.themeSettings.themeButtonPrimary; 
        document.getElementById('themeBorderAccentColorPicker').value = core.themeSettings.themeBorderAccent; 
        if(defaultHomepageSelector) defaultHomepageSelector.value = core.themeSettings.defaultHomepage; 
        if(viewModeCompactRadio) viewModeCompactRadio.checked = core.themeSettings.viewMode === 'compact';
        if(viewModeComfortableRadio) viewModeComfortableRadio.checked = core.themeSettings.viewMode === 'comfortable';
        renderPaletteColorsUI(); 
    }
    if (sectionName === 'export') populateExportNotebookSelectorUI();
}
function openCreateNotebookModal() { /* ... same as v6.0.1 ... */ 
    currentSelectedNotebookCoverColor_create = null; 
    if (cnNotebookCoverPaletteContainer) {
        cnNotebookCoverPaletteContainer.innerHTML = ''; 
        core.paletteColors.forEach(color => {
            const swatch = document.createElement('div'); swatch.className = 'palette-color-swatch'; swatch.style.backgroundColor = color; swatch.dataset.colorValue = color;
            swatch.addEventListener('click', () => {
                currentSelectedNotebookCoverColor_create = color;
                if(cnNotebookCoverColorDisplay) { cnNotebookCoverColorDisplay.value = color; cnNotebookCoverColorDisplay.style.backgroundColor = color; cnNotebookCoverColorDisplay.style.color = getTextColorForBackground(color); }
                cnNotebookCoverPaletteContainer.querySelectorAll('.palette-color-swatch').forEach(s => s.classList.remove('selected-for-notebook-cover')); swatch.classList.add('selected-for-notebook-cover');
            });
            cnNotebookCoverPaletteContainer.appendChild(swatch);
        });
    }
    if(cnNotebookCoverColorDisplay) { cnNotebookCoverColorDisplay.value = "Default: First palette color"; cnNotebookCoverColorDisplay.style.backgroundColor = "transparent"; cnNotebookCoverColorDisplay.style.color = ""; }
    if(createNotebookForm) createNotebookForm.reset(); 
}
function openEditNotebookModal(notebookId) { /* ... same as v6.0.1 ... */ 
    const notebook = core.localNotebooksCache.find(nb => nb.id === notebookId); if (!notebook) return;
    editingNotebookIdField.value = notebook.id; enNotebookTitleField.value = notebook.title; enNotebookPurposeField.value = notebook.purpose || '';
    currentSelectedNotebookCoverColor = notebook.coverColor || null; 
    if (enNotebookCoverPaletteContainer) {
        enNotebookCoverPaletteContainer.innerHTML = ''; 
        core.paletteColors.forEach(color => {
            const swatch = document.createElement('div'); swatch.className = 'palette-color-swatch'; swatch.style.backgroundColor = color; swatch.dataset.colorValue = color;
            if (color === currentSelectedNotebookCoverColor) swatch.classList.add('selected-for-notebook-cover');
            swatch.addEventListener('click', () => {
                currentSelectedNotebookCoverColor = color;
                if(enNotebookCoverColorDisplay) { enNotebookCoverColorDisplay.value = color; enNotebookCoverColorDisplay.style.backgroundColor = color; enNotebookCoverColorDisplay.style.color = getTextColorForBackground(color); }
                enNotebookCoverPaletteContainer.querySelectorAll('.palette-color-swatch').forEach(s => s.classList.remove('selected-for-notebook-cover')); swatch.classList.add('selected-for-notebook-cover');
            });
            enNotebookCoverPaletteContainer.appendChild(swatch);
        });
    }
    if(enNotebookCoverColorDisplay) {
        if (currentSelectedNotebookCoverColor) { enNotebookCoverColorDisplay.value = currentSelectedNotebookCoverColor; enNotebookCoverColorDisplay.style.backgroundColor = currentSelectedNotebookCoverColor; enNotebookCoverColorDisplay.style.color = getTextColorForBackground(currentSelectedNotebookCoverColor); } 
        else { enNotebookCoverColorDisplay.value = "No color selected"; enNotebookCoverColorDisplay.style.backgroundColor = "transparent"; enNotebookCoverColorDisplay.style.color = ""; }
    }
    if(editNotebookModal) editNotebookModal.style.display = 'flex'; enNotebookTitleField.focus();
}
function handleDeleteNotebook(notebookId) {  /* ... same as v6.0.1 ... */ 
    if (!notebookId) { alert("Cannot delete notebook: ID missing."); return; } 
    const notebookToDelete = core.localNotebooksCache.find(nb => nb.id === notebookId); 
    if (!notebookToDelete) { alert(`Error: Notebook to delete (ID: ${notebookId}) not found.`); return; } 
    core.setNotebookToDeleteGlobally({id: notebookId, name: notebookToDelete.title });
    if (notebookNameToDeleteDisplay) notebookNameToDeleteDisplay.textContent = notebookToDelete.title; 
    if (confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'flex'; 
}
function openConfirmNoteActionModal(type, noteId, notebookId, noteTitle, isDeletedNote = false) { /* ... same as v6.0.1 ... */ 
    core.setNoteActionContext({ type, id: noteId, notebookId, title: noteTitle || "(Untitled Note)", isDeletedNote });
    if (!confirmNoteActionModal || !confirmNoteActionTitle || !confirmNoteActionMessage || !confirmNoteActionWarning || !executeNoteActionBtn) return;
    if (type === 'deletePermanently') { 
        confirmNoteActionTitle.textContent = "Delete Note Permanently?"; confirmNoteActionMessage.textContent = `Are you sure you want to permanently delete the note "${core.noteActionContext.title}"?`;
        confirmNoteActionWarning.textContent = "This action cannot be undone."; executeNoteActionBtn.textContent = "Delete Permanently";
        executeNoteActionBtn.className = "px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm";
        confirmNoteActionModal.style.display = 'flex';
    }
}
function closeConfirmNoteActionModal() { /* ... same as v6.0.1 ... */ 
    if (confirmNoteActionModal) confirmNoteActionModal.style.display = 'none';
    core.setNoteActionContext({ type: null, id: null, notebookId: null, title: null, isDeletedNote: false });
}
function displayNotebookHeaderUI(notebookId) {  /* ... same as v6.0.1 ... */ 
    const notebook = core.localNotebooksCache.find(nb => nb.id === notebookId); 
    if (notebook && notebookHeaderDisplay) { 
        notebookHeaderDisplay.innerHTML = `<h3 class="text-lg font-semibold" style="color: var(--theme-bg-sidebar);">${notebook.title}</h3><p class="text-sm text-gray-600 mt-1">${notebook.purpose || 'No specific purpose defined.'}</p><div class="text-xs text-gray-500 mt-2"><span>${notebook.notesCount || 0} note(s)</span> | <span>Created: ${formatFullDateFromTimestamp(notebook.createdAt)}</span></div>`; 
        notebookHeaderDisplay.style.display = 'block'; 
    } else if (notebookHeaderDisplay) { 
        notebookHeaderDisplay.style.display = 'none'; 
    } 
}
function renderAllNotesPreviews() { /* ... same as v6.0.1 ... */ 
    if(!notesListScrollableArea || !noNotesMessagePreviewEl || !allNotesPageTitle) return;
    const isCurrentlyShowingGrid = core.themeSettings.viewMode === 'comfortable' && notesContentDiv.classList.contains('showing-grid');
    const isCurrentlyShowingEditorComfortable = core.themeSettings.viewMode === 'comfortable' && notesContentDiv.classList.contains('showing-editor');
    if (isCurrentlyShowingEditorComfortable && !core.currentlyViewedNotebookId) { notesListScrollableArea.innerHTML = ''; noNotesMessagePreviewEl.style.display = 'none'; return; }
    notesListScrollableArea.innerHTML = ""; let filteredNotesForDisplay = [...core.localNotesCache];
    if (core.currentSearchTerm) filteredNotesForDisplay = core.localNotesCache.filter(note => (note.title && note.title.toLowerCase().includes(core.currentSearchTerm)) || (note.text && note.text.toLowerCase().includes(core.currentSearchTerm)));
    if (core.currentlyViewedNotebookId) { /* ... set title ... */ } else if (core.currentFilterTag) { /* ... set title ... */ } else if (core.isFavoritesViewActive) { /* ... set title ... */ } else { /* ... set title ... */ }
    if (filteredNotesForDisplay.length === 0) { /* ... set no notes message ... */ return; } 
    noNotesMessagePreviewEl.style.display = 'none'; 
    filteredNotesForDisplay.sort((a,b) => (b.modifiedAt?.toMillis?.() || new Date(b.modifiedAt).getTime()) - (a.modifiedAt?.toMillis?.() || new Date(a.modifiedAt).getTime()));
    filteredNotesForDisplay.forEach(note => { /* ... create and append previewEl ... */ 
        const notebook = core.localNotebooksCache.find(nb => nb.id === note.notebookId); 
        const previewEl = document.createElement('div'); previewEl.className = 'note-preview-card'; 
        if (isCurrentlyShowingGrid) previewEl.classList.add('grid-card-style'); else previewEl.classList.remove('grid-card-style');
        const isCurrentlyTheInteractingNote = core.currentInteractingNoteIdInPanel === note.id && !core.isNewNoteSessionInPanel ; 
        let noteBgColor = core.themeSettings.appDefaultBackgroundColor; 
        if (note.tags && note.tags.length > 0) { const firstTagObject = core.localTagsCache.find(t => t.name === note.tags[0].name.toLowerCase()); if (firstTagObject && firstTagObject.color) noteBgColor = firstTagObject.color; } 
        previewEl.style.backgroundColor = ''; const h4El = document.createElement('h4'); h4El.className = "font-semibold text-md"; 
        const pContentEl = document.createElement('p'); pContentEl.className = "text-xs mt-1 note-content-preview"; 
        const pNotebookEl = document.createElement('p'); pNotebookEl.className = "text-xs mt-1 note-preview-notebook-name"; 
        const noteActionsDiv = document.createElement('div'); noteActionsDiv.className = 'note-actions-container';
        const deleteDiv = document.createElement('div'); deleteDiv.className = 'delete-note-icon';
        const deleteIcon = document.createElement('i'); deleteIcon.className = 'fas fa-trash-alt';
        const favoriteDiv = document.createElement('div'); favoriteDiv.className = `favorite-star ${note.isFavorite ? 'is-favorite' : ''}`; 
        const favoriteIcon = document.createElement('i'); favoriteIcon.className = note.isFavorite ? 'fas fa-star' : 'far fa-star';
        if (isCurrentlyTheInteractingNote && core.themeSettings.viewMode === 'compact') { /* ... style selected ... */ } else { /* ... style unselected ... */ } 
        previewEl.setAttribute('data-note-id', note.id); 
        let previewHTML = '<em>No content</em>'; 
        if (note.text && note.text.trim() !== "") { /* ... generate previewHTML ... */ } 
        h4El.textContent = note.title || '(Untitled Note)'; pContentEl.innerHTML = previewHTML; pNotebookEl.textContent = notebook ? notebook.title : 'Unknown'; 
        deleteDiv.appendChild(deleteIcon); favoriteDiv.appendChild(favoriteIcon); 
        noteActionsDiv.appendChild(deleteDiv); noteActionsDiv.appendChild(favoriteDiv); 
        previewEl.appendChild(h4El); previewEl.appendChild(pContentEl); previewEl.appendChild(pNotebookEl); previewEl.appendChild(noteActionsDiv); 
        previewEl.addEventListener('click', (e) => { /* ... handle click ... */ }); 
        favoriteDiv.addEventListener('click', async (e) => { /* ... handle favorite toggle ... */ }); 
        deleteDiv.addEventListener('click', (e) => { e.stopPropagation(); core.moveNoteToTrashImmediately(note.id, note.notebookId, note.title); });
        notesListScrollableArea.appendChild(previewEl); 
    }); 
    if (core.noMoreNotesToLoad && filteredNotesForDisplay.length > 0 && !core.currentSearchTerm) { /* ... add end of notes message ... */ }
}
function renderTagsInSettings() { /* ... same as v6.0.1, ensure core.localNotesCache used for count ... */ 
    if(!settingsTagsListContainer || !settingsNoTagsMessage) return; settingsTagsListContainer.innerHTML = ''; 
    if (core.localTagsCache.length === 0) { settingsNoTagsMessage.style.display = 'block'; return; } 
    settingsNoTagsMessage.style.display = 'none'; 
    core.localTagsCache.forEach(tagObj => { 
        const tagCard = document.createElement('div'); tagCard.className = 'tag-item-display'; tagCard.dataset.tagName = tagObj.name; 
        const tagColor = tagObj.color || core.DEFAULT_TAG_COLOR; const textColor = getTextColorForBackground(tagColor); tagCard.style.backgroundColor = tagColor; 
        let notesWithThisTagCount = 0; if (core.localNotesCache) notesWithThisTagCount = core.localNotesCache.filter(note => note.tags && note.tags.some(t => t.name === tagObj.name)).length;
        tagCard.innerHTML = `<div class="tag-item-header"><h4 class="tag-name" style="color: ${textColor};">${tagObj.name}</h4><span class="tag-count" style="color: ${textColor};">(${notesWithThisTagCount} notes)</span></div><p class="tag-purpose" style="color: ${textColor};">${tagObj.purpose || '<em>No purpose.</em>'}</p><div class="tag-item-actions-icons"><button class="tag-action-icon edit-tag-icon-btn" data-tag-id="${tagObj.id}" title="Edit Tag"><i class="fas fa-pencil-alt"></i></button><button class="tag-action-icon delete-tag-icon-btn" data-tag-id="${tagObj.id}" data-tag-name="${tagObj.name}" title="Delete Tag"><i class="fas fa-trash-alt"></i></button></div>`; 
        tagCard.addEventListener('click', (e) => { /* ... handle click ... */ });
        tagCard.querySelector('.edit-tag-icon-btn').addEventListener('click', (e) => { e.stopPropagation(); openEditTagModal(tagObj.id); }); 
        tagCard.querySelector('.delete-tag-icon-btn').addEventListener('click', (e) => { e.stopPropagation(); openConfirmDeleteTagModalFromCard(tagObj.id, tagObj.name);});
        settingsTagsListContainer.appendChild(tagCard); 
    }); 
}
function renderDeletedNotesList() { /* ... same as v6.0.1 ... */ 
    if (!deletedNotesListContainer || !noDeletedNotesMessage || !emptyTrashBtn) return; deletedNotesListContainer.innerHTML = '';
    if (core.localDeletedNotesCache.length === 0) { noDeletedNotesMessage.style.display = 'block'; emptyTrashBtn.disabled = true; return; }
    noDeletedNotesMessage.style.display = 'none'; emptyTrashBtn.disabled = false;
    core.localDeletedNotesCache.forEach(deletedNote => { /* ... create and append card ... */ });
}
function updateNoteInfoPanelUI(note) { /* ... same as v6.0.1 ... */ 
    if (!noteInfoPanelContainer) return;
    if (!note || (!note.tags?.length && !note.createdAt && !note.activity?.trim() && (!note.edits || note.edits.length === 0))) { noteInfoPanelContainer.style.display = 'none'; return; }
    noteInfoPanelContainer.style.display = 'block';
    if (note.tags && note.tags.length > 0) { noteInfoTags.style.display = 'block'; noteInfoTagsValue.textContent = note.tags.map(t => t.name).join(', '); } else { noteInfoTags.style.display = 'none'; }
    if (note.createdAt) { noteInfoCreated.style.display = 'block'; noteInfoCreatedValue.textContent = (note.createdAt === 'PENDING_SAVE') ? '(Will be set on first save)' : formatFullDateFromTimestamp(note.createdAt); } else { noteInfoCreated.style.display = 'none'; }
    if (note.activity && note.activity.trim() !== '') { noteInfoActivity.style.display = 'block'; noteInfoActivityValue.textContent = note.activity; } else { noteInfoActivity.style.display = 'none'; }
    noteInfoEditsList.innerHTML = ''; 
    if (note.edits && note.edits.length > 0) { /* ... render edits ... */ } else { noteInfoEditsContainer.style.display = 'none'; }
}
function renderTagPillsInPanelUI() { /* ... same as v6.0.1, ensure core.debouncedHandleInteractionPanelInputChange is called ... */ 
    if (!noteTagsContainer_panel || !noteTagsInputField_panel) return;
    noteTagsContainer_panel.querySelectorAll('.tag-pill').forEach(pill => pill.remove());
    core.currentNoteTagsArrayInPanel.forEach(tagName => { /* ... create and append pill ... */ 
        const tagPill = document.createElement('span'); /* ... set styles ... */ tagPill.textContent = tagName;
        const removeBtn = document.createElement('span'); /* ... set styles ... */ removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => {
            core.setCurrentNoteTagsArrayInPanel(core.currentNoteTagsArrayInPanel.filter(t => t !== tagName));
            renderTagPillsInPanelUI(); updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange(); 
        });
        tagPill.appendChild(removeBtn); noteTagsContainer_panel.insertBefore(tagPill, noteTagsInputField_panel); 
    });
    noteTagsInputField_panel.value = ''; 
}
function updatePanelNotebookSelectorUI() { /* ... same as v6.0.1 ... */ 
    if(!panelNotebookSelector) return; const currentSelection = panelNotebookSelector.value; panelNotebookSelector.innerHTML = ''; 
    if (core.localNotebooksCache.length === 0) { /* ... add disabled option ... */ } 
    else { core.localNotebooksCache.forEach(nb => { /* ... add option ... */ }); } 
    if (core.currentOpenNotebookIdForPanel) panelNotebookSelector.value = core.currentOpenNotebookIdForPanel; 
    else if (currentSelection && core.localNotebooksCache.some(nb => nb.id === currentSelection)) panelNotebookSelector.value = currentSelection; 
    else if (core.localNotebooksCache.length > 0) panelNotebookSelector.value = core.localNotebooksCache[0].id; 
}
async function processInteractionPanelEditsOnDeselectUI(isSwitchingContext = false) { /* ... same as v6.0.1 ... */ 
    if (core.currentInteractingNoteIdInPanel && !core.isNewNoteSessionInPanel) await core.saveCurrentEditDescription(); 
    core.setCurrentEditSessionEntryId(null); core.setCurrentEditSessionOpenTimePanel(null);
    if(interactionPanelEditsMadeInputField) interactionPanelEditsMadeInputField.value = ''; 
    if(interactionPanelCurrentEditSessionContainer) interactionPanelCurrentEditSessionContainer.style.display = 'none';
    let noteBeingProcessedId = core.currentInteractingNoteIdInPanel || core.activelyCreatingNoteId; 
    if (core.isNewNoteSessionInPanel && !noteBeingProcessedId) { if (noteTitleInputField_panel.value.trim() === "" && noteTextInputField_panel.value.trim() === "") return; }
    if (core.activelyCreatingNoteId && noteBeingProcessedId === core.activelyCreatingNoteId) {
        const tempNote = core.localNotesCache.find(n => n.id === noteBeingProcessedId);
        const titleIsEmpty = noteTitleInputField_panel.value.trim() === ""; const textIsEmpty = noteTextInputField_panel.value.trim() === "";
        const activityIsEmpty = !interactionPanelActivityInputField || interactionPanelActivityInputField.value.trim() === "";
        if (titleIsEmpty && textIsEmpty && activityIsEmpty) {
             if(isSwitchingContext){ 
                try {
                    const notebookIdForDeletion = tempNote ? tempNote.notebookId : core.currentOpenNotebookIdForPanel;
                    if (notebookIdForDeletion) {
                        await core.deleteDoc(core.doc(core.db, `${core.userAppMemoirDocPath}/notebooks/${notebookIdForDeletion}/notes/${noteBeingProcessedId}`));
                        const notebookRef = core.doc(core.db, `${core.userAppMemoirDocPath}/notebooks/${notebookIdForDeletion}`);
                        const notebookSnap = await core.getDoc(notebookRef);
                        if (notebookSnap.exists()) await core.updateDoc(notebookRef, { notesCount: Math.max(0, (notebookSnap.data().notesCount || 0) - 1) });
                        if (tempNote && tempNote.tags) for (const tag of tempNote.tags) await core.checkAndCleanupOrphanedTag(tag.name);
                    }
                } catch (e) { console.error("Error deleting empty new note:", e); }
                core.setActivelyCreatingNoteId(null); return; 
             }
        }
    }
}
function clearInteractionPanelUI(processEdits = true) { /* ... same as v6.0.1, ensure autosaveStatusContainer.style.display = 'none'; is called ... */ 
    if (processEdits) processInteractionPanelEditsOnDeselectUI(true); 
    if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'none'; 
    if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'flex'; 
    if(interactionPanelForm) interactionPanelForm.reset(); 
    core.setCurrentInteractingNoteIdInPanel(null); core.setIsNewNoteSessionInPanel(false); core.setActivelyCreatingNoteId(null); 
    core.setCurrentEditSessionOpenTimePanel(null); core.setCurrentEditSessionEntryId(null); 
    core.setCurrentOpenNotebookIdForPanel(null); core.setCurrentInteractingNoteOriginalNotebookId(null); 
    core.setCurrentNoteTagsArrayInPanel([]); renderTagPillsInPanelUI(); 
    if (lastSelectedNotePreviewElement) { /* ... reset style of lastSelectedNotePreviewElement ... */ lastSelectedNotePreviewElement = null; } 
    if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; 
    if(panelNotebookSelectorContainer) panelNotebookSelectorContainer.style.display = 'none'; 
    updateNoteInfoPanelUI(null); 
    if (autosaveStatusContainer) autosaveStatusContainer.style.display = 'none';
}
function setupPanelForNewNote(notebookId, notebookName) { /* ... same as v6.0.1, add updateAutosaveStatusUI('initial') ... */ 
    if (core.currentInteractingNoteIdInPanel || core.isNewNoteSessionInPanel || core.activelyCreatingNoteId) processInteractionPanelEditsOnDeselectUI(true); 
    clearInteractionPanelUI(false); 
    core.setIsNewNoteSessionInPanel(true); core.setActivelyCreatingNoteId(null); core.setCurrentInteractingNoteIdInPanel(null); 
    core.setCurrentOpenNotebookIdForPanel(notebookId); core.setCurrentInteractingNoteOriginalNotebookId(null); 
    core.setCurrentEditSessionOpenTimePanel(null); core.setCurrentEditSessionEntryId(null); core.setCurrentNoteTagsArrayInPanel([]); 
    if(interactionPanelForm) interactionPanelForm.reset(); updatePanelNotebookSelectorUI(); 
    if(panelNotebookSelectorContainer) panelNotebookSelectorContainer.style.display = 'block'; 
    if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; 
    if (panelCreationTimeContainer) { /* ... handle admin mode visibility ... */ }
    if(panelActivityContainer) { /* ... handle visibility ... */ }
    if(interactionPanelCurrentEditSessionContainer) interactionPanelCurrentEditSessionContainer.style.display = 'none'; 
    if(interactionPanelEditsMadeInputField) interactionPanelEditsMadeInputField.value = ''; 
    renderTagPillsInPanelUI(); updateNoteInfoPanelUI({ createdAt: 'PENDING_SAVE', activity: '', tags: [], edits: [] }); 
    if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'none';
    if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'flex'; 
    if(noteTitleInputField_panel) noteTitleInputField_panel.focus();
    core.setLastSavedNoteTitleInPanel(""); core.setLastSavedNoteTextInPanel(""); core.setLastSavedNoteTagsInPanel(""); core.setLastSavedNoteActivityInPanel("");
    updateAutosaveStatusUI('initial');
}
function displayNoteInInteractionPanel(noteId, forceFocusToTitle = true) { /* ... same as v6.0.1, add updateAutosaveStatusUI('saved', 'Loaded') ... */ 
    const previousInteractingNoteId = core.currentInteractingNoteIdInPanel; const isActuallySwitchingNotes = previousInteractingNoteId !== noteId;
    if (isActuallySwitchingNotes && ((core.currentInteractingNoteIdInPanel && core.currentInteractingNoteIdInPanel !== noteId) || core.isNewNoteSessionInPanel) ) processInteractionPanelEditsOnDeselectUI(true); 
    const noteToEdit = core.localNotesCache.find(n => n.id === noteId); if (!noteToEdit) { clearInteractionPanelUI(false); return; } 
    core.setIsNewNoteSessionInPanel(false); core.setCurrentInteractingNoteIdInPanel(noteId); 
    core.setCurrentInteractingNoteOriginalNotebookId(noteToEdit.notebookId); core.setCurrentOpenNotebookIdForPanel(noteToEdit.notebookId); 
    if (isActuallySwitchingNotes) { /* ... reset edit session state ... */ }
    core.setLastSavedNoteTitleInPanel(noteToEdit.title || ""); core.setLastSavedNoteTextInPanel(noteToEdit.text || "");
    core.setCurrentNoteTagsArrayInPanel((noteToEdit.tags || []).map(tagObj => tagObj.name));
    core.setLastSavedNoteTagsInPanel(core.currentNoteTagsArrayInPanel.slice().sort().join(','));
    core.setLastSavedNoteActivityInPanel(noteToEdit.activity || '');
    if(noteTitleInputField_panel) { /* ... set title value ... */ }
    if(noteTextInputField_panel) { /* ... set text value and handleFirstMainEdit listener ... */ }
    renderTagPillsInPanelUI(); updatePanelNotebookSelectorUI(); 
    if(panelNotebookSelectorContainer) panelNotebookSelectorContainer.style.display = 'block'; 
    if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; 
    if (panelCreationTimeContainer) { /* ... handle admin mode visibility ... */ }
    if(panelActivityContainer) { /* ... handle admin mode visibility ... */ }
    updateNoteInfoPanelUI(noteToEdit); 
    if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'none'; 
    if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'flex'; 
    if (forceFocusToTitle && noteTitleInputField_panel && document.activeElement !== noteTitleInputField_panel) noteTitleInputField_panel.focus();
    if (lastSelectedNotePreviewElement && lastSelectedNotePreviewElement.dataset.noteId !== noteId) { /* ... style deselected preview ... */ }
    const currentPreviewEl = document.querySelector(`.note-preview-card[data-note-id="${noteId}"]`);
    if (currentPreviewEl) { /* ... style selected preview ... */ lastSelectedNotePreviewElement = currentPreviewEl; if (core.themeSettings.viewMode === 'compact') currentPreviewEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    updateAutosaveStatusUI('saved', 'Loaded');
}
function populateExportNotebookSelectorUI() { /* ... same as v6.0.1 ... */ }
function handleRestoreNoteUI(deletedNoteId) { /* ... same as v6.0.1 ... */ }
function openConfirmDeleteTagModalFromCard(tagId, tagName) { /* ... same as v6.0.1 ... */ }
function closeEditTagModal() { /* ... same as v6.0.1 ... */ }
function closeConfirmTagDeleteModal() { /* ... same as v6.0.1 ... */ }

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign all DOM elements (ensure new autosave elements are included)
    loadingOverlay = document.getElementById('loadingOverlay'); /* ... all other element assignments ... */
    autosaveStatusContainer = document.getElementById('autosaveStatusContainer');
    autosaveStatusIcon = document.getElementById('autosaveStatusIcon');
    autosaveStatusText = document.getElementById('autosaveStatusText');
    // ... (rest of the DOM element assignments from previous version)

    currentSelectedColorForTagEdit = core.DEFAULT_TAG_COLOR;

    core.setUIRefreshCallbacks({
        renderAllNotesPreviews, renderNotebooksOnPage, renderTagsInSettings, renderDeletedNotesList,
        updatePanelNotebookSelector: updatePanelNotebookSelectorUI,
        displayNotebookHeader: displayNotebookHeaderUI,
        applyThemeSettings: applyThemeSettingsUI, updateViewModeRadios: updateViewModeRadiosUI,
        renderPaletteColors: renderPaletteColorsUI, updatePaletteLimitMessage: updatePaletteLimitMessageUI,
        updateNoteInfoPanel: updateNoteInfoPanelUI, renderTagPillsInPanel: renderTagPillsInPanelUI,
        switchToMainView, clearInteractionPanel: clearInteractionPanelUI,
        populateExportNotebookSelector: populateExportNotebookSelectorUI,
        hideLoadingOverlay, showLoadingOverlay,
        updateAutosaveStatus: updateAutosaveStatusUI 
    });

    core.initializeDataListeners();

    // --- Initial UI Setup & Event Listeners (largely same as v6.0.1) ---
    // ... (all event listeners from previous ui-handlers.js) ...

    // Modify input event listeners to include updateAutosaveStatusUI('unsaved')
    const setupAutosaveInputListener = (inputElement) => {
        if (inputElement) {
            inputElement.addEventListener('input', () => {
                updateAutosaveStatusUI('unsaved');
                core.debouncedHandleInteractionPanelInputChange();
            });
        }
    };
    setupAutosaveInputListener(noteTitleInputField_panel);
    setupAutosaveInputListener(noteTextInputField_panel);
    setupAutosaveInputListener(interactionPanelActivityInputField);
    setupAutosaveInputListener(interactionPanelCreationDateInputField);
    setupAutosaveInputListener(interactionPanelCreationTimeInputField_time);
    
    if(interactionPanelEditsMadeInputField) {
        interactionPanelEditsMadeInputField.addEventListener('input', () => {
            updateAutosaveStatusUI('unsaved', 'Editing session notes...');
            core.debouncedSaveEditDescription();
        });
    }
    
    if (noteTagsInputField_panel) {
        noteTagsInputField_panel.addEventListener('keydown', async (event) => {
            if (event.key === ',' || event.key === 'Enter') {
                event.preventDefault();
                if (core.currentNoteTagsArrayInPanel.length >= 5) { alert("Max 5 tags."); noteTagsInputField_panel.value = ''; return; }
                const newTagName = noteTagsInputField_panel.value.trim().toLowerCase();
                if (newTagName && !core.currentNoteTagsArrayInPanel.includes(newTagName)) {
                    core.setCurrentNoteTagsArrayInPanel([...core.currentNoteTagsArrayInPanel, newTagName]);
                    await core.updateGlobalTagsFromNoteInput([newTagName]); 
                    renderTagPillsInPanelUI(); 
                    updateAutosaveStatusUI('unsaved'); 
                    core.debouncedHandleInteractionPanelInputChange();
                }
                noteTagsInputField_panel.value = '';
            } else if (event.key === 'Backspace' && noteTagsInputField_panel.value === '' && core.currentNoteTagsArrayInPanel.length > 0) {
                event.preventDefault(); 
                const newTags = [...core.currentNoteTagsArrayInPanel]; newTags.pop(); core.setCurrentNoteTagsArrayInPanel(newTags);
                renderTagPillsInPanelUI(); updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange();
            }
        });
        noteTagsInputField_panel.addEventListener('blur', () => {
            const newTagName = noteTagsInputField_panel.value.trim().toLowerCase();
            if (newTagName) {
                if (core.currentNoteTagsArrayInPanel.length >= 5 && !core.currentNoteTagsArrayInPanel.includes(newTagName)) { alert("Max 5 tags."); } 
                else if (!core.currentNoteTagsArrayInPanel.includes(newTagName)) {
                    core.setCurrentNoteTagsArrayInPanel([...core.currentNoteTagsArrayInPanel, newTagName]);
                    core.updateGlobalTagsFromNoteInput([newTagName]).then(() => { 
                        renderTagPillsInPanelUI(); updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange(); 
                    });
                } else { updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange(); }
            } else { updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange(); }
            noteTagsInputField_panel.value = ''; 
        });
    }
    // ... (rest of the event listeners from v6.0.1) ...
    
    if (core.themeSettings.defaultHomepage === 'notes' || core.themeSettings.defaultHomepage === 'favorites') {
        // Handled by initializeDataListeners
    } else if (notebooksContentDiv && core.themeSettings.defaultHomepage === 'notebooks') {
        renderNotebooksOnPage();
    }
    renderTagsInSettings(); 
    clearInteractionPanelUI(false); 
});
