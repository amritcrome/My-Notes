// ui-handlers.js
import * as core from './core-logic.js';

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
    exportNotebookSelector, exportNotebookBtn, exportStatusMessage;

// --- UI State (mostly for direct UI control, core state is in core-logic) ---
let lastSelectedNotePreviewElement = null;
let isAdminModeEnabled = false; // UI directly uses this for toggles
let isPaletteEditMode = false;
let currentSelectedColorForTagEdit = null; // Will be set from core.DEFAULT_TAG_COLOR initially
let currentSelectedNotebookCoverColor = null; 
let currentSelectedNotebookCoverColor_create = null;


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


// --- UI Rendering and Manipulation Functions ---
function applyCurrentViewMode() {
    document.body.classList.remove('view-mode-compact', 'view-mode-comfortable');
    document.body.classList.add(`view-mode-${core.themeSettings.viewMode}`);
    
    if (notesContentDiv && notesContentDiv.classList.contains('main-view-content-active')) {
        if (core.themeSettings.viewMode === 'comfortable') {
            // `showing-grid` or `showing-editor` will be set by `switchToMainView` or click handlers
        } else { 
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
    
    if (targetViewElement) {
        targetViewElement.classList.add("main-view-content-active");
    } else {
        if(notebooksContentDiv) notebooksContentDiv.classList.add("main-view-content-active"); 
    }
    
    applyCurrentViewMode(); 

    if (allNotesSearchContainer) {
        if ((viewName === 'notes' || viewName === 'favorites') && !core.currentlyViewedNotebookId) {
            allNotesSearchContainer.style.display = 'block';
        } else {
            allNotesSearchContainer.style.display = 'none';
            if (allNotesSearchInput) allNotesSearchInput.value = ''; 
            core.setCurrentSearchTerm(''); 
        }
    }

    if (viewName === 'notes') {
        if (core.themeSettings.viewMode === 'comfortable') {
            if (context === 'openNote' || context === 'newNoteComfortable') {
                notesContentDiv.classList.add('showing-editor');
                notesContentDiv.classList.remove('showing-grid');
                if(noteInteractionPanel) noteInteractionPanel.style.display = 'flex'; 
                if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'none'; 
                if(allNotesSearchContainer) allNotesSearchContainer.style.display = 'none'; 
                if(fabCreateNote) fabCreateNote.classList.add('hidden');
                if(fabNavigateBack) fabNavigateBack.classList.remove('hidden');
            } else { 
                notesContentDiv.classList.add('showing-grid');
                notesContentDiv.classList.remove('showing-editor');
                if(noteInteractionPanel) noteInteractionPanel.style.display = 'none'; 
                if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'flex'; 
                if(allNotesSearchContainer && !core.currentlyViewedNotebookId) allNotesSearchContainer.style.display = 'block'; 
                if(fabCreateNote) fabCreateNote.classList.remove('hidden');
                
                if (core.currentlyViewedNotebookId || core.currentFilterTag || core.isFavoritesViewActive) {
                    if (fabNavigateBack) fabNavigateBack.classList.remove('hidden');
                } else { 
                    if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
                }
            }
        } else { 
            notesContentDiv.classList.remove('showing-grid', 'showing-editor');
            if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'flex'; 
            if(noteInteractionPanel) noteInteractionPanel.style.display = 'flex'; 
            if(allNotesSearchContainer && !core.currentlyViewedNotebookId) allNotesSearchContainer.style.display = 'block';
            
            if (!core.currentlyViewedNotebookId && !core.currentFilterTag && !core.isFavoritesViewActive) {
                 if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
            } else {
                 if (fabNavigateBack) fabNavigateBack.classList.remove('hidden');
            }
        }
    } else if (viewName === 'notebooks' || viewName === 'settings' || viewName === 'trash') {
        if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        if (allNotesSearchContainer) allNotesSearchContainer.style.display = 'none';
        if (allNotesSearchInput) allNotesSearchInput.value = '';
        core.setCurrentSearchTerm('');
    }

    if (viewName === 'settings' && !document.querySelector('.settings-menu-item-active')) {
        switchToSettingsSection("admin"); 
    }
    if (viewName === 'notebooks') renderNotebooksOnPage(); 
    if (viewName === 'trash') {
        renderDeletedNotesList();
        if(fabCreateNote) fabCreateNote.classList.add('hidden');
    } else {
        if(fabCreateNote && !(notesContentDiv?.classList.contains('showing-editor') && core.themeSettings.viewMode === 'comfortable')) {
             if(fabCreateNote) fabCreateNote.classList.remove('hidden');
        } else if (fabCreateNote) {
             fabCreateNote.classList.add('hidden');
        }
    }
    if ((viewName === 'notes' || viewName === 'favorites')) {
        renderAllNotesPreviews();
    }
}

function renderNotebooksOnPage() {
    if (!notebooksPageListContainer || !notebooksPageNoNotebooksMessage) return;
    notebooksPageListContainer.innerHTML = ""; 
    const sortedNotebooks = [...core.localNotebooksCache].sort((a,b) => a.title.localeCompare(b.title));

    if (sortedNotebooks.length === 0) {
        notebooksPageNoNotebooksMessage.style.display = "block";
    } else {
        notebooksPageNoNotebooksMessage.style.display = "none";
    }
    sortedNotebooks.forEach(notebook => {
        const card = document.createElement('div');
        card.className = 'notebook-page-card';
        card.style.backgroundColor = notebook.coverColor || 'var(--default-notebook-cover-bg)';
        card.dataset.notebookId = notebook.id; 
        card.innerHTML = `
            <div class="notebook-page-card-accent-bar" style="background-color: ${shadeColor(notebook.coverColor || '#cccccc', -20)};"></div>
            <div class="notebook-page-card-title-container"><h3 class="notebook-page-card-title">${notebook.title}</h3></div>
            <div class="notebook-page-card-spacer"></div> <div class="notebook-page-card-icons">
                <span class="notebook-page-card-icon edit-notebook-icon-btn" title="Edit Notebook"><i class="fas fa-pencil-alt"></i></span>
                <span class="notebook-page-card-icon delete-notebook-icon-btn" title="Delete Notebook"><i class="fas fa-trash-alt"></i></span></div>`;
        card.addEventListener('click', (e) => {
            if (e.target.closest('.notebook-page-card-icon')) return;
            core.setCurrentlyViewedNotebookId(notebook.id); 
            core.setIsFavoritesViewActive(false); core.setCurrentFilterTag(null);
            clearInteractionPanel(true); 
            switchToMainView('notes'); 
            if (core.themeSettings.viewMode === 'comfortable') {
                notesContentDiv.classList.add('showing-grid'); 
                notesContentDiv.classList.remove('showing-editor');
                if(noteInteractionPanel) noteInteractionPanel.style.display = 'none'; 
                if(notesPreviewColumnOuter) notesPreviewColumnOuter.style.display = 'flex'; 
                if(fabCreateNote) fabCreateNote.classList.remove('hidden'); 
            }
            if (fabNavigateBack) fabNavigateBack.classList.remove('hidden'); 
            displayNotebookHeader(notebook.id); 
            core.setupNotesListenerAndLoadInitialBatch(); 
        });
        card.querySelector('.edit-notebook-icon-btn').addEventListener('click', (e) => { e.stopPropagation(); openEditNotebookModal(notebook.id); });
        card.querySelector('.delete-notebook-icon-btn').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteNotebook(notebook.id); });
        notebooksPageListContainer.appendChild(card);
    });
    const createCard = document.createElement('div');
    createCard.className = 'create-notebook-card';
    createCard.innerHTML = `<i class="fas fa-plus create-notebook-card-icon"></i><span class="create-notebook-card-text">Create Notebook</span>`;
    createCard.addEventListener('click', () => { if(createNotebookModal) { openCreateNotebookModal(); createNotebookModal.style.display = 'flex'; }});
    notebooksPageListContainer.appendChild(createCard); 
}

function applyThemeSettingsUI() {
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
    
    applyCurrentViewMode(); 
    renderTagsInSettings(); 
    renderNotebooksOnPage(); 
    renderDeletedNotesList();
}
function updateViewModeRadiosUI(){
    if (viewModeCompactRadio) viewModeCompactRadio.checked = core.themeSettings.viewMode === 'compact';
    if (viewModeComfortableRadio) viewModeComfortableRadio.checked = core.themeSettings.viewMode === 'comfortable';
}


function renderPaletteColorsUI() { 
    if (!paletteColorsContainer) return; 
    paletteColorsContainer.innerHTML = ''; 
    core.paletteColors.forEach((color, index) => { 
        const swatchWrapper = document.createElement('div'); 
        swatchWrapper.className = 'palette-color-swatch'; 
        swatchWrapper.style.backgroundColor = color; 
        swatchWrapper.title = `Use ${color}`; 
        swatchWrapper.addEventListener('click', () => { 
            if (editTagModal.style.display === 'flex' && etTagColorDisplay) { 
                currentSelectedColorForTagEdit = color; 
                etTagColorDisplay.value = color; 
                etTagColorDisplay.style.backgroundColor = color; 
                etTagColorDisplay.style.color = getTextColorForBackground(color); 
                editTagPaletteContainer.querySelectorAll('.palette-color-swatch').forEach(s => s.classList.remove('selected-for-tag-edit')); 
                const correspondingSwatch = Array.from(editTagPaletteContainer.querySelectorAll('.palette-color-swatch')).find(s => s.dataset.colorValue === color); 
                if(correspondingSwatch) correspondingSwatch.classList.add('selected-for-tag-edit'); 
            } else if (newPaletteColorPicker) { 
                newPaletteColorPicker.value = color; 
            } 
        }); 
        const initialPaletteColors = ["#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#fde047", "#facc15", "#eab308", "#f3f4f6"]; // Duplicated from core for now
        if (isPaletteEditMode && !initialPaletteColors.includes(color)) { 
            const deleteBtn = document.createElement('button'); 
            deleteBtn.innerHTML = '&times;'; 
            deleteBtn.className = 'delete-palette-color-btn'; 
            deleteBtn.title = `Remove ${color}`; 
            deleteBtn.onclick = async (e) => { 
                e.stopPropagation(); 
                const originalColor = core.paletteColors[index]; 
                core.paletteColors.splice(index, 1); 
                try { 
                    await core.saveAppSettings({ paletteColors: core.paletteColors });
                    renderPaletteColorsUI(); 
                    updatePaletteLimitMessageUI();
                } catch (err) { 
                    core.paletteColors.splice(index, 0, originalColor); 
                    renderPaletteColorsUI(); 
                    updatePaletteLimitMessageUI();
                } 
            }; 
            swatchWrapper.appendChild(deleteBtn); 
        } 
        paletteColorsContainer.appendChild(swatchWrapper); 
    }); 
    updatePaletteLimitMessageUI();
}

function updatePaletteLimitMessageUI() {
    if (paletteLimitMessage) {
        const limit = core.PALETTE_BASE_LIMIT + core.localNotebooksCache.length;
        paletteLimitMessage.textContent = `Palette colors: ${core.paletteColors.length} / ${limit}`;
    }
}

function switchToSettingsSection(sectionName) { 
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
    if (sectionName === 'export') {
        populateExportNotebookSelectorUI();
    }
}

function openCreateNotebookModal() {
    currentSelectedNotebookCoverColor_create = null; 
    if (cnNotebookCoverPaletteContainer) {
        cnNotebookCoverPaletteContainer.innerHTML = ''; 
        core.paletteColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'palette-color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.colorValue = color;
            swatch.addEventListener('click', () => {
                currentSelectedNotebookCoverColor_create = color;
                if(cnNotebookCoverColorDisplay) {
                    cnNotebookCoverColorDisplay.value = color;
                    cnNotebookCoverColorDisplay.style.backgroundColor = color;
                    cnNotebookCoverColorDisplay.style.color = getTextColorForBackground(color);
                }
                cnNotebookCoverPaletteContainer.querySelectorAll('.palette-color-swatch').forEach(s => s.classList.remove('selected-for-notebook-cover'));
                swatch.classList.add('selected-for-notebook-cover');
            });
            cnNotebookCoverPaletteContainer.appendChild(swatch);
        });
    }
    if(cnNotebookCoverColorDisplay) {
        cnNotebookCoverColorDisplay.value = "Default: First palette color";
        cnNotebookCoverColorDisplay.style.backgroundColor = "transparent";
        cnNotebookCoverColorDisplay.style.color = "";
    }
    if(createNotebookForm) createNotebookForm.reset(); 
}

function openEditNotebookModal(notebookId) {
    const notebook = core.localNotebooksCache.find(nb => nb.id === notebookId);
    if (!notebook) return;
    editingNotebookIdField.value = notebook.id;
    enNotebookTitleField.value = notebook.title;
    enNotebookPurposeField.value = notebook.purpose || '';
    currentSelectedNotebookCoverColor = notebook.coverColor || null; 

    if (enNotebookCoverPaletteContainer) {
        enNotebookCoverPaletteContainer.innerHTML = ''; 
        core.paletteColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'palette-color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.colorValue = color;
            if (color === currentSelectedNotebookCoverColor) {
                swatch.classList.add('selected-for-notebook-cover');
            }
            swatch.addEventListener('click', () => {
                currentSelectedNotebookCoverColor = color;
                if(enNotebookCoverColorDisplay) {
                    enNotebookCoverColorDisplay.value = color;
                    enNotebookCoverColorDisplay.style.backgroundColor = color;
                    enNotebookCoverColorDisplay.style.color = getTextColorForBackground(color);
                }
                enNotebookCoverPaletteContainer.querySelectorAll('.palette-color-swatch').forEach(s => s.classList.remove('selected-for-notebook-cover'));
                swatch.classList.add('selected-for-notebook-cover');
            });
            enNotebookCoverPaletteContainer.appendChild(swatch);
        });
    }
    if(enNotebookCoverColorDisplay) {
        if (currentSelectedNotebookCoverColor) {
            enNotebookCoverColorDisplay.value = currentSelectedNotebookCoverColor;
            enNotebookCoverColorDisplay.style.backgroundColor = currentSelectedNotebookCoverColor;
            enNotebookCoverColorDisplay.style.color = getTextColorForBackground(currentSelectedNotebookCoverColor);
        } else {
            enNotebookCoverColorDisplay.value = "No color selected";
            enNotebookCoverColorDisplay.style.backgroundColor = "transparent";
            enNotebookCoverColorDisplay.style.color = "";
        }
    }
    if(editNotebookModal) editNotebookModal.style.display = 'flex';
    enNotebookTitleField.focus();
}

function handleDeleteNotebook(notebookId) { 
    if (!notebookId) { alert("Cannot delete notebook: ID missing."); return; } 
    const notebookToDelete = core.localNotebooksCache.find(nb => nb.id === notebookId); 
    if (!notebookToDelete) { alert(`Error: Notebook to delete (ID: ${notebookId}) not found.`); return; } 
    core.setNotebookToDeleteGlobally({id: notebookId, name: notebookToDelete.title });
    if (notebookNameToDeleteDisplay) notebookNameToDeleteDisplay.textContent = notebookToDelete.title; 
    if (confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'flex'; 
}

function openConfirmNoteActionModal(type, noteId, notebookId, noteTitle, isDeletedNote = false) {
    core.setNoteActionContext({ type, id: noteId, notebookId, title: noteTitle || "(Untitled Note)", isDeletedNote });
    if (!confirmNoteActionModal || !confirmNoteActionTitle || !confirmNoteActionMessage || !confirmNoteActionWarning || !executeNoteActionBtn) return;
    if (type === 'deletePermanently') { 
        confirmNoteActionTitle.textContent = "Delete Note Permanently?";
        confirmNoteActionMessage.textContent = `Are you sure you want to permanently delete the note "${core.noteActionContext.title}"?`;
        confirmNoteActionWarning.textContent = "This action cannot be undone.";
        executeNoteActionBtn.textContent = "Delete Permanently";
        executeNoteActionBtn.className = "px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm";
        confirmNoteActionModal.style.display = 'flex';
    }
}
function closeConfirmNoteActionModal() {
    if (confirmNoteActionModal) confirmNoteActionModal.style.display = 'none';
    core.setNoteActionContext({ type: null, id: null, notebookId: null, title: null, isDeletedNote: false });
}

// More UI functions (renderAllNotesPreviews, renderTagsInSettings, etc.)
// will be adapted from the original app.js and placed here.
// They will use data from `core.localNotesCache`, `core.localTagsCache`, etc.
// and call core functions for actions.

function displayNotebookHeaderUI(notebookId) { 
    const notebook = core.localNotebooksCache.find(nb => nb.id === notebookId); 
    if (notebook && notebookHeaderDisplay) { 
        notebookHeaderDisplay.innerHTML = `<h3 class="text-lg font-semibold" style="color: var(--theme-bg-sidebar);">${notebook.title}</h3><p class="text-sm text-gray-600 mt-1">${notebook.purpose || 'No specific purpose defined.'}</p><div class="text-xs text-gray-500 mt-2"><span>${notebook.notesCount || 0} note(s)</span> | <span>Created: ${formatFullDateFromTimestamp(notebook.createdAt)}</span></div>`; 
        notebookHeaderDisplay.style.display = 'block'; 
    } else if (notebookHeaderDisplay) { 
        notebookHeaderDisplay.style.display = 'none'; 
    } 
}


function renderAllNotesPreviews() { 
    if(!notesListScrollableArea || !noNotesMessagePreviewEl || !allNotesPageTitle) return;
    
    const isCurrentlyShowingGrid = core.themeSettings.viewMode === 'comfortable' && notesContentDiv.classList.contains('showing-grid');
    const isCurrentlyShowingEditorComfortable = core.themeSettings.viewMode === 'comfortable' && notesContentDiv.classList.contains('showing-editor');

    if (isCurrentlyShowingEditorComfortable && !core.currentlyViewedNotebookId) {
        notesListScrollableArea.innerHTML = ''; 
        noNotesMessagePreviewEl.style.display = 'none';
        return;
    }

    notesListScrollableArea.innerHTML = ""; 
    let filteredNotesForDisplay = [...core.localNotesCache];

    if (core.currentSearchTerm) {
        filteredNotesForDisplay = core.localNotesCache.filter(note =>
            (note.title && note.title.toLowerCase().includes(core.currentSearchTerm)) ||
            (note.text && note.text.toLowerCase().includes(core.currentSearchTerm))
        );
    }
    
    if (core.currentlyViewedNotebookId) {
        const currentNb = core.localNotebooksCache.find(nb => nb.id === core.currentlyViewedNotebookId);
        if(allNotesPageTitle) allNotesPageTitle.textContent = `Notes in "${currentNb ? currentNb.title : 'Selected Notebook'}"`;
        displayNotebookHeaderUI(core.currentlyViewedNotebookId);
    } else if (core.currentFilterTag) {
        if(allNotesPageTitle) allNotesPageTitle.textContent = `Notes tagged: "${core.currentFilterTag}"`;
        if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none';
    } else if (core.isFavoritesViewActive) {
        if(allNotesPageTitle) allNotesPageTitle.textContent = "Favorite Notes";
        if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none';
    } else {
        if(allNotesPageTitle) allNotesPageTitle.textContent = "All Notes";
        if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none';
    }

    if (filteredNotesForDisplay.length === 0) { 
        if (core.currentSearchTerm && core.localNotesCache.length > 0) { 
             noNotesMessagePreviewEl.textContent = `No notes match your search for "${core.currentSearchTerm}".`;
        } else if (core.currentFilterTag) { noNotesMessagePreviewEl.textContent = `No notes with tag "${core.currentFilterTag}".`; 
        } else if (core.isFavoritesViewActive) { noNotesMessagePreviewEl.textContent = 'No favorite notes.'; 
        } else if (core.currentlyViewedNotebookId) { noNotesMessagePreviewEl.textContent = 'No notes in this notebook.'; 
        } else { noNotesMessagePreviewEl.textContent = 'No notes yet. Create one!'; }
        notesListScrollableArea.appendChild(noNotesMessagePreviewEl); 
        noNotesMessagePreviewEl.style.display = 'block'; 
        if (!core.isNewNoteSessionInPanel && !core.activelyCreatingNoteId && !core.currentInteractingNoteIdInPanel && core.themeSettings.viewMode === 'compact') {
            clearInteractionPanelUI(false); 
        }
        return; 
    } 
    noNotesMessagePreviewEl.style.display = 'none'; 
    
    filteredNotesForDisplay.sort((a,b) => (b.modifiedAt?.toMillis?.() || new Date(b.modifiedAt).getTime()) - (a.modifiedAt?.toMillis?.() || new Date(a.modifiedAt).getTime()));
    
    filteredNotesForDisplay.forEach(note => { 
        const notebook = core.localNotebooksCache.find(nb => nb.id === note.notebookId); 
        const previewEl = document.createElement('div'); 
        previewEl.className = 'note-preview-card'; 
        if (isCurrentlyShowingGrid) previewEl.classList.add('grid-card-style'); 
        else previewEl.classList.remove('grid-card-style');

        const isCurrentlyTheInteractingNote = core.currentInteractingNoteIdInPanel === note.id && !core.isNewNoteSessionInPanel ; 
        let noteBgColor = core.themeSettings.appDefaultBackgroundColor; 
        if (note.tags && note.tags.length > 0) { 
            const firstTagObject = core.localTagsCache.find(t => t.name === note.tags[0].name.toLowerCase()); 
            if (firstTagObject && firstTagObject.color) noteBgColor = firstTagObject.color; 
        } 
        previewEl.style.backgroundColor = ''; 
        const h4El = document.createElement('h4'); h4El.className = "font-semibold text-md"; 
        const pContentEl = document.createElement('p'); pContentEl.className = "text-xs mt-1 note-content-preview"; 
        const pNotebookEl = document.createElement('p'); pNotebookEl.className = "text-xs mt-1 note-preview-notebook-name"; 
        const noteActionsDiv = document.createElement('div'); noteActionsDiv.className = 'note-actions-container';
        const deleteDiv = document.createElement('div'); deleteDiv.className = 'delete-note-icon';
        const deleteIcon = document.createElement('i'); deleteIcon.className = 'fas fa-trash-alt';
        const favoriteDiv = document.createElement('div'); favoriteDiv.className = `favorite-star ${note.isFavorite ? 'is-favorite' : ''}`; 
        const favoriteIcon = document.createElement('i'); favoriteIcon.className = note.isFavorite ? 'fas fa-star' : 'far fa-star';
        
        if (isCurrentlyTheInteractingNote && core.themeSettings.viewMode === 'compact') { 
            previewEl.classList.add('selected'); 
            favoriteIcon.style.color = note.isFavorite ? '#FBBF24' : '#FFFFFF'; 
            deleteIcon.style.color = '#f87171'; 
        } else { 
            previewEl.classList.remove('selected'); 
            previewEl.style.backgroundColor = noteBgColor; 
            const calculatedTextColor = getTextColorForBackground(noteBgColor); 
            h4El.style.color = calculatedTextColor; 
            pContentEl.style.color = calculatedTextColor; 
            pNotebookEl.style.color = '#6b7280'; 
            favoriteIcon.style.color = note.isFavorite ? '#FBBF24' : '#a0aec0'; 
            deleteIcon.style.color = '#ef4444'; 
        } 
        previewEl.setAttribute('data-note-id', note.id); 
        let previewHTML = '<em>No content</em>'; 
        if (note.text && note.text.trim() !== "") { 
            const lines = note.text.split('\n'); 
            const maxLines = previewEl.classList.contains('grid-card-style') ? 5 : 3; 
            const linesToDisplay = lines.slice(0, maxLines); 
            previewHTML = linesToDisplay.map(line => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join('<br>'); 
            if (lines.length > maxLines) previewHTML += '...'; 
        } 
        h4El.textContent = note.title || '(Untitled Note)'; 
        pContentEl.innerHTML = previewHTML; 
        pNotebookEl.textContent = notebook ? notebook.title : 'Unknown'; 
        deleteDiv.appendChild(deleteIcon); favoriteDiv.appendChild(favoriteIcon); 
        noteActionsDiv.appendChild(deleteDiv); noteActionsDiv.appendChild(favoriteDiv); 
        previewEl.appendChild(h4El); previewEl.appendChild(pContentEl); previewEl.appendChild(pNotebookEl); previewEl.appendChild(noteActionsDiv); 
        
        previewEl.addEventListener('click', (e) => { 
            if (e.target.closest('.favorite-star') || e.target.closest('.delete-note-icon')) return; 
            if (core.themeSettings.viewMode === 'comfortable') {
                switchToMainView('notes', 'openNote'); 
                displayNoteInInteractionPanel(note.id);
            } else { 
                displayNoteInInteractionPanel(note.id); 
            }
        }); 
        favoriteDiv.addEventListener('click', async (e) => { 
            e.stopPropagation(); 
            const noteToToggle = core.localNotesCache.find(n => n.id === note.id); 
            if (noteToToggle) { 
                const newFavStatus = !noteToToggle.isFavorite; 
                try { 
                    const noteDocPath = `${core.userAppMemoirDocPath}/notebooks/${noteToToggle.notebookId}/notes/${note.id}`;
                    await core.updateDoc(core.doc(core.db, noteDocPath), { isFavorite: newFavStatus }); 
                } catch (err) { console.error("Error updating favorite:", err); } 
            } 
        }); 
        deleteDiv.addEventListener('click', (e) => { e.stopPropagation(); core.moveNoteToTrashImmediately(note.id, note.notebookId, note.title); });
        notesListScrollableArea.appendChild(previewEl); 
    }); 

    if (core.noMoreNotesToLoad && filteredNotesForDisplay.length > 0 && !core.currentSearchTerm) { 
        const endMessage = document.createElement('p');
        endMessage.className = 'text-center text-gray-400 py-4 text-sm';
        endMessage.textContent = 'End of notes.';
        notesListScrollableArea.appendChild(endMessage);
    }
}


function renderTagsInSettings() { 
    if(!settingsTagsListContainer || !settingsNoTagsMessage) return; 
    settingsTagsListContainer.innerHTML = ''; 
    if (core.localTagsCache.length === 0) { 
        settingsNoTagsMessage.style.display = 'block'; return; 
    } 
    settingsNoTagsMessage.style.display = 'none'; 
    core.localTagsCache.forEach(tagObj => { 
        const tagCard = document.createElement('div'); tagCard.className = 'tag-item-display'; 
        tagCard.dataset.tagName = tagObj.name; 
        const tagColor = tagObj.color || core.DEFAULT_TAG_COLOR; 
        const textColor = getTextColorForBackground(tagColor); 
        tagCard.style.backgroundColor = tagColor; 
        let notesWithThisTagCount = 0;
        if (core.localNotesCache && core.localNotesCache.length > 0) {
            notesWithThisTagCount = core.localNotesCache.filter(note => note.tags && note.tags.some(t => t.name === tagObj.name)).length;
        }
        tagCard.innerHTML = `
            <div class="tag-item-header"><h4 class="tag-name" style="color: ${textColor};">${tagObj.name}</h4><span class="tag-count" style="color: ${textColor};">(${notesWithThisTagCount} notes)</span></div>
            <p class="tag-purpose" style="color: ${textColor};">${tagObj.purpose || '<em>No purpose.</em>'}</p>
            <div class="tag-item-actions-icons">
                <button class="tag-action-icon edit-tag-icon-btn" data-tag-id="${tagObj.id}" title="Edit Tag"><i class="fas fa-pencil-alt"></i></button>
                <button class="tag-action-icon delete-tag-icon-btn" data-tag-id="${tagObj.id}" data-tag-name="${tagObj.name}" title="Delete Tag"><i class="fas fa-trash-alt"></i></button>
            </div>`; 
        tagCard.addEventListener('click', (e) => {
            if (e.target.closest('.tag-action-icon')) return; 
            core.setCurrentFilterTag(tagObj.name); 
            core.setCurrentlyViewedNotebookId(null); core.setIsFavoritesViewActive(false); 
            clearInteractionPanelUI(true); switchToMainView('notes'); 
            core.setupNotesListenerAndLoadInitialBatch(); 
        });
        tagCard.querySelector('.edit-tag-icon-btn').addEventListener('click', (e) => { e.stopPropagation(); openEditTagModal(tagObj.id); }); 
        tagCard.querySelector('.delete-tag-icon-btn').addEventListener('click', (e) => { e.stopPropagation(); openConfirmDeleteTagModalFromCard(tagObj.id, tagObj.name);});
        settingsTagsListContainer.appendChild(tagCard); 
    }); 
}

function renderDeletedNotesList() {
    if (!deletedNotesListContainer || !noDeletedNotesMessage || !emptyTrashBtn) return;
    deletedNotesListContainer.innerHTML = '';
    if (core.localDeletedNotesCache.length === 0) {
        noDeletedNotesMessage.style.display = 'block'; emptyTrashBtn.disabled = true; return;
    }
    noDeletedNotesMessage.style.display = 'none'; emptyTrashBtn.disabled = false;
    core.localDeletedNotesCache.forEach(deletedNote => {
        const card = document.createElement('div'); card.className = 'deleted-note-card'; 
        card.style.backgroundColor = core.themeSettings.appDefaultBackgroundColor;
        const textColor = getTextColorForBackground(core.themeSettings.appDefaultBackgroundColor);
        let previewHTML = '<em>No content</em>';
        if (deletedNote.text && deletedNote.text.trim() !== "") {
            const lines = deletedNote.text.split('\n'); const maxLines = 1; 
            const linesToDisplay = lines.slice(0, maxLines);
            previewHTML = linesToDisplay.map(line => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join('<br>');
            if (lines.length > maxLines) previewHTML += '...';
        }
        card.innerHTML = `
            <div><h4 class="font-semibold" style="color: ${textColor};">${deletedNote.title || '(Untitled Note)'}</h4><p class="note-content-preview" style="color: ${textColor};">${previewHTML}</p></div>
            <div class="deleted-note-info-container"><span class="deleted-note-original-notebook">From: ${deletedNote.originalNotebookName || 'N/A'}</span><span class="deleted-note-timestamp">Deleted: ${formatDateFromTimestamp(deletedNote.deletedAt)}</span></div>
            <div class="note-actions-container"><div class="restore-note-icon" title="Restore Note"><i class="fas fa-trash-restore-alt"></i></div><div class="permanent-delete-note-icon" title="Delete Permanently"><i class="fas fa-eraser"></i></div></div>`;
        card.querySelector('.restore-note-icon').addEventListener('click', (e) => { e.stopPropagation(); handleRestoreNoteUI(deletedNote.id); });
        card.querySelector('.permanent-delete-note-icon').addEventListener('click', (e) => { e.stopPropagation(); openConfirmNoteActionModal('deletePermanently', deletedNote.id, null, deletedNote.title, true); });
        deletedNotesListContainer.appendChild(card);
    });
}

function updateNoteInfoPanelUI(note) {
    if (!noteInfoPanelContainer) return;
    if (!note || (!note.tags?.length && !note.createdAt && !note.activity?.trim() && (!note.edits || note.edits.length === 0))) {
        noteInfoPanelContainer.style.display = 'none'; return;
    }
    noteInfoPanelContainer.style.display = 'block';
    if (note.tags && note.tags.length > 0) {
        noteInfoTags.style.display = 'block';
        noteInfoTagsValue.textContent = note.tags.map(t => t.name).join(', ');
    } else { noteInfoTags.style.display = 'none'; }
    if (note.createdAt) {
        noteInfoCreated.style.display = 'block';
        noteInfoCreatedValue.textContent = (note.createdAt === 'PENDING_SAVE') ? '(Will be set on first save)' : formatFullDateFromTimestamp(note.createdAt);
    } else { noteInfoCreated.style.display = 'none'; }
    if (note.activity && note.activity.trim() !== '') {
        noteInfoActivity.style.display = 'block';
        noteInfoActivityValue.textContent = note.activity;
    } else { noteInfoActivity.style.display = 'none'; }
    noteInfoEditsList.innerHTML = ''; 
    if (note.edits && note.edits.length > 0) {
        noteInfoEditsContainer.style.display = 'block';
        const sortedEdits = [...note.edits].sort((a, b) => (a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime()) - (b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime()));
        sortedEdits.forEach(edit => {
            const editEntryDiv = document.createElement('div'); editEntryDiv.className = 'note-info-edit-entry mb-1';
            const dateLine = document.createElement('div'); dateLine.innerHTML = `<strong>On:</strong> ${formatDateFromTimestamp(edit.timestamp)}`;
            editEntryDiv.appendChild(dateLine);
            const changesLine = document.createElement('div');
            let descriptionText = edit.description && edit.description.trim() !== '' ? edit.description : '(No description provided)';
            changesLine.innerHTML = `<span class="italic">${descriptionText}</span>`;
            editEntryDiv.appendChild(changesLine);
            noteInfoEditsList.appendChild(editEntryDiv);
        });
    } else { noteInfoEditsContainer.style.display = 'none'; }
}

function renderTagPillsInPanelUI() {
    if (!noteTagsContainer_panel || !noteTagsInputField_panel) return;
    const pills = noteTagsContainer_panel.querySelectorAll('.tag-pill');
    pills.forEach(pill => pill.remove());
    core.currentNoteTagsArrayInPanel.forEach(tagName => {
        const tagPill = document.createElement('span');
        tagPill.className = 'tag-pill inline-flex items-center mr-1 mb-1'; 
        tagPill.textContent = tagName;
        const tagData = core.localTagsCache.find(t => t.name === tagName.toLowerCase());
        const tagColor = tagData?.color || core.DEFAULT_TAG_COLOR; 
        const textColor = getTextColorForBackground(tagColor);
        tagPill.style.backgroundColor = tagColor; tagPill.style.color = textColor;
        tagPill.style.padding = '0.125rem 0.5rem'; tagPill.style.borderRadius = '9999px'; 
        tagPill.style.fontSize = '0.75rem'; tagPill.style.lineHeight = '1rem';
        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-pill-remove ml-1.5 cursor-pointer'; removeBtn.innerHTML = '&times;';
        removeBtn.style.opacity = '0.7';
        removeBtn.onmouseover = () => removeBtn.style.opacity = '1';
        removeBtn.onmouseout = () => removeBtn.style.opacity = '0.7';
        removeBtn.addEventListener('click', () => {
            core.setCurrentNoteTagsArrayInPanel(core.currentNoteTagsArrayInPanel.filter(t => t !== tagName));
            renderTagPillsInPanelUI(); 
            core.debouncedHandleInteractionPanelInputChange(); 
        });
        tagPill.appendChild(removeBtn);
        noteTagsContainer_panel.insertBefore(tagPill, noteTagsInputField_panel); 
    });
    noteTagsInputField_panel.value = ''; 
}

function updatePanelNotebookSelectorUI() {
    if(!panelNotebookSelector) return;
    const currentSelection = panelNotebookSelector.value; 
    panelNotebookSelector.innerHTML = ''; 
    if (core.localNotebooksCache.length === 0) { 
        const option = document.createElement('option'); option.value = ""; option.textContent = "No notebooks"; option.disabled = true; panelNotebookSelector.appendChild(option); 
    } else { 
        core.localNotebooksCache.forEach(nb => { const option = document.createElement('option'); option.value = nb.id; option.textContent = nb.title; panelNotebookSelector.appendChild(option); }); 
    } 
    if (core.currentOpenNotebookIdForPanel) panelNotebookSelector.value = core.currentOpenNotebookIdForPanel; 
    else if (currentSelection && core.localNotebooksCache.some(nb => nb.id === currentSelection)) panelNotebookSelector.value = currentSelection; 
    else if (core.localNotebooksCache.length > 0) panelNotebookSelector.value = core.localNotebooksCache[0].id; 
}


// --- Interaction Panel Logic ---
// (Includes calls to core logic for data, and direct UI updates)

async function processInteractionPanelEditsOnDeselectUI(isSwitchingContext = false) { 
    if (core.currentInteractingNoteIdInPanel && !core.isNewNoteSessionInPanel) {
        await core.saveCurrentEditDescription(); 
    }
    
    core.setCurrentEditSessionEntryId(null);
    core.setCurrentEditSessionOpenTimePanel(null);
    if(interactionPanelEditsMadeInputField) interactionPanelEditsMadeInputField.value = ''; 
    if(interactionPanelCurrentEditSessionContainer) interactionPanelCurrentEditSessionContainer.style.display = 'none';
    
    let noteBeingProcessedId = core.currentInteractingNoteIdInPanel || core.activelyCreatingNoteId; 
    if (core.isNewNoteSessionInPanel && !noteBeingProcessedId) { 
        if (noteTitleInputField_panel.value.trim() === "" && noteTextInputField_panel.value.trim() === "") return; 
    }

    if (core.activelyCreatingNoteId && noteBeingProcessedId === core.activelyCreatingNoteId) {
        const tempNote = core.localNotesCache.find(n => n.id === noteBeingProcessedId); // This might be slightly delayed from Firestore
        // A better check might be against the input fields directly if the note is truly new and not yet in localNotesCache
        const titleIsEmpty = noteTitleInputField_panel.value.trim() === "";
        const textIsEmpty = noteTextInputField_panel.value.trim() === "";
        const activityIsEmpty = !interactionPanelActivityInputField || interactionPanelActivityInputField.value.trim() === "";

        if (titleIsEmpty && textIsEmpty && activityIsEmpty) {
             if(isSwitchingContext){ 
                try {
                    // Find the actual notebookId used for creation, which is currentOpenNotebookIdForPanel
                    const notebookIdForDeletion = tempNote ? tempNote.notebookId : core.currentOpenNotebookIdForPanel;
                    if (notebookIdForDeletion) {
                        const tempNoteDocPath = `${core.userAppMemoirDocPath}/notebooks/${notebookIdForDeletion}/notes/${noteBeingProcessedId}`;
                        await core.deleteDoc(core.doc(core.db, tempNoteDocPath));
                        const notebookDocPath = `${core.userAppMemoirDocPath}/notebooks/${notebookIdForDeletion}`;
                        const notebookRef = core.doc(core.db, notebookDocPath);
                        const notebookSnap = await core.getDoc(notebookRef);
                        if (notebookSnap.exists()) {
                            await core.updateDoc(notebookRef, { notesCount: Math.max(0, (notebookSnap.data().notesCount || 0) - 1) });
                        }
                        // Tag cleanup for tempNote if it existed and had tags
                        if (tempNote && tempNote.tags && tempNote.tags.length > 0) {
                            for (const tag of tempNote.tags) await core.checkAndCleanupOrphanedTag(tag.name);
                        }
                    }
                } catch (e) { console.error("Error deleting empty new note:", e); }
                core.setActivelyCreatingNoteId(null); 
                return; 
             }
        }
    }
}

function clearInteractionPanelUI(processEdits = true) { 
    if (processEdits) processInteractionPanelEditsOnDeselectUI(true); 
    if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'none'; 
    if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'flex'; 
    if(interactionPanelForm) interactionPanelForm.reset(); 
    
    core.setCurrentInteractingNoteIdInPanel(null); 
    core.setIsNewNoteSessionInPanel(false); 
    core.setActivelyCreatingNoteId(null); 
    core.setCurrentEditSessionOpenTimePanel(null); 
    core.setCurrentEditSessionEntryId(null); 
    core.setCurrentOpenNotebookIdForPanel(null); 
    core.setCurrentInteractingNoteOriginalNotebookId(null); 
    core.setCurrentNoteTagsArrayInPanel([]);
    renderTagPillsInPanelUI(); 

    if (lastSelectedNotePreviewElement) { 
        lastSelectedNotePreviewElement.classList.remove('selected'); 
        const deselectedNoteId = lastSelectedNotePreviewElement.dataset.noteId;
        const deselectedNoteData = core.localNotesCache.find(n => n.id === deselectedNoteId);
        if (deselectedNoteData) {
            let noteBgColor = core.themeSettings.appDefaultBackgroundColor;
            if (deselectedNoteData.tags && deselectedNoteData.tags.length > 0) {
                const firstTagObject = core.localTagsCache.find(t => t.name === deselectedNoteData.tags[0].name.toLowerCase());
                if (firstTagObject && firstTagObject.color) noteBgColor = firstTagObject.color;
            }
            lastSelectedNotePreviewElement.style.backgroundColor = noteBgColor;
            const calculatedTextColor = getTextColorForBackground(noteBgColor);
            const h4El = lastSelectedNotePreviewElement.querySelector('h4');
            const pContentEl = lastSelectedNotePreviewElement.querySelector('.note-content-preview');
            const pNotebookEl = lastSelectedNotePreviewElement.querySelector('.note-preview-notebook-name');
            if(h4El) h4El.style.color = calculatedTextColor;
            if(pContentEl) pContentEl.style.color = calculatedTextColor;
            if(pNotebookEl) pNotebookEl.style.color = '#6b7280';
            const favStarDiv = lastSelectedNotePreviewElement.querySelector('.favorite-star');
             if (favStarDiv) {
                const favIcon = favStarDiv.querySelector('i');
                if (favIcon) {
                    favStarDiv.classList.toggle('is-favorite', deselectedNoteData.isFavorite || false);
                    favIcon.className = deselectedNoteData.isFavorite ? 'fas fa-star' : 'far fa-star';
                    favIcon.style.color = deselectedNoteData.isFavorite ? '#FBBF24' : '#a0aec0';
                }
            }
            const delIcon = lastSelectedNotePreviewElement.querySelector('.delete-note-icon i');
            if (delIcon) delIcon.style.color = '#ef4444';
        }
        lastSelectedNotePreviewElement = null; 
    } 
    if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; 
    if(panelNotebookSelectorContainer) panelNotebookSelectorContainer.style.display = 'none'; 
    updateNoteInfoPanelUI(null); 
}

// ... (Other UI functions like setupPanelForNewNote, displayNoteInInteractionPanel)
// These will be more complex as they involve both setting UI and calling core logic to get data or update state.

function setupPanelForNewNote(notebookId, notebookName) { 
    if (core.currentInteractingNoteIdInPanel || core.isNewNoteSessionInPanel || core.activelyCreatingNoteId) {
        processInteractionPanelEditsOnDeselectUI(true); 
    }
    clearInteractionPanelUI(false); 

    core.setIsNewNoteSessionInPanel(true); 
    core.setActivelyCreatingNoteId(null); 
    core.setCurrentInteractingNoteIdInPanel(null); 
    core.setCurrentOpenNotebookIdForPanel(notebookId); 
    core.setCurrentInteractingNoteOriginalNotebookId(null); 
    core.setCurrentEditSessionOpenTimePanel(null); 
    core.setCurrentEditSessionEntryId(null); 
    core.setCurrentNoteTagsArrayInPanel([]); 

    if(interactionPanelForm) interactionPanelForm.reset(); 
    updatePanelNotebookSelectorUI(); // Uses core.currentOpenNotebookIdForPanel
    if(panelNotebookSelectorContainer) panelNotebookSelectorContainer.style.display = 'block'; 
    if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; 
    
    if (panelCreationTimeContainer) {
        if (isAdminModeEnabled) { 
            panelCreationTimeContainer.style.display = 'block';
            if(interactionPanelCreationTimeDisplayField) {
                interactionPanelCreationTimeDisplayField.textContent = formatFullDateFromTimestamp(new Date()); 
                interactionPanelCreationTimeDisplayField.style.display = 'flex';
            }
            if(interactionPanelCreationTimeInputsContainer) interactionPanelCreationTimeInputsContainer.style.display = 'none';
        } else { panelCreationTimeContainer.style.display = 'none'; }
    }
    if(panelActivityContainer) panelActivityContainer.style.display = 'block';
    if(interactionPanelActivityInputField) {
        interactionPanelActivityInputField.style.display = 'block';
        interactionPanelActivityInputField.value = '';
    }
    if(interactionPanelActivityDisplayField) interactionPanelActivityDisplayField.style.display = 'none';
    if(interactionPanelCurrentEditSessionContainer) interactionPanelCurrentEditSessionContainer.style.display = 'none'; 
    if(interactionPanelEditsMadeInputField) interactionPanelEditsMadeInputField.value = ''; 
    
    renderTagPillsInPanelUI(); 
    updateNoteInfoPanelUI({ createdAt: 'PENDING_SAVE', activity: '', tags: [], edits: [] }); 
    
    if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'none';
    if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'flex'; 
    if(noteTitleInputField_panel) noteTitleInputField_panel.focus();

    core.setLastSavedNoteTitleInPanel("");
    core.setLastSavedNoteTextInPanel("");
    core.setLastSavedNoteTagsInPanel("");
    core.setLastSavedNoteActivityInPanel("");
}

function displayNoteInInteractionPanel(noteId, forceFocusToTitle = true) { 
    const previousInteractingNoteId = core.currentInteractingNoteIdInPanel;
    const isActuallySwitchingNotes = previousInteractingNoteId !== noteId;

    if (isActuallySwitchingNotes && ((core.currentInteractingNoteIdInPanel && core.currentInteractingNoteIdInPanel !== noteId) || core.isNewNoteSessionInPanel) ) {
        processInteractionPanelEditsOnDeselectUI(true); 
    }
    
    const noteToEdit = core.localNotesCache.find(n => n.id === noteId); 
    if (!noteToEdit) { clearInteractionPanelUI(false); return; } 
    
    core.setIsNewNoteSessionInPanel(false); 
    core.setCurrentInteractingNoteIdInPanel(noteId); 
    core.setCurrentInteractingNoteOriginalNotebookId(noteToEdit.notebookId); 
    core.setCurrentOpenNotebookIdForPanel(noteToEdit.notebookId); 
    
    if (isActuallySwitchingNotes) { 
        core.setCurrentEditSessionOpenTimePanel(null); 
        core.setCurrentEditSessionEntryId(null); 
        if(interactionPanelEditsMadeInputField) interactionPanelEditsMadeInputField.value = ''; 
        if(interactionPanelCurrentEditSessionContainer) interactionPanelCurrentEditSessionContainer.style.display = 'none'; 
    }

    core.setLastSavedNoteTitleInPanel(noteToEdit.title || "");
    core.setLastSavedNoteTextInPanel(noteToEdit.text || "");
    core.setCurrentNoteTagsArrayInPanel((noteToEdit.tags || []).map(tagObj => tagObj.name));
    core.setLastSavedNoteTagsInPanel(core.currentNoteTagsArrayInPanel.slice().sort().join(','));
    core.setLastSavedNoteActivityInPanel(noteToEdit.activity || '');

    if(noteTitleInputField_panel) {
        const newTitle = noteToEdit.title || "";
        if (document.activeElement !== noteTitleInputField_panel || isActuallySwitchingNotes) { 
            if (noteTitleInputField_panel.value !== newTitle) noteTitleInputField_panel.value = newTitle;
        }
    }
    if(noteTextInputField_panel) {
        const newText = noteToEdit.text || "";
         if (document.activeElement !== noteTextInputField_panel || isActuallySwitchingNotes) { 
            if (noteTextInputField_panel.value !== newText) noteTextInputField_panel.value = newText;
        }
        if (!core.isNewNoteSessionInPanel && core.currentInteractingNoteIdInPanel) { 
            const oldListener = noteTextInputField_panel._handleFirstMainEditListener;
            if (oldListener) noteTextInputField_panel.removeEventListener('input', oldListener);
            const handleFirstMainEdit = () => {
                if (core.currentInteractingNoteIdInPanel === noteId && !core.currentEditSessionOpenTimePanel) { 
                    if(interactionPanelCurrentEditSessionContainer) interactionPanelCurrentEditSessionContainer.style.display = 'block';
                    core.setCurrentEditSessionOpenTimePanel(new Date()); 
                    core.setCurrentEditSessionEntryId(null); 
                    if(interactionPanelEditsMadeInputField) interactionPanelEditsMadeInputField.value = ''; 
                }
            };
            if (isActuallySwitchingNotes || !core.currentEditSessionOpenTimePanel) { 
                 if(interactionPanelCurrentEditSessionContainer && interactionPanelCurrentEditSessionContainer.style.display === 'none'){
                    noteTextInputField_panel.addEventListener('input', handleFirstMainEdit, { once: true });
                    noteTextInputField_panel._handleFirstMainEditListener = handleFirstMainEdit;
                 }
            } else if (interactionPanelCurrentEditSessionContainer && core.currentEditSessionOpenTimePanel) {
                 interactionPanelCurrentEditSessionContainer.style.display = 'block';
            }
        } else if (interactionPanelCurrentEditSessionContainer) {
             interactionPanelCurrentEditSessionContainer.style.display = 'none'; 
        }
    }
    renderTagPillsInPanelUI(); 
    updatePanelNotebookSelectorUI(); 
    if(panelNotebookSelectorContainer) panelNotebookSelectorContainer.style.display = 'block'; 
    if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; 
    
    if (panelCreationTimeContainer) {
        if (isAdminModeEnabled) { 
            panelCreationTimeContainer.style.display = 'block';
            const creationDate = noteToEdit.createdAt instanceof core.Timestamp ? noteToEdit.createdAt.toDate() : new Date(noteToEdit.createdAt);
            if(interactionPanelCreationTimeDisplayField) interactionPanelCreationTimeDisplayField.style.display = 'none';
            if(interactionPanelCreationTimeInputsContainer) interactionPanelCreationTimeInputsContainer.style.display = 'flex';
            if(interactionPanelCreationDateInputField) interactionPanelCreationDateInputField.value = !isNaN(creationDate) ? creationDate.toISOString().split('T')[0] : '';
            if(interactionPanelCreationTimeInputField_time) interactionPanelCreationTimeInputField_time.value = !isNaN(creationDate) ? creationDate.toTimeString().split(' ')[0].substring(0,5) : '';
        } else { panelCreationTimeContainer.style.display = 'none'; }
    }
    if(panelActivityContainer) {
        if (isAdminModeEnabled) { 
            panelActivityContainer.style.display = 'block';
            if(interactionPanelActivityDisplayField) interactionPanelActivityDisplayField.style.display = 'none';
            if(interactionPanelActivityInputField) {
                interactionPanelActivityInputField.style.display = 'block'; 
                const newActivity = noteToEdit.activity || '';
                if (document.activeElement !== interactionPanelActivityInputField) { 
                    if(interactionPanelActivityInputField.value !== newActivity) interactionPanelActivityInputField.value = newActivity;
                }
            }
        } else { panelActivityContainer.style.display = 'none'; }
    }
    updateNoteInfoPanelUI(noteToEdit); 
    if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'none'; 
    if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'flex'; 
    if (forceFocusToTitle && noteTitleInputField_panel && document.activeElement !== noteTitleInputField_panel) { 
        noteTitleInputField_panel.focus();
    }

    if (lastSelectedNotePreviewElement && lastSelectedNotePreviewElement.dataset.noteId !== noteId) { 
        const deselectedNoteId = lastSelectedNotePreviewElement.dataset.noteId;
        const deselectedNoteData = core.localNotesCache.find(n => n.id === deselectedNoteId);
        lastSelectedNotePreviewElement.classList.remove('selected'); 
        if (deselectedNoteData) {
            let noteBgColor = core.themeSettings.appDefaultBackgroundColor;
            if (deselectedNoteData.tags && deselectedNoteData.tags.length > 0) {
                const firstTagObject = core.localTagsCache.find(t => t.name === deselectedNoteData.tags[0].name.toLowerCase());
                if (firstTagObject && firstTagObject.color) noteBgColor = firstTagObject.color;
            }
            lastSelectedNotePreviewElement.style.backgroundColor = noteBgColor; 
            const calculatedTextColor = getTextColorForBackground(noteBgColor);
            const h4El = lastSelectedNotePreviewElement.querySelector('h4');
            const pContentEl = lastSelectedNotePreviewElement.querySelector('.note-content-preview');
            const pNotebookEl = lastSelectedNotePreviewElement.querySelector('.note-preview-notebook-name');
            if (h4El) h4El.style.color = calculatedTextColor;
            if (pContentEl) pContentEl.style.color = calculatedTextColor;
            if (pNotebookEl) pNotebookEl.style.color = '#6b7280'; 
            const favStarDiv = lastSelectedNotePreviewElement.querySelector('.favorite-star');
            if (favStarDiv) {
                const favIcon = favStarDiv.querySelector('i');
                if (favIcon) {
                    favStarDiv.classList.toggle('is-favorite', deselectedNoteData.isFavorite || false);
                    favIcon.className = deselectedNoteData.isFavorite ? 'fas fa-star' : 'far fa-star';
                    favIcon.style.color = deselectedNoteData.isFavorite ? '#FBBF24' : '#a0aec0';
                }
            }
            const delIcon = lastSelectedNotePreviewElement.querySelector('.delete-note-icon i');
            if (delIcon) delIcon.style.color = '#ef4444'; 
        } else { /* ... reset to default if no data ... */ }
    }
    const currentPreviewEl = document.querySelector(`.note-preview-card[data-note-id="${noteId}"]`);
    if (currentPreviewEl) {
        if (core.themeSettings.viewMode === 'compact') { 
            currentPreviewEl.style.backgroundColor = ''; 
            const h4Selected = currentPreviewEl.querySelector('h4');
            const pContentSelected = currentPreviewEl.querySelector('.note-content-preview');
            const pNotebookSelected = currentPreviewEl.querySelector('.note-preview-notebook-name');
            if(h4Selected) h4Selected.style.color = ''; if(pContentSelected) pContentSelected.style.color = ''; if(pNotebookSelected) pNotebookSelected.style.color = '';
            currentPreviewEl.classList.add('selected'); 
        } else { currentPreviewEl.classList.remove('selected'); }
        const favoriteIconSelected = currentPreviewEl.querySelector('.favorite-star i');
        const deleteIconSelected = currentPreviewEl.querySelector('.delete-note-icon i');
        const favStarDivSelected = currentPreviewEl.querySelector('.favorite-star');
        if (favStarDivSelected && favoriteIconSelected) {
            favStarDivSelected.classList.toggle('is-favorite', noteToEdit.isFavorite || false);
            favoriteIconSelected.className = noteToEdit.isFavorite ? 'fas fa-star' : 'far fa-star';
            favoriteIconSelected.style.color = currentPreviewEl.classList.contains('selected') ? (noteToEdit.isFavorite ? '#FBBF24' : '#FFFFFF') : (noteToEdit.isFavorite ? '#FBBF24' : '#a0aec0');
        }
        if (deleteIconSelected) deleteIconSelected.style.color = currentPreviewEl.classList.contains('selected') ? '#f87171' : '#ef4444'; 
        lastSelectedNotePreviewElement = currentPreviewEl;
        if (core.themeSettings.viewMode === 'compact') currentPreviewEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function populateExportNotebookSelectorUI() {
    if (!exportNotebookSelector) return;
    exportNotebookSelector.innerHTML = ''; 
    if (core.localNotebooksCache.length === 0) {
        const option = document.createElement('option');
        option.value = ""; option.textContent = "No notebooks to export"; option.disabled = true;
        exportNotebookSelector.appendChild(option);
        if (exportNotebookBtn) exportNotebookBtn.disabled = true;
    } else {
        core.localNotebooksCache.forEach(notebook => {
            const option = document.createElement('option');
            option.value = notebook.id; option.textContent = notebook.title;
            exportNotebookSelector.appendChild(option);
        });
        if (exportNotebookBtn) exportNotebookBtn.disabled = false;
    }
    if (exportStatusMessage) exportStatusMessage.textContent = '';
}

function handleRestoreNoteUI(deletedNoteId) {
    const noteData = core.localDeletedNotesCache.find(dn => dn.id === deletedNoteId);
    if (!noteData) { alert("Error: Deleted note not found."); return; }
    core.setNoteToRestoreWithOptions(noteData);

    const originalNotebookExists = core.localNotebooksCache.some(nb => nb.id === noteData.originalNotebookId);

    if (originalNotebookExists) {
        core.handleRestoreNote(deletedNoteId, noteData.originalNotebookId);
    } else {
        if (restoreNoteOptionsMessage) restoreNoteOptionsMessage.textContent = `The original notebook "${noteData.originalNotebookName || 'Unknown'}" for this note no longer exists.`;
        if (restoreToNewNotebookBtn) restoreToNewNotebookBtn.textContent = `Create new notebook "${noteData.originalNotebookName || 'Restored Notes'}" and restore here`;
        if (restoreToExistingNotebookSelector) {
            restoreToExistingNotebookSelector.innerHTML = '';
            if (core.localNotebooksCache.length > 0) {
                core.localNotebooksCache.forEach(nb => {
                    const option = document.createElement('option'); option.value = nb.id; option.textContent = nb.title;
                    restoreToExistingNotebookSelector.appendChild(option);
                });
                restoreToExistingNotebookSelector.disabled = false; restoreToSelectedNotebookBtn.disabled = false;
            } else {
                const option = document.createElement('option'); option.textContent = "No existing notebooks";
                restoreToExistingNotebookSelector.appendChild(option);
                restoreToExistingNotebookSelector.disabled = true; restoreToSelectedNotebookBtn.disabled = true;
            }
        }
        if (restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'flex';
    }
}

function openConfirmDeleteTagModalFromCard(tagId, tagName) {
    if (!tagId || !tagName) { console.error("Tag ID or name missing for deletion."); return; }
    core.setTagToDeleteGlobally({ id: tagId, name: tagName });
    if (tagNameToDeleteDisplay) tagNameToDeleteDisplay.textContent = tagName;
    if (confirmTagDeleteModal) confirmTagDeleteModal.style.display = 'flex';
}

function closeEditTagModal() { 
    if(editTagModal) editTagModal.style.display = 'none'; 
    if(editTagForm) editTagForm.reset(); 
    // Reset core state if needed: editingOriginalTagNameField.value = ''; editingTagIdField.value = '';
    if (deleteTagBtn) deleteTagBtn.disabled = false; 
    currentSelectedColorForTagEdit = core.DEFAULT_TAG_COLOR;
}

function closeConfirmTagDeleteModal() { 
    if (confirmTagDeleteModal) confirmTagDeleteModal.style.display = 'none'; 
    if (deleteTagBtn) deleteTagBtn.disabled = false; 
    core.setTagToDeleteGlobally({ id: null, name: null });
}


// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign all DOM elements
    loadingOverlay = document.getElementById('loadingOverlay');
    appSidebar = document.getElementById('appSidebar');
    mainContentArea = document.querySelector('.main-content-area');
    hamburgerBtn = document.getElementById('hamburgerBtn');
    sidebarNotebooksPageBtn = document.getElementById('sidebarNotebooksPageBtn');
    sidebarSettingsBtn = document.getElementById('sidebarSettingsBtn');
    sidebarAllNotesBtn = document.getElementById('sidebarAllNotesBtn');
    sidebarFavoritesBtn = document.getElementById('sidebarFavoritesBtn');
    sidebarTrashBtn = document.getElementById('sidebarTrashBtn');
    notebooksContentDiv = document.getElementById('notebooks-content');
    notesContentDiv = document.getElementById('notes-content');
    settingsContentDiv = document.getElementById('settings-content');
    trashContentDiv = document.getElementById('trash-content');
    notebooksPageListContainer = document.getElementById('notebooksPageListContainer');
    notebooksPageNoNotebooksMessage = document.getElementById('notebooksPageNoNotebooksMessage');
    createNotebookModal = document.getElementById('createNotebookModal');
    closeCreateNotebookModalBtn = document.getElementById('closeCreateNotebookModalBtn');
    cancelNotebookCreationBtn = document.getElementById('cancelNotebookCreationBtn');
    createNotebookForm = document.getElementById('createNotebookForm');
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

    // Initialize currentSelectedColorForTagEdit after core.DEFAULT_TAG_COLOR is available
    currentSelectedColorForTagEdit = core.DEFAULT_TAG_COLOR;


    // Set up UI refresh callbacks for core logic
    core.setUIRefreshCallbacks({
        renderAllNotesPreviews,
        renderNotebooksOnPage,
        renderTagsInSettings,
        renderDeletedNotesList,
        updatePanelNotebookSelector: updatePanelNotebookSelectorUI,
        displayNotebookHeader: displayNotebookHeaderUI,
        applyThemeSettings: applyThemeSettingsUI,
        updateViewModeRadios: updateViewModeRadiosUI,
        renderPaletteColors: renderPaletteColorsUI,
        updatePaletteLimitMessage: updatePaletteLimitMessageUI,
        updateNoteInfoPanel: updateNoteInfoPanelUI,
        renderTagPillsInPanel: renderTagPillsInPanelUI,
        switchToMainView,
        clearInteractionPanel: clearInteractionPanelUI,
        populateExportNotebookSelector: populateExportNotebookSelectorUI,
        hideLoadingOverlay,
        showLoadingOverlay,
    });

    // Initialize core data listeners
    core.initializeDataListeners();

    // --- Initial UI Setup ---
    const fixedSidebarWidth = '7rem'; 
    if (appSidebar && mainContentArea) {
        appSidebar.style.width = fixedSidebarWidth;
        mainContentArea.style.marginLeft = fixedSidebarWidth;
        if (hamburgerBtn) hamburgerBtn.style.display = 'none'; 
    }
    
    // --- UI Event Listeners ---
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
    
    if (fabNavigateBack) fabNavigateBack.addEventListener('click', () => {
        // Re-evaluate this logic based on where the user is coming from
        if (core.themeSettings.viewMode === 'comfortable' && notesContentDiv.classList.contains('showing-editor')) {
            switchToMainView('notes', null); // Go back to grid view
        } else if (core.currentlyViewedNotebookId) { 
            core.setCurrentlyViewedNotebookId(null);
            switchToMainView('notebooks'); 
        } else if (core.currentFilterTag || core.isFavoritesViewActive) {
            core.setCurrentFilterTag(null);
            core.setIsFavoritesViewActive(false);
            switchToMainView('notes'); // Go to all notes
            core.setupNotesListenerAndLoadInitialBatch();
        } else {
            switchToMainView(core.themeSettings.defaultHomepage || 'notebooks'); // Default back
        }
    });

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
    
    themeColorInputs.forEach(input => { 
        input.addEventListener('input', core.debounce(async (event) => { 
            const key = event.target.dataset.themeKey; 
            const value = event.target.value; 
            core.themeSettings[key] = value; // Directly modify themeSettings from core
            applyThemeSettingsUI(); 
            await core.saveAppSettings({ activeThemeColors: {
                appDefaultBackgroundColor: core.themeSettings.appDefaultBackgroundColor,
                themeSidebarBg: core.themeSettings.themeSidebarBg,
                themeButtonPrimary: core.themeSettings.themeButtonPrimary,
                themeBorderAccent: core.themeSettings.themeBorderAccent
            }, defaultHomepage: core.themeSettings.defaultHomepage, viewMode: core.themeSettings.viewMode });
        }, 250)); 
    });
    
    if(defaultHomepageSelector) defaultHomepageSelector.addEventListener('change', async (event) => {
        core.themeSettings.defaultHomepage = event.target.value; 
        await core.saveAppSettings({ defaultHomepage: core.themeSettings.defaultHomepage });
    });

    if(viewModeCompactRadio) viewModeCompactRadio.addEventListener('change', async () => {
        if (viewModeCompactRadio.checked) {
            core.themeSettings.viewMode = 'compact';
            await core.saveAppSettings({ viewMode: 'compact' });
            applyCurrentViewMode();
            if (notesContentDiv.classList.contains('main-view-content-active')) core.setupNotesListenerAndLoadInitialBatch(); 
        }
    });
    if(viewModeComfortableRadio) viewModeComfortableRadio.addEventListener('change', async () => {
        if (viewModeComfortableRadio.checked) {
            core.themeSettings.viewMode = 'comfortable';
            await core.saveAppSettings({ viewMode: 'comfortable' });
            applyCurrentViewMode();
            if (notesContentDiv.classList.contains('main-view-content-active')) core.setupNotesListenerAndLoadInitialBatch(); 
        }
    });

    if (resetThemeBtn) resetThemeBtn.addEventListener('click', () => { if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'flex'; });
    if (closeConfirmThemeResetModalBtn) closeConfirmThemeResetModalBtn.addEventListener('click', () => { if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none'; });
    if (cancelThemeResetBtn) cancelThemeResetBtn.addEventListener('click', () => { if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none'; });
    if (executeThemeResetBtn) executeThemeResetBtn.addEventListener('click', async () => {
        showLoadingOverlay("Resetting theme...");
        const initialSettings = { // Re-declare or get from core
            themeSidebarBg: "#047857", themeButtonPrimary: "#10b981", 
            themeBorderAccent: "#34d399", appDefaultBackgroundColor: "#f0fdfa",
            defaultHomepage: "notebooks", viewMode: "compact" 
        };
        const initialPalette = ["#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#fde047", "#facc15", "#eab308", "#f3f4f6"];
        const initialDefaultColors = [ "#047857", "#10b981", "#34d399", "#f0fdfa"];

        await core.saveAppSettings({ 
            activeThemeColors: { ...initialSettings }, 
            defaultThemeColors: [...initialDefaultColors], 
            paletteColors: [...initialPalette], 
            defaultHomepage: initialSettings.defaultHomepage,
            viewMode: initialSettings.viewMode 
        }); // This will trigger snapshot and UI update via core's listener
        if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none';
        // hideLoadingOverlay() will be called by the snapshot listener in core
    });

    if (addPaletteColorBtn && newPaletteColorPicker) { 
        addPaletteColorBtn.addEventListener('click', async () => { 
            const paletteLimit = core.PALETTE_BASE_LIMIT + core.localNotebooksCache.length;
            if (core.paletteColors.length >= paletteLimit) { alert(`Color palette limit reached (${paletteLimit} colors).`); return; }
            const newColor = newPaletteColorPicker.value; 
            if (newColor && !core.paletteColors.includes(newColor)) { 
                core.paletteColors.push(newColor); 
                try { 
                    await core.saveAppSettings({ paletteColors: core.paletteColors }); 
                    renderPaletteColorsUI(); 
                    newPaletteColorPicker.value = "#000000"; 
                } catch (e) { core.paletteColors.pop(); updatePaletteLimitMessageUI(); } 
            } else if (core.paletteColors.includes(newColor)) { alert("Color already in palette."); } 
        }); 
    }
    if (editPaletteBtn) editPaletteBtn.addEventListener('click', () => { isPaletteEditMode = !isPaletteEditMode; editPaletteBtn.textContent = isPaletteEditMode ? 'Done Editing' : 'Edit Palette'; renderPaletteColorsUI(); });
    
    settingsMenuItems.forEach(item => item.addEventListener('click', () => switchToSettingsSection(item.dataset.settingSection)));

    if (closeCreateNotebookModalBtn) closeCreateNotebookModalBtn.addEventListener('click', () => { if(createNotebookModal) createNotebookModal.style.display = 'none'; if(createNotebookForm) createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null; });
    if (cancelNotebookCreationBtn) cancelNotebookCreationBtn.addEventListener('click', () => { if(createNotebookModal) createNotebookModal.style.display = 'none'; if(createNotebookForm) createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null; });
    if (createNotebookForm) createNotebookForm.addEventListener('submit', async (event) => { 
        event.preventDefault(); 
        let finalCoverColor = currentSelectedNotebookCoverColor_create;
        if (!finalCoverColor && core.paletteColors.length > 0) finalCoverColor = core.paletteColors[0]; 
        else if (!finalCoverColor) finalCoverColor = 'var(--default-notebook-cover-bg)'; 
        const newNotebook = { 
            userId: core.PLACEHOLDER_USER_ID, 
            title: cnNotebookTitleField.value.trim() || "Untitled Notebook", 
            purpose: cnNotebookPurposeField.value.trim(), 
            createdAt: core.serverTimestamp(), notesCount: 0, coverColor: finalCoverColor 
        }; 
        await core.createNotebook(newNotebook);
        if(createNotebookModal) createNotebookModal.style.display = 'none'; 
        createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null;
    });

    if(closeEditNotebookModalBtn_notebook) closeEditNotebookModalBtn_notebook.addEventListener('click', () => { if(editNotebookModal) editNotebookModal.style.display = 'none'; if(editNotebookForm) editNotebookForm.reset(); currentSelectedNotebookCoverColor = null; }); 
    if (cancelNotebookEditBtn) cancelNotebookEditBtn.addEventListener('click', () => { if(editNotebookModal) editNotebookModal.style.display = 'none'; if(editNotebookForm) editNotebookForm.reset(); currentSelectedNotebookCoverColor = null; });
    if (editNotebookForm) editNotebookForm.addEventListener('submit', async (event) => {
        event.preventDefault(); showLoadingOverlay("Saving notebook...");
        const notebookId = editingNotebookIdField.value;
        if (!notebookId) { hideLoadingOverlay(); return; }
        const updates = {
            title: enNotebookTitleField.value.trim() || "Untitled Notebook",
            purpose: enNotebookPurposeField.value.trim(),
            coverColor: currentSelectedNotebookCoverColor 
        };
        await core.updateNotebook(notebookId, updates);
        currentSelectedNotebookCoverColor = null; 
        if(editNotebookModal) editNotebookModal.style.display = 'none';
        editNotebookForm.reset(); hideLoadingOverlay();
    });
    
    if (closeConfirmNotebookDeleteModalBtn) closeConfirmNotebookDeleteModalBtn.addEventListener('click', () => { if(confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'none'; core.setNotebookToDeleteGlobally({ id: null, name: null }); });
    if (cancelNotebookDeletionBtn) cancelNotebookDeletionBtn.addEventListener('click', () => { if(confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'none'; core.setNotebookToDeleteGlobally({ id: null, name: null }); });
    if (executeNotebookDeletionBtn) executeNotebookDeletionBtn.addEventListener('click', async () => { 
        if (core.notebookToDeleteGlobally.id && core.notebookToDeleteGlobally.name) { 
            await core.performActualNotebookDeletion(core.notebookToDeleteGlobally.id, core.notebookToDeleteGlobally.name); 
        } 
        if(confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'none'; core.setNotebookToDeleteGlobally({ id: null, name: null });
    });
    
    if (closeConfirmNoteActionModalBtn) closeConfirmNoteActionModalBtn.addEventListener('click', closeConfirmNoteActionModal);
    if (cancelNoteActionBtn) cancelNoteActionBtn.addEventListener('click', closeConfirmNoteActionModal);
    if (executeNoteActionBtn) executeNoteActionBtn.addEventListener('click', async () => { await core.performActualNoteAction(); closeConfirmNoteActionModal(); });

    if (closeEditTagModalBtn_tag) closeEditTagModalBtn_tag.addEventListener('click', closeEditTagModal);
    if (cancelEditTagBtn) cancelEditTagBtn.addEventListener('click', closeEditTagModal);
    if (editTagForm) editTagForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const tagId = editingTagIdField.value; 
        const originalName = editingOriginalTagNameField.value; 
        const newName = etTagNameField.value.trim().toLowerCase(); 
        const newColor = currentSelectedColorForTagEdit; 
        const newPurpose = etTagPurposeField.value.trim(); 
        if (!newName) { alert("Tag name cannot be empty."); return; } 
        if (newName !== originalName && core.localTagsCache.some(t => t.name === newName && t.id !== tagId)) { alert(`Tag "${newName}" already exists.`); return; } 
        await core.saveTagChanges(tagId, originalName, newName, newColor, newPurpose);
        closeEditTagModal();
    });
    if (deleteTagBtn) deleteTagBtn.addEventListener('click', () => {
        if (deleteTagBtn && deleteTagBtn.disabled) return; 
        const tagId = editingTagIdField.value; const tagName = editingOriginalTagNameField.value; 
        if (!tagId || !tagName) return; 
        core.setTagToDeleteGlobally({ id: tagId, name: tagName });
        if(deleteTagBtn) deleteTagBtn.disabled = true; 
        if (tagNameToDeleteDisplay) tagNameToDeleteDisplay.textContent = tagName; 
        if (confirmTagDeleteModal) confirmTagDeleteModal.style.display = 'flex';
    });
    if (closeConfirmTagDeleteModalBtn) closeConfirmTagDeleteModalBtn.addEventListener('click', closeConfirmTagDeleteModal);
    if (cancelTagDeletionBtn) cancelTagDeletionBtn.addEventListener('click', closeConfirmTagDeleteModal);
    if (executeTagDeletionBtn) executeTagDeletionBtn.addEventListener('click', async () => { 
        if (core.tagToDeleteGlobally.id && core.tagToDeleteGlobally.name) {
            await core.performActualTagDeletion(core.tagToDeleteGlobally.id, core.tagToDeleteGlobally.name);
        }
        closeConfirmTagDeleteModal(); closeEditTagModal(); 
    });

    if(noteTitleInputField_panel) noteTitleInputField_panel.addEventListener('input', core.debouncedHandleInteractionPanelInputChange);
    if(noteTextInputField_panel) noteTextInputField_panel.addEventListener('input', core.debouncedHandleInteractionPanelInputChange);
    if(interactionPanelActivityInputField) interactionPanelActivityInputField.addEventListener('input', () => {if(isAdminModeEnabled || core.isNewNoteSessionInPanel || core.activelyCreatingNoteId === core.currentInteractingNoteIdInPanel) core.debouncedHandleInteractionPanelInputChange()});
    if(interactionPanelCreationDateInputField) interactionPanelCreationDateInputField.addEventListener('input', () => {if(isAdminModeEnabled) core.debouncedHandleInteractionPanelInputChange();});
    if(interactionPanelCreationTimeInputField_time) interactionPanelCreationTimeInputField_time.addEventListener('input', () => {if(isAdminModeEnabled) core.debouncedHandleInteractionPanelInputChange();});
    if(interactionPanelEditsMadeInputField) interactionPanelEditsMadeInputField.addEventListener('input', core.debouncedSaveEditDescription);

    if (adminModeToggle) adminModeToggle.addEventListener('change', () => { 
        isAdminModeEnabled = adminModeToggle.checked; 
        if (core.currentInteractingNoteIdInPanel && !core.isNewNoteSessionInPanel) {
            displayNoteInInteractionPanel(core.currentInteractingNoteIdInPanel, false);
        } else if (core.isNewNoteSessionInPanel && !core.currentInteractingNoteIdInPanel) {
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
        if (!notesContentDiv.classList.contains('main-view-content-active')) switchToMainView('notes'); 
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
                    core.currentNoteTagsArrayInPanel.push(newTagName); // Modify core's array
                    await core.updateGlobalTagsFromNoteInput([newTagName]); 
                    renderTagPillsInPanelUI();
                    core.debouncedHandleInteractionPanelInputChange();
                }
                noteTagsInputField_panel.value = '';
            } else if (event.key === 'Backspace' && noteTagsInputField_panel.value === '' && core.currentNoteTagsArrayInPanel.length > 0) {
                event.preventDefault();
                core.currentNoteTagsArrayInPanel.pop(); renderTagPillsInPanelUI(); core.debouncedHandleInteractionPanelInputChange();
            }
        });
        noteTagsInputField_panel.addEventListener('blur', () => {
            const newTagName = noteTagsInputField_panel.value.trim().toLowerCase();
            if (newTagName) {
                if (core.currentNoteTagsArrayInPanel.length >= 5 && !core.currentNoteTagsArrayInPanel.includes(newTagName)) { alert("Max 5 tags."); } 
                else if (!core.currentNoteTagsArrayInPanel.includes(newTagName)) {
                    core.currentNoteTagsArrayInPanel.push(newTagName);
                    core.updateGlobalTagsFromNoteInput([newTagName]).then(() => { renderTagPillsInPanelUI(); core.debouncedHandleInteractionPanelInputChange(); });
                } else { core.debouncedHandleInteractionPanelInputChange(); }
            } else { core.debouncedHandleInteractionPanelInputChange(); }
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
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob); link.download = filename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
            exportStatusMessage.textContent = `Exported "${exportData.title}" successfully!`; exportStatusMessage.style.color = 'var(--theme-bg-button-primary)';
        } catch (error) {
            console.error("Error exporting notebook:", error);
            exportStatusMessage.textContent = "Error exporting notebook."; exportStatusMessage.style.color = 'red';
        } finally { exportNotebookBtn.disabled = false; }
    });

    // Global modal click listeners
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

    // Initial UI state that might depend on core data already being somewhat initialized by listeners
    // For example, if defaultHomepage is 'notes', core.initializeDataListeners will call setupNotesListenerAndLoadInitialBatch.
    // This renderAllNotesPreviews() is a fallback or reinforcement.
    if (core.themeSettings.defaultHomepage === 'notes' || core.themeSettings.defaultHomepage === 'favorites') {
        // This is now handled by the onSnapshot callback in core.initializeDataListeners -> appSettings
    } else if (notebooksContentDiv && core.themeSettings.defaultHomepage === 'notebooks') {
        renderNotebooksOnPage();
    }
    renderTagsInSettings(); // Render based on initial empty or loaded cache
    clearInteractionPanelUI(false); // Ensure panel is initially clear

}); // End DOMContentLoaded
