// ui-handlers.js (v6.0.4 - Defensive DOM Checks)
import * as core from './core-logic.js'; // Ensure this path is correct

// --- DOM ELEMENTS ---
// (Variables declared as before)
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
// (showLoadingOverlay, hideLoadingOverlay, formatDateFromTimestamp, etc. - remain the same)
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
    if (!autosaveStatusContainer || !autosaveStatusIcon || !autosaveStatusText) {
        // console.warn("Autosave status elements not found in DOM.");
        return;
    }

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
                if (autosaveStatusText.textContent === "Saved" || autosaveStatusText.textContent === "Loaded" || autosaveStatusText.textContent === "No changes" || autosaveStatusText.textContent === "Edit details saved" || autosaveStatusText.textContent === "Note moved") { 
                    autosaveStatusContainer.style.display = 'none';
                }
            }, 2500); 
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
            autosaveTimeoutId = setTimeout(() => {
                 if (autosaveStatusText.className.includes('text-red-500')) { 
                    autosaveStatusContainer.style.display = 'none';
                 }
            }, 5000);
            break;
        case 'initial': 
             autosaveStatusContainer.style.display = 'none';
            break;
        default:
            autosaveStatusContainer.style.display = 'none';
            break;
    }
}

// --- UI Rendering and Manipulation Functions ---
function applyCurrentViewMode() {
    if (document.body) {
        document.body.classList.remove('view-mode-compact', 'view-mode-comfortable');
        document.body.classList.add(`view-mode-${core.themeSettings.viewMode}`);
    }
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
    // Add checks for all div elements before manipulating them
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
    else if(notebooksContentDiv) notebooksContentDiv.classList.add("main-view-content-active"); // Default
    
    applyCurrentViewMode(); 

    if (allNotesSearchContainer) {
        if ((viewName === 'notes' || viewName === 'favorites') && !core.currentlyViewedNotebookId) allNotesSearchContainer.style.display = 'block';
        else { allNotesSearchContainer.style.display = 'none'; if (allNotesSearchInput) allNotesSearchInput.value = ''; core.setCurrentSearchTerm(''); }
    }
    if (autosaveStatusContainer) autosaveStatusContainer.style.display = 'none';

    if (viewName === 'notes' && notesContentDiv) { // Added notesContentDiv check
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

    if (viewName === 'settings' && settingsMenuItems && !document.querySelector('.settings-menu-item-active')) switchToSettingsSection("admin"); 
    if (viewName === 'notebooks') renderNotebooksOnPage(); 
    if (viewName === 'trash') { renderDeletedNotesList(); if(fabCreateNote) fabCreateNote.classList.add('hidden'); } 
    else {
        if(fabCreateNote && !(notesContentDiv?.classList.contains('showing-editor') && core.themeSettings.viewMode === 'comfortable')) { if(fabCreateNote) fabCreateNote.classList.remove('hidden'); } 
        else if (fabCreateNote) { fabCreateNote.classList.add('hidden'); }
    }
    if ((viewName === 'notes' || viewName === 'favorites')) renderAllNotesPreviews();
}

function renderNotebooksOnPage() { 
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
            if (notesContentDiv && core.themeSettings.viewMode === 'comfortable') { notesContentDiv.classList.add('showing-grid'); notesContentDiv.classList.remove('showing-editor'); if(noteInteractionPanel) noteInteractionPanel.style.display = 'none'; if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'flex'; if(fabCreateNote) fabCreateNote.classList.remove('hidden'); }
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

function applyThemeSettingsUI() { 
    const root = document.documentElement;
    if (!root) return;
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
    const themeAppDefaultBgColorPicker = document.getElementById('themeAppDefaultBgColorPicker');
    const themeSidebarBgColorPicker = document.getElementById('themeSidebarBgColorPicker');
    const themeButtonPrimaryColorPicker = document.getElementById('themeButtonPrimaryColorPicker');
    const themeBorderAccentColorPicker = document.getElementById('themeBorderAccentColorPicker');
    if(themeAppDefaultBgColorPicker) themeAppDefaultBgColorPicker.value = core.themeSettings.appDefaultBackgroundColor;
    if(themeSidebarBgColorPicker) themeSidebarBgColorPicker.value = core.themeSettings.themeSidebarBg;
    if(themeButtonPrimaryColorPicker) themeButtonPrimaryColorPicker.value = core.themeSettings.themeButtonPrimary;
    if(themeBorderAccentColorPicker) themeBorderAccentColorPicker.value = core.themeSettings.themeBorderAccent;
    if(defaultHomepageSelector) defaultHomepageSelector.value = core.themeSettings.defaultHomepage; 
    applyCurrentViewMode(); renderTagsInSettings(); renderNotebooksOnPage(); renderDeletedNotesList();
}

// ... (Other UI functions like updateViewModeRadiosUI, renderPaletteColorsUI, etc. remain largely the same but ensure DOM elements are checked before use if there's any doubt)

function renderAllNotesPreviews() { 
    if(!notesListScrollableArea || !noNotesMessagePreviewEl || !allNotesPageTitle) return;
    const isCurrentlyShowingGrid = notesContentDiv && core.themeSettings.viewMode === 'comfortable' && notesContentDiv.classList.contains('showing-grid');
    const isCurrentlyShowingEditorComfortable = notesContentDiv && core.themeSettings.viewMode === 'comfortable' && notesContentDiv.classList.contains('showing-editor');
    if (isCurrentlyShowingEditorComfortable && !core.currentlyViewedNotebookId) { notesListScrollableArea.innerHTML = ''; noNotesMessagePreviewEl.style.display = 'none'; return; }
    notesListScrollableArea.innerHTML = ""; let filteredNotesForDisplay = [...core.localNotesCache];
    if (core.currentSearchTerm) filteredNotesForDisplay = core.localNotesCache.filter(note => (note.title && note.title.toLowerCase().includes(core.currentSearchTerm)) || (note.text && note.text.toLowerCase().includes(core.currentSearchTerm)));
    if (core.currentlyViewedNotebookId) { const currentNb = core.localNotebooksCache.find(nb => nb.id === core.currentlyViewedNotebookId); if(allNotesPageTitle) allNotesPageTitle.textContent = `Notes in "${currentNb ? currentNb.title : 'Selected Notebook'}"`; displayNotebookHeaderUI(core.currentlyViewedNotebookId); } 
    else if (core.currentFilterTag) { if(allNotesPageTitle) allNotesPageTitle.textContent = `Notes tagged: "${core.currentFilterTag}"`; if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none'; } 
    else if (core.isFavoritesViewActive) { if(allNotesPageTitle) allNotesPageTitle.textContent = "Favorite Notes"; if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none'; } 
    else { if(allNotesPageTitle) allNotesPageTitle.textContent = "All Notes"; if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none'; }
    if (filteredNotesForDisplay.length === 0) { 
        if (core.currentSearchTerm && core.localNotesCache.length > 0) noNotesMessagePreviewEl.textContent = `No notes match search for "${core.currentSearchTerm}".`;
        else if (core.currentFilterTag) noNotesMessagePreviewEl.textContent = `No notes with tag "${core.currentFilterTag}".`; 
        else if (core.isFavoritesViewActive) noNotesMessagePreviewEl.textContent = 'No favorite notes.'; 
        else if (core.currentlyViewedNotebookId) noNotesMessagePreviewEl.textContent = 'No notes in this notebook.'; 
        else noNotesMessagePreviewEl.textContent = 'No notes yet. Create one!'; 
        notesListScrollableArea.appendChild(noNotesMessagePreviewEl); noNotesMessagePreviewEl.style.display = 'block'; 
        if (!core.isNewNoteSessionInPanel && !core.activelyCreatingNoteId && !core.currentInteractingNoteIdInPanel && core.themeSettings.viewMode === 'compact') clearInteractionPanelUI(false); 
        return; 
    } 
    noNotesMessagePreviewEl.style.display = 'none'; 
    filteredNotesForDisplay.sort((a,b) => (b.modifiedAt?.toMillis?.() || new Date(b.modifiedAt).getTime()) - (a.modifiedAt?.toMillis?.() || new Date(a.modifiedAt).getTime()));
    filteredNotesForDisplay.forEach(note => { 
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
        if (isCurrentlyTheInteractingNote && core.themeSettings.viewMode === 'compact') { /* style selected */ } else { /* style unselected */ } 
        previewEl.setAttribute('data-note-id', note.id); 
        let previewHTML = '<em>No content</em>'; 
        if (note.text && note.text.trim() !== "") { /* generate previewHTML */ } 
        h4El.textContent = note.title || '(Untitled Note)'; pContentEl.innerHTML = previewHTML; pNotebookEl.textContent = notebook ? notebook.title : 'Unknown'; 
        deleteDiv.appendChild(deleteIcon); favoriteDiv.appendChild(favoriteIcon); 
        noteActionsDiv.appendChild(deleteDiv); noteActionsDiv.appendChild(favoriteDiv); 
        previewEl.appendChild(h4El); previewEl.appendChild(pContentEl); previewEl.appendChild(pNotebookEl); previewEl.appendChild(noteActionsDiv); 
        previewEl.addEventListener('click', (e) => { if (e.target.closest('.favorite-star') || e.target.closest('.delete-note-icon')) return; if (notesContentDiv && core.themeSettings.viewMode === 'comfortable') { switchToMainView('notes', 'openNote'); displayNoteInInteractionPanel(note.id); } else { displayNoteInInteractionPanel(note.id); } }); 
        favoriteDiv.addEventListener('click', async (e) => { e.stopPropagation(); const noteToToggle = core.localNotesCache.find(n => n.id === note.id); if (noteToToggle) { const newFavStatus = !noteToToggle.isFavorite; try { await core.updateDoc(core.doc(core.db, `${core.userAppMemoirDocPath}/notebooks/${noteToToggle.notebookId}/notes/${note.id}`), { isFavorite: newFavStatus }); } catch (err) { console.error("Error updating favorite:", err); } } }); 
        deleteDiv.addEventListener('click', (e) => { e.stopPropagation(); core.moveNoteToTrashImmediately(note.id, note.notebookId, note.title); });
        notesListScrollableArea.appendChild(previewEl); 
    }); 
    if (core.noMoreNotesToLoad && filteredNotesForDisplay.length > 0 && !core.currentSearchTerm) { /* add end of notes message */ }
}

// ... (Rest of the UI functions: renderTagsInSettings, renderDeletedNotesList, updateNoteInfoPanelUI, etc. remain structurally similar)
// Ensure that any DOM manipulation within these functions also checks if the parent/target element exists before proceeding.

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign all DOM elements
    loadingOverlay = document.getElementById('loadingOverlay'); 
    appSidebar = document.getElementById('appSidebar');
    mainContentArea = document.querySelector('.main-content-area');
    // ... (all other element assignments, ensure IDs match HTML)
    autosaveStatusContainer = document.getElementById('autosaveStatusContainer');
    autosaveStatusIcon = document.getElementById('autosaveStatusIcon');
    autosaveStatusText = document.getElementById('autosaveStatusText');
    // ... (rest of assignments)
    cnNotebookTitleField = document.getElementById('cnNotebookTitleField');
    cnNotebookPurposeField = document.getElementById('cnNotebookPurposeField');
    cnNotebookCoverPaletteContainer = document.getElementById('cnNotebookCoverPaletteContainer');
    cnNotebookCoverColorDisplay = document.getElementById('cnNotebookCoverColorDisplay');
    editNotebookModal = document.getElementById('editNotebookModal');
    closeEditNotebookModalBtn_notebook = document.getElementById('closeEditNotebookModalBtn');
    cancelNotebookEditBtn = document.getElementById('cancelNotebookEditBtn');
    editNotebookForm = document.getElementById('editNotebookForm');
    editingNotebookIdField = document.getElementById('editingNotebookIdField');
    enNotebookTitleField = document.getElementById('enNotebookTitleField');
    enNotebookPurposeField = document.getElementById('enNotebookPurposeField');
    enNotebookCoverPaletteContainer = document.getElementById('enNotebookCoverPaletteContainer');
    enNotebookCoverColorDisplay = document.getElementById('enNotebookCoverColorDisplay');
    editTagModal = document.getElementById('editTagModal');
    closeEditTagModalBtn_tag = editTagModal ? editTagModal.querySelector('#closeEditTagModalBtn') : null;
    cancelEditTagBtn = document.getElementById('cancelEditTagBtn');
    editTagForm = document.getElementById('editTagForm');
    editingOriginalTagNameField = document.getElementById('editingOriginalTagNameField');
    editingTagIdField = document.getElementById('editingTagIdField');
    etTagNameField = document.getElementById('etTagNameField');
    editTagPaletteContainer = document.getElementById('editTagPaletteContainer');
    etTagColorDisplay = document.getElementById('etTagColorDisplay');
    etTagPurposeField = document.getElementById('etTagPurposeField');
    deleteTagBtn = document.getElementById('deleteTagBtn');
    confirmTagDeleteModal = document.getElementById('confirmTagDeleteModal');
    closeConfirmTagDeleteModalBtn = document.getElementById('closeConfirmTagDeleteModalBtn');
    tagNameToDeleteDisplay = document.getElementById('tagNameToDeleteDisplay');
    cancelTagDeletionBtn = document.getElementById('cancelTagDeletionBtn');
    executeTagDeletionBtn = document.getElementById('executeTagDeletionBtn');
    confirmNotebookDeleteModal = document.getElementById('confirmNotebookDeleteModal');
    closeConfirmNotebookDeleteModalBtn = document.getElementById('closeConfirmNotebookDeleteModalBtn');
    notebookNameToDeleteDisplay = document.getElementById('notebookNameToDeleteDisplay');
    cancelNotebookDeletionBtn = document.getElementById('cancelNotebookDeletionBtn');
    executeNotebookDeletionBtn = document.getElementById('executeNotebookDeletionBtn');
    confirmNoteActionModal = document.getElementById('confirmNoteActionModal');
    confirmNoteActionTitle = document.getElementById('confirmNoteActionTitle');
    confirmNoteActionMessage = document.getElementById('confirmNoteActionMessage');
    confirmNoteActionWarning = document.getElementById('confirmNoteActionWarning');
    closeConfirmNoteActionModalBtn = document.getElementById('closeConfirmNoteActionModalBtn');
    cancelNoteActionBtn = document.getElementById('cancelNoteActionBtn');
    executeNoteActionBtn = document.getElementById('executeNoteActionBtn');
    confirmThemeResetModal = document.getElementById('confirmThemeResetModal');
    closeConfirmThemeResetModalBtn = document.getElementById('closeConfirmThemeResetModalBtn');
    cancelThemeResetBtn = document.getElementById('cancelThemeResetBtn');
    executeThemeResetBtn = document.getElementById('executeThemeResetBtn');
    defaultHomepageSelector = document.getElementById('defaultHomepageSelector');
    themeColorInputs = document.querySelectorAll('.theme-color-input');
    paletteColorsContainer = document.getElementById('paletteColorsContainer');
    newPaletteColorPicker = document.getElementById('newPaletteColorPicker');
    addPaletteColorBtn = document.getElementById('addPaletteColorBtn');
    resetThemeBtn = document.getElementById('resetThemeBtn');
    editPaletteBtn = document.getElementById('editPaletteBtn');
    paletteLimitMessage = document.getElementById('paletteLimitMessage');
    viewModeCompactRadio = document.getElementById('viewModeCompact');
    viewModeComfortableRadio = document.getElementById('viewModeComfortable');
    allNotesPageTitle = document.getElementById('allNotesPageTitle');
    notebookHeaderDisplay = document.getElementById('notebookHeaderDisplay');
    allNotesSearchContainer = document.getElementById('allNotesSearchContainer');
    allNotesSearchInput = document.getElementById('allNotesSearchInput');
    notesPreviewColumnOuter = document.getElementById('notesPreviewColumnOuter');
    notesListScrollableArea = document.getElementById('notesListScrollableArea');
    noNotesMessagePreviewEl = document.getElementById('noNotesMessage');
    noteInteractionPanel = document.getElementById('noteInteractionPanel');
    noteInteractionPanelPlaceholder = document.getElementById('noteInteractionPanelPlaceholder');
    noteInteractionFormContainer = document.getElementById('noteInteractionFormContainer');
    interactionPanelForm = document.getElementById('interactionPanelForm');
    noteTitleInputField_panel = document.getElementById('noteTitleInputField_panel');
    noteTextInputField_panel = document.getElementById('noteTextInputField_panel');
    noteTagsContainer_panel = document.getElementById('noteTagsContainer_panel');
    noteTagsInputField_panel = document.getElementById('noteTagsInputField_panel');
    panelNotebookSelectorContainer = document.getElementById('panelNotebookSelectorContainer');
    panelNotebookSelector = document.getElementById('panelNotebookSelector');
    notebookChangeConfirmationEl = document.getElementById('notebookChangeConfirmation');
    panelCreationTimeContainer = document.getElementById('panelCreationTimeContainer');
    interactionPanelCreationTimeDisplayField = document.getElementById('interactionPanelCreationTimeDisplayField');
    interactionPanelCreationTimeInputsContainer = document.getElementById('interactionPanelCreationTimeInputsContainer');
    interactionPanelCreationDateInputField = document.getElementById('interactionPanelCreationDateInputField');
    interactionPanelCreationTimeInputField_time = document.getElementById('interactionPanelCreationTimeInputField_time');
    panelActivityContainer = document.getElementById('panelActivityContainer');
    interactionPanelActivityDisplayField = document.getElementById('interactionPanelActivityDisplayField');
    interactionPanelActivityInputField = document.getElementById('interactionPanelActivityInputField');
    interactionPanelCurrentEditSessionContainer = document.getElementById('interactionPanelCurrentEditSessionContainer');
    interactionPanelEditsMadeInputField = document.getElementById('interactionPanelEditsMadeInputField');
    noteInfoPanelContainer = document.getElementById('noteInfoPanelContainer');
    noteInfoTags = document.getElementById('noteInfoTags');
    noteInfoTagsValue = document.getElementById('noteInfoTagsValue');
    noteInfoCreated = document.getElementById('noteInfoCreated');
    noteInfoCreatedValue = document.getElementById('noteInfoCreatedValue');
    noteInfoActivity = document.getElementById('noteInfoActivity');
    noteInfoActivityValue = document.getElementById('noteInfoActivityValue');
    noteInfoEditsContainer = document.getElementById('noteInfoEditsContainer');
    noteInfoEditsList = document.getElementById('noteInfoEditsList');
    settingsMenuItems = document.querySelectorAll('.settings-menu-item');
    settingsContentSections = document.querySelectorAll('.settings-content-section');
    settingsTagsListContainer = document.getElementById('settingsTagsListContainer');
    settingsNoTagsMessage = document.getElementById('settingsNoTagsMessage');
    adminModeToggle = document.getElementById('adminModeToggle');
    fabCreateNote = document.getElementById('fabCreateNote');
    fabNavigateBack = document.getElementById('fabNavigateBack');
    deletedNotesListContainer = document.getElementById('deletedNotesListContainer');
    noDeletedNotesMessage = document.getElementById('noDeletedNotesMessage');
    emptyTrashBtn = document.getElementById('emptyTrashBtn');
    restoreNoteWithOptionsModal = document.getElementById('restoreNoteWithOptionsModal');
    closeRestoreNoteWithOptionsModalBtn = document.getElementById('closeRestoreNoteWithOptionsModalBtn');
    restoreNoteOptionsMessage = document.getElementById('restoreNoteOptionsMessage');
    restoreToNewNotebookBtn = document.getElementById('restoreToNewNotebookBtn');
    restoreToExistingNotebookSelector = document.getElementById('restoreToExistingNotebookSelector');
    restoreToSelectedNotebookBtn = document.getElementById('restoreToSelectedNotebookBtn');
    cancelRestoreWithOptionsBtn = document.getElementById('cancelRestoreWithOptionsBtn');
    confirmEmptyTrashModal = document.getElementById('confirmEmptyTrashModal');
    closeConfirmEmptyTrashModalBtn = document.getElementById('closeConfirmEmptyTrashModalBtn');
    cancelEmptyTrashBtn = document.getElementById('cancelEmptyTrashBtn');
    executeEmptyTrashBtn = document.getElementById('executeEmptyTrashBtn');
    exportNotebookSelector = document.getElementById('exportNotebookSelector');
    exportNotebookBtn = document.getElementById('exportNotebookBtn');
    exportStatusMessage = document.getElementById('exportStatusMessage');


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

    // --- Initial UI Setup & Event Listeners ---
    const fixedSidebarWidth = '7rem'; 
    if (appSidebar && mainContentArea) {
        appSidebar.style.width = fixedSidebarWidth; mainContentArea.style.marginLeft = fixedSidebarWidth;
        if (hamburgerBtn) hamburgerBtn.style.display = 'none'; 
    }
    
    if(sidebarNotebooksPageBtn) sidebarNotebooksPageBtn.addEventListener('click', () => { 
        if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        core.setIsFavoritesViewActive(false); core.setCurrentFilterTag(null); core.setCurrentlyViewedNotebookId(null); 
        clearInteractionPanelUI(true); switchToMainView('notebooks');
    }); 
    if(sidebarAllNotesBtn) sidebarAllNotesBtn.addEventListener('click', () => { 
        if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        core.setIsFavoritesViewActive(false); core.setCurrentFilterTag(null); core.setCurrentlyViewedNotebookId(null); 
        clearInteractionPanelUI(true); switchToMainView('notes'); 
        core.setupNotesListenerAndLoadInitialBatch(); 
    }); 
    if(sidebarFavoritesBtn) sidebarFavoritesBtn.addEventListener('click', () => { 
        if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        core.setIsFavoritesViewActive(true); core.setCurrentlyViewedNotebookId(null); core.setCurrentFilterTag(null); 
        clearInteractionPanelUI(true); switchToMainView('notes'); 
        core.setupNotesListenerAndLoadInitialBatch(); 
    }); 
    if(sidebarTrashBtn) sidebarTrashBtn.addEventListener('click', () => { 
        if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        core.setIsFavoritesViewActive(false); core.setCurrentFilterTag(null); core.setCurrentlyViewedNotebookId(null); 
        clearInteractionPanelUI(true); switchToMainView('trash'); 
    }); 
    if(sidebarSettingsBtn) sidebarSettingsBtn.addEventListener('click', () => {
        if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        switchToMainView('settings');
    });
    
    if (fabNavigateBack) {
        fabNavigateBack.addEventListener('click', () => {
            if (notesContentDiv && core.themeSettings.viewMode === 'comfortable' && notesContentDiv.classList.contains('showing-editor')) {
                switchToMainView('notes', null); 
            } else if (core.currentlyViewedNotebookId) { 
                core.setCurrentlyViewedNotebookId(null); switchToMainView('notebooks'); 
            } else if (core.currentFilterTag || core.isFavoritesViewActive) {
                core.setCurrentFilterTag(null); core.setIsFavoritesViewActive(false);
                switchToMainView('notes'); core.setupNotesListenerAndLoadInitialBatch();
            } else { switchToMainView(core.themeSettings.defaultHomepage || 'notebooks'); }
        });
    }

    if (allNotesSearchInput) {
        allNotesSearchInput.addEventListener('input', core.debounce(() => {
            core.setCurrentSearchTerm(allNotesSearchInput.value);
            renderAllNotesPreviews(); 
        }, 300));
    }

    if (notesListScrollableArea) {
        notesListScrollableArea.addEventListener('scroll', () => {
            if (notesListScrollableArea.scrollTop + notesListScrollableArea.clientHeight >= notesListScrollableArea.scrollHeight - 200) {
                if (!core.currentSearchTerm) core.fetchMoreNotes();
            }
        });
    }
    
    if (themeColorInputs) {
        themeColorInputs.forEach(input => { 
            input.addEventListener('input', core.debounce(async (event) => { 
                const key = event.target.dataset.themeKey; const value = event.target.value; 
                core.themeSettings[key] = value; applyThemeSettingsUI(); 
                await core.saveAppSettings({ activeThemeColors: { appDefaultBackgroundColor: core.themeSettings.appDefaultBackgroundColor, themeSidebarBg: core.themeSettings.themeSidebarBg, themeButtonPrimary: core.themeSettings.themeButtonPrimary, themeBorderAccent: core.themeSettings.themeBorderAccent }, defaultHomepage: core.themeSettings.defaultHomepage, viewMode: core.themeSettings.viewMode });
            }, 250)); 
        });
    }
    
    if(defaultHomepageSelector) defaultHomepageSelector.addEventListener('change', async (event) => {
        core.themeSettings.defaultHomepage = event.target.value; 
        await core.saveAppSettings({ defaultHomepage: core.themeSettings.defaultHomepage });
    });
    if(viewModeCompactRadio) viewModeCompactRadio.addEventListener('change', async () => {
        if (viewModeCompactRadio.checked) {
            core.themeSettings.viewMode = 'compact';
            await core.saveAppSettings({ viewMode: 'compact' }); applyCurrentViewMode();
            if (notesContentDiv && notesContentDiv.classList.contains('main-view-content-active')) core.setupNotesListenerAndLoadInitialBatch(); 
        }
    });
    if(viewModeComfortableRadio) viewModeComfortableRadio.addEventListener('change', async () => {
        if (viewModeComfortableRadio.checked) {
            core.themeSettings.viewMode = 'comfortable';
            await core.saveAppSettings({ viewMode: 'comfortable' }); applyCurrentViewMode();
            if (notesContentDiv && notesContentDiv.classList.contains('main-view-content-active')) core.setupNotesListenerAndLoadInitialBatch(); 
        }
    });

    if (resetThemeBtn) resetThemeBtn.addEventListener('click', () => { if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'flex'; });
    if (closeConfirmThemeResetModalBtn) closeConfirmThemeResetModalBtn.addEventListener('click', () => { if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none'; });
    if (cancelThemeResetBtn) cancelThemeResetBtn.addEventListener('click', () => { if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none'; });
    if (executeThemeResetBtn) executeThemeResetBtn.addEventListener('click', async () => {
        showLoadingOverlay("Resetting theme...");
        const initialSettings = { themeSidebarBg: "#047857", themeButtonPrimary: "#10b981", themeBorderAccent: "#34d399", appDefaultBackgroundColor: "#f0fdfa", defaultHomepage: "notebooks", viewMode: "compact" };
        const initialPalette = ["#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#fde047", "#facc15", "#eab308", "#f3f4f6"];
        const initialDefaultColors = [ "#047857", "#10b981", "#34d399", "#f0fdfa"];
        await core.saveAppSettings({ activeThemeColors: { ...initialSettings }, defaultThemeColors: [...initialDefaultColors], paletteColors: [...initialPalette], defaultHomepage: initialSettings.defaultHomepage, viewMode: initialSettings.viewMode });
        if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none';
    });

    if (addPaletteColorBtn && newPaletteColorPicker) { 
        addPaletteColorBtn.addEventListener('click', async () => { 
            const paletteLimit = core.PALETTE_BASE_LIMIT + core.localNotebooksCache.length;
            if (core.paletteColors.length >= paletteLimit) { alert(`Palette limit reached (${paletteLimit}).`); return; }
            const newColor = newPaletteColorPicker.value; 
            if (newColor && !core.paletteColors.includes(newColor)) { 
                core.paletteColors.push(newColor); 
                try { await core.saveAppSettings({ paletteColors: core.paletteColors }); renderPaletteColorsUI(); newPaletteColorPicker.value = "#000000"; } 
                catch (e) { core.paletteColors.pop(); updatePaletteLimitMessageUI(); } 
            } else if (core.paletteColors.includes(newColor)) { alert("Color already in palette."); } 
        }); 
    }
    if (editPaletteBtn) editPaletteBtn.addEventListener('click', () => { isPaletteEditMode = !isPaletteEditMode; editPaletteBtn.textContent = isPaletteEditMode ? 'Done Editing' : 'Edit Palette'; renderPaletteColorsUI(); });
    
    if(settingsMenuItems) settingsMenuItems.forEach(item => item.addEventListener('click', () => switchToSettingsSection(item.dataset.settingSection)));

    if (closeCreateNotebookModalBtn) closeCreateNotebookModalBtn.addEventListener('click', () => { if(createNotebookModal) createNotebookModal.style.display = 'none'; if(createNotebookForm) createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null; });
    if (cancelNotebookCreationBtn) cancelNotebookCreationBtn.addEventListener('click', () => { if(createNotebookModal) createNotebookModal.style.display = 'none'; if(createNotebookForm) createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null; });
    if (createNotebookForm) createNotebookForm.addEventListener('submit', async (event) => { 
        event.preventDefault(); let finalCoverColor = currentSelectedNotebookCoverColor_create;
        if (!finalCoverColor && core.paletteColors.length > 0) finalCoverColor = core.paletteColors[0]; else if (!finalCoverColor) finalCoverColor = 'var(--default-notebook-cover-bg)'; 
        await core.createNotebook({ userId: core.PLACEHOLDER_USER_ID, title: cnNotebookTitleField.value.trim() || "Untitled Notebook", purpose: cnNotebookPurposeField.value.trim(), createdAt: core.serverTimestamp(), notesCount: 0, coverColor: finalCoverColor });
        if(createNotebookModal) createNotebookModal.style.display = 'none'; createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null;
    });

    if(closeEditNotebookModalBtn_notebook) closeEditNotebookModalBtn_notebook.addEventListener('click', () => { if(editNotebookModal) editNotebookModal.style.display = 'none'; if(editNotebookForm) editNotebookForm.reset(); currentSelectedNotebookCoverColor = null; }); 
    if (cancelNotebookEditBtn) cancelNotebookEditBtn.addEventListener('click', () => { if(editNotebookModal) editNotebookModal.style.display = 'none'; if(editNotebookForm) editNotebookForm.reset(); currentSelectedNotebookCoverColor = null; });
    if (editNotebookForm) editNotebookForm.addEventListener('submit', async (event) => {
        event.preventDefault(); showLoadingOverlay("Saving notebook...");
        const notebookId = editingNotebookIdField.value; if (!notebookId) { hideLoadingOverlay(); return; }
        await core.updateNotebook(notebookId, { title: enNotebookTitleField.value.trim() || "Untitled Notebook", purpose: enNotebookPurposeField.value.trim(), coverColor: currentSelectedNotebookCoverColor });
        currentSelectedNotebookCoverColor = null; if(editNotebookModal) editNotebookModal.style.display = 'none'; editNotebookForm.reset(); hideLoadingOverlay();
    });
    
    if (closeConfirmNotebookDeleteModalBtn) closeConfirmNotebookDeleteModalBtn.addEventListener('click', () => { if(confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'none'; core.setNotebookToDeleteGlobally({ id: null, name: null }); });
    if (cancelNotebookDeletionBtn) cancelNotebookDeletionBtn.addEventListener('click', () => { if(confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'none'; core.setNotebookToDeleteGlobally({ id: null, name: null }); });
    if (executeNotebookDeletionBtn) executeNotebookDeletionBtn.addEventListener('click', async () => { 
        if (core.notebookToDeleteGlobally.id) await core.performActualNotebookDeletion(core.notebookToDeleteGlobally.id, core.notebookToDeleteGlobally.name); 
        if(confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'none'; core.setNotebookToDeleteGlobally({ id: null, name: null });
    });
    
    if (closeConfirmNoteActionModalBtn) closeConfirmNoteActionModalBtn.addEventListener('click', closeConfirmNoteActionModal);
    if (cancelNoteActionBtn) cancelNoteActionBtn.addEventListener('click', closeConfirmNoteActionModal);
    if (executeNoteActionBtn) executeNoteActionBtn.addEventListener('click', async () => { await core.performActualNoteAction(); closeConfirmNoteActionModal(); });

    if (closeEditTagModalBtn_tag) closeEditTagModalBtn_tag.addEventListener('click', closeEditTagModal);
    if (cancelEditTagBtn) cancelEditTagBtn.addEventListener('click', closeEditTagModal);
    if (editTagForm) editTagForm.addEventListener('submit', async (event) => {
        event.preventDefault(); const tagId = editingTagIdField.value; const originalName = editingOriginalTagNameField.value; 
        const newName = etTagNameField.value.trim().toLowerCase(); const newColor = currentSelectedColorForTagEdit; const newPurpose = etTagPurposeField.value.trim(); 
        if (!newName) { alert("Tag name cannot be empty."); return; } 
        if (newName !== originalName && core.localTagsCache.some(t => t.name === newName && t.id !== tagId)) { alert(`Tag "${newName}" already exists.`); return; } 
        await core.saveTagChanges(tagId, originalName, newName, newColor, newPurpose); closeEditTagModal();
    });
    if (deleteTagBtn) deleteTagBtn.addEventListener('click', () => {
        if (deleteTagBtn.disabled) return; const tagId = editingTagIdField.value; const tagName = editingOriginalTagNameField.value; 
        if (!tagId || !tagName) return; core.setTagToDeleteGlobally({ id: tagId, name: tagName });
        deleteTagBtn.disabled = true; if (tagNameToDeleteDisplay) tagNameToDeleteDisplay.textContent = tagName; if (confirmTagDeleteModal) confirmTagDeleteModal.style.display = 'flex';
    });
    if (closeConfirmTagDeleteModalBtn) closeConfirmTagDeleteModalBtn.addEventListener('click', closeConfirmTagDeleteModal);
    if (cancelTagDeletionBtn) cancelTagDeletionBtn.addEventListener('click', closeConfirmTagDeleteModal);
    if (executeTagDeletionBtn) executeTagDeletionBtn.addEventListener('click', async () => { 
        if (core.tagToDeleteGlobally.id) await core.performActualTagDeletion(core.tagToDeleteGlobally.id, core.tagToDeleteGlobally.name);
        closeConfirmTagDeleteModal(); closeEditTagModal(); 
    });

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
    
    if (adminModeToggle) adminModeToggle.addEventListener('change', () => { 
        isAdminModeEnabled = adminModeToggle.checked; 
        if (core.currentInteractingNoteIdInPanel && !core.isNewNoteSessionInPanel) displayNoteInInteractionPanel(core.currentInteractingNoteIdInPanel, false);
        else if (core.isNewNoteSessionInPanel && !core.currentInteractingNoteIdInPanel) {
            const tempNotebook = core.localNotebooksCache.find(nb => nb.id === core.currentOpenNotebookIdForPanel);
            setupPanelForNewNote(core.currentOpenNotebookIdForPanel, tempNotebook ? tempNotebook.title : "Selected Notebook");
        }
    });

    if (fabCreateNote) fabCreateNote.addEventListener('click', async () => {
        let targetNotebookId, targetNotebookName;
        if (core.themeSettings.viewMode === 'comfortable' || !core.currentlyViewedNotebookId) {
            const defaultNotebookForCreation = core.localNotebooksCache.find(nb => nb.title === "My Notes 😏") || (core.localNotebooksCache.length > 0 ? core.localNotebooksCache[0] : null);
            if (defaultNotebookForCreation) { targetNotebookId = defaultNotebookForCreation.id; targetNotebookName = defaultNotebookForCreation.title; }
        } else if (core.currentlyViewedNotebookId && core.themeSettings.viewMode === 'compact') { 
            const currentNb = core.localNotebooksCache.find(nb => nb.id === core.currentlyViewedNotebookId);
            if (currentNb) { targetNotebookId = currentNb.id; targetNotebookName = currentNb.title; }
        }
        if (!targetNotebookId && core.localNotebooksCache.length > 0) { targetNotebookId = core.localNotebooksCache[0].id; targetNotebookName = core.localNotebooksCache[0].title; }
        if (!targetNotebookId) { alert("No notebooks exist. Create one first."); switchToMainView('notebooks'); return; }
        if (notesContentDiv && !notesContentDiv.classList.contains('main-view-content-active')) switchToMainView('notes'); 
        if (core.themeSettings.viewMode === 'comfortable') switchToMainView('notes', 'newNoteComfortable'); 
        setupPanelForNewNote(targetNotebookId, targetNotebookName);
    });
    
    if (noteTagsInputField_panel) {
        noteTagsInputField_panel.addEventListener('keydown', async (event) => {
            if (event.key === ',' || event.key === 'Enter') {
                event.preventDefault();
                if (core.currentNoteTagsArrayInPanel.length >= 5) { alert("Max 5 tags."); noteTagsInputField_panel.value = ''; return; }
                const newTagName = noteTagsInputField_panel.value.trim().toLowerCase();
                if (newTagName && !core.currentNoteTagsArrayInPanel.includes(newTagName)) {
                    core.setCurrentNoteTagsArrayInPanel([...core.currentNoteTagsArrayInPanel, newTagName]);
                    await core.updateGlobalTagsFromNoteInput([newTagName]); 
                    renderTagPillsInPanelUI(); updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange();
                }
                noteTagsInputField_panel.value = '';
            } else if (event.key === 'Backspace' && noteTagsInputField_panel.value === '' && core.currentNoteTagsArrayInPanel.length > 0) {
                event.preventDefault(); const newTags = [...core.currentNoteTagsArrayInPanel]; newTags.pop(); core.setCurrentNoteTagsArrayInPanel(newTags);
                renderTagPillsInPanelUI(); updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange();
            }
        });
        noteTagsInputField_panel.addEventListener('blur', () => {
            const newTagName = noteTagsInputField_panel.value.trim().toLowerCase();
            if (newTagName) {
                if (core.currentNoteTagsArrayInPanel.length >= 5 && !core.currentNoteTagsArrayInPanel.includes(newTagName)) { alert("Max 5 tags."); } 
                else if (!core.currentNoteTagsArrayInPanel.includes(newTagName)) {
                    core.setCurrentNoteTagsArrayInPanel([...core.currentNoteTagsArrayInPanel, newTagName]);
                    core.updateGlobalTagsFromNoteInput([newTagName]).then(() => { renderTagPillsInPanelUI(); updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange(); });
                } else { updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange(); }
            } else { updateAutosaveStatusUI('unsaved'); core.debouncedHandleInteractionPanelInputChange(); }
            noteTagsInputField_panel.value = ''; 
        });
    }

    if (closeRestoreNoteWithOptionsModalBtn) closeRestoreNoteWithOptionsModalBtn.addEventListener('click', () => { if(restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'none'; core.setNoteToRestoreWithOptions(null); });
    if (cancelRestoreWithOptionsBtn) cancelRestoreWithOptionsBtn.addEventListener('click', () => { if(restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'none'; core.setNoteToRestoreWithOptions(null); });
    if (restoreToNewNotebookBtn) restoreToNewNotebookBtn.addEventListener('click', async () => {
        if (!core.noteToRestoreWithOptions) return;
        await core.handleRestoreNote(core.noteToRestoreWithOptions.id, null, core.noteToRestoreWithOptions.originalNotebookName || "Restored Notes");
        if(restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'none'; core.setNoteToRestoreWithOptions(null);
    });
    if (restoreToSelectedNotebookBtn) restoreToSelectedNotebookBtn.addEventListener('click', async () => {
        if (!core.noteToRestoreWithOptions || !restoreToExistingNotebookSelector.value) return;
        await core.handleRestoreNote(core.noteToRestoreWithOptions.id, restoreToExistingNotebookSelector.value);
        if(restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'none'; core.setNoteToRestoreWithOptions(null);
    });
    if (emptyTrashBtn) emptyTrashBtn.addEventListener('click', () => { if (core.localDeletedNotesCache.length > 0 && confirmEmptyTrashModal) confirmEmptyTrashModal.style.display = 'flex'; });
    if (closeConfirmEmptyTrashModalBtn) closeConfirmEmptyTrashModalBtn.addEventListener('click', () => { if(confirmEmptyTrashModal) confirmEmptyTrashModal.style.display = 'none';});
    if (cancelEmptyTrashBtn) cancelEmptyTrashBtn.addEventListener('click', () => { if(confirmEmptyTrashModal) confirmEmptyTrashModal.style.display = 'none';});
    if (executeEmptyTrashBtn) executeEmptyTrashBtn.addEventListener('click', async () => { await core.performEmptyTrash(); if(confirmEmptyTrashModal) confirmEmptyTrashModal.style.display = 'none'; });

    if (exportNotebookBtn) exportNotebookBtn.addEventListener('click', async () => {
        if (!exportNotebookSelector || !exportStatusMessage) return;
        const selectedNotebookId = exportNotebookSelector.value;
        if (!selectedNotebookId) { exportStatusMessage.textContent = "Please select a notebook."; exportStatusMessage.style.color = 'red'; return; }
        exportStatusMessage.textContent = "Preparing export..."; exportStatusMessage.style.color = 'var(--theme-bg-sidebar)'; exportNotebookBtn.disabled = true;
        try {
            const exportData = await core.getExportData(selectedNotebookId);
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const filename = `${sanitizeFilename(exportData.title)}_export.json`;
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
            exportStatusMessage.textContent = `Exported "${exportData.title}" successfully!`; exportStatusMessage.style.color = 'var(--theme-bg-button-primary)';
        } catch (error) { console.error("Error exporting notebook:", error); exportStatusMessage.textContent = "Error exporting notebook."; exportStatusMessage.style.color = 'red';
        } finally { exportNotebookBtn.disabled = false; }
    });

    window.addEventListener('click', (event) => { 
        if (event.target === createNotebookModal) { createNotebookModal.style.display = 'none'; createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null; } 
        if (event.target === editTagModal) closeEditTagModal(); 
        if (event.target === editNotebookModal) { editNotebookModal.style.display = 'none'; editNotebookForm.reset(); currentSelectedNotebookCoverColor = null; } 
        if (event.target === confirmTagDeleteModal) closeConfirmTagDeleteModal(); 
        if (event.target === confirmNotebookDeleteModal) { if (confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'none'; core.setNotebookToDeleteGlobally({ id: null, name: null }); }
        if (event.target === confirmNoteActionModal) closeConfirmNoteActionModal(); 
        if (event.target === confirmThemeResetModal) { if(confirmThemeResetModal) confirmThemeResetModal.style.display = 'none';} 
        if (event.target === restoreNoteWithOptionsModal) { restoreNoteWithOptionsModal.style.display = 'none'; core.setNoteToRestoreWithOptions(null); } 
        if (event.target === confirmEmptyTrashModal) { confirmEmptyTrashModal.style.display = 'none'; } 
    });
    
    if (core.themeSettings.defaultHomepage === 'notes' || core.themeSettings.defaultHomepage === 'favorites') { /* Handled by initializeDataListeners */ } 
    else if (notebooksContentDiv && core.themeSettings.defaultHomepage === 'notebooks') { renderNotebooksOnPage(); }
    renderTagsInSettings(); 
    clearInteractionPanelUI(false); 
});
