
// START OF JAVASCRIPT CODE (app.js)
// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { 
    getFirestore, collection, collectionGroup, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, 
    query, where, onSnapshot, orderBy, serverTimestamp, Timestamp, writeBatch, runTransaction, limit, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"; 

// ==========================================================================================
// Your web app's Firebase configuration
// ==========================================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAY7KNDAumnpPEFQXAJuYeu2Kpw1tkDC30", // Replace with your actual API key if needed
    authDomain: "ac-notebook-test.firebaseapp.com",
    projectId: "ac-notebook-test",
    storageBucket: "ac-notebook-test.appspot.com", 
    messagingSenderId: "665546838164",
    appId: "1:665546838164:web:5be5cb5f7ae60dc8d3e481",
    measurementId: "G-KB3MYMNTQC"
};
// ==========================================================================================
// END OF FIREBASE CONFIGURATION
// ==========================================================================================


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // --- DATA STORAGE ---
    let localNotebooksCache = []; 
    let localNotesCache = []; 
    let localTagsCache = []; 
    let localDeletedNotesCache = [];
    
    const initialDefaultThemeColors = [ 
        "#047857", // Sidebar BG (emerald-700)
        "#10b981", // Button Primary (emerald-500)
        "#34d399", // Border Accent (emerald-400)
        "#f0fdfa", // App Default BG / Note BG (emerald-50)
    ];
    
    const initialThemeSettings = { 
        themeSidebarBg: initialDefaultThemeColors[0],
        themeButtonPrimary: initialDefaultThemeColors[1],
        themeBorderAccent: initialDefaultThemeColors[2],
        appDefaultBackgroundColor: initialDefaultThemeColors[3],
        defaultHomepage: "notebooks" 
    };
    
    const initialPaletteColors = ["#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#fde047", "#facc15", "#eab308", "#f3f4f6"]; 
    
    let themeSettings = { ...initialThemeSettings }; 
    let paletteColors = [...initialPaletteColors]; 
    let defaultThemeColorsFromDB = [...initialDefaultThemeColors];

    let DEFAULT_TAG_COLOR = themeSettings.appDefaultBackgroundColor; 
    let currentSelectedColorForTagEdit = DEFAULT_TAG_COLOR; 
    let currentSelectedNotebookCoverColor = null; 
    let currentSelectedNotebookCoverColor_create = null; 


    let currentOpenNotebookIdForPanel = null; 
    let currentInteractingNoteIdInPanel = null; 
    let currentInteractingNoteOriginalNotebookId = null; 
    let isNewNoteSessionInPanel = false; 
    let activelyCreatingNoteId = null; 


    
    let currentEditSessionOpenTimePanel = null; 
    let lastSelectedNotePreviewElement = null;
    let isAdminModeEnabled = false;
    let currentlyViewedNotebookId = null; 
    let currentFilterTag = null; 
    let tagToDeleteGlobally = { id: null, name: null }; 
    let notebookToDeleteGlobally = { id: null, name: null }; 
    let noteActionContext = { type: null, id: null, notebookId: null, title: null, isDeletedNote: false }; 
    let noteToRestoreWithOptions = null; 


    let isFavoritesViewActive = false; 
    let isPaletteEditMode = false;
    
    const PALETTE_BASE_LIMIT = 15;
    let initialViewDetermined = false; 
    let hasUserStartedEditingCurrentNoteText = false;

    let lastSavedNoteTextInPanel = "";
    let lastSavedNoteTitleInPanel = "";
    let lastSavedNoteTagsInPanel = ""; 
    let lastSavedNoteActivityInPanel = "";
    let currentNoteTagsArrayInPanel = []; 


    // Unsubscribe functions
    let unsubscribeNotebooks = null;
    let unsubscribeNotes = null;
    let unsubscribeTags = null;
    let unsubscribeAppSettings = null;
    let unsubscribeDeletedNotes = null;


    // --- DOM ELEMENTS ---
    const loadingOverlay = document.getElementById('loadingOverlay');
    const appSidebar = document.getElementById('appSidebar');
    const mainContentArea = document.querySelector('.main-content-area'); 
    const hamburgerBtn = document.getElementById('hamburgerBtn'); 
    const sidebarNotebooksPageBtn = document.getElementById('sidebarNotebooksPageBtn'); 
    const sidebarSettingsBtn = document.getElementById('sidebarSettingsBtn');
    const sidebarAllNotesBtn = document.getElementById('sidebarAllNotesBtn');
    const sidebarFavoritesBtn = document.getElementById('sidebarFavoritesBtn'); 
    const sidebarTrashBtn = document.getElementById('sidebarTrashBtn');
    
    const notebooksContentDiv = document.getElementById('notebooks-content'); 
    const notesContentDiv = document.getElementById('notes-content');       
    const settingsContentDiv = document.getElementById('settings-content'); 
    const trashContentDiv = document.getElementById('trash-content');

    const notebooksPageListContainer = document.getElementById('notebooksPageListContainer');
    const notebooksPageNoNotebooksMessage = document.getElementById('notebooksPageNoNotebooksMessage');

    const createNotebookModal = document.getElementById('createNotebookModal');
    const closeCreateNotebookModalBtn = document.getElementById('closeCreateNotebookModalBtn');
    const cancelNotebookCreationBtn = document.getElementById('cancelNotebookCreationBtn');
    const createNotebookForm = document.getElementById('createNotebookForm');
    const cnNotebookTitleField = document.getElementById('cnNotebookTitleField');
    const cnNotebookPurposeField = document.getElementById('cnNotebookPurposeField');
    const cnNotebookCoverPaletteContainer = document.getElementById('cnNotebookCoverPaletteContainer');
    const cnNotebookCoverColorDisplay = document.getElementById('cnNotebookCoverColorDisplay');
    
    const editNotebookModal = document.getElementById('editNotebookModal');
    const closeEditNotebookModalBtn_notebook = document.getElementById('closeEditNotebookModalBtn'); 
    const cancelNotebookEditBtn = document.getElementById('cancelNotebookEditBtn');
    const editNotebookForm = document.getElementById('editNotebookForm');
    const editingNotebookIdField = document.getElementById('editingNotebookIdField');
    const enNotebookTitleField = document.getElementById('enNotebookTitleField');
    const enNotebookPurposeField = document.getElementById('enNotebookPurposeField');
    const enNotebookCoverPaletteContainer = document.getElementById('enNotebookCoverPaletteContainer');
    const enNotebookCoverColorDisplay = document.getElementById('enNotebookCoverColorDisplay');
    
    const editTagModal = document.getElementById('editTagModal');
    const closeEditTagModalBtn_tag = editTagModal ? editTagModal.querySelector('#closeEditTagModalBtn') : null; 
    const cancelEditTagBtn = document.getElementById('cancelEditTagBtn');
    const editTagForm = document.getElementById('editTagForm');
    const editingOriginalTagNameField = document.getElementById('editingOriginalTagNameField');
    const editingTagIdField = document.getElementById('editingTagIdField'); 
    const etTagNameField = document.getElementById('etTagNameField');
    const editTagPaletteContainer = document.getElementById('editTagPaletteContainer'); 
    const etTagColorDisplay = document.getElementById('etTagColorDisplay'); 
    const etTagPurposeField = document.getElementById('etTagPurposeField');
    const deleteTagBtn = document.getElementById('deleteTagBtn'); 
    const confirmTagDeleteModal = document.getElementById('confirmTagDeleteModal');
    const closeConfirmTagDeleteModalBtn = document.getElementById('closeConfirmTagDeleteModalBtn');
    const tagNameToDeleteDisplay = document.getElementById('tagNameToDeleteDisplay');
    const cancelTagDeletionBtn = document.getElementById('cancelTagDeletionBtn');
    const executeTagDeletionBtn = document.getElementById('executeTagDeletionBtn');
    
    const confirmNotebookDeleteModal = document.getElementById('confirmNotebookDeleteModal');
    const closeConfirmNotebookDeleteModalBtn = document.getElementById('closeConfirmNotebookDeleteModalBtn');
    const notebookNameToDeleteDisplay = document.getElementById('notebookNameToDeleteDisplay');
    const cancelNotebookDeletionBtn = document.getElementById('cancelNotebookDeletionBtn');
    const executeNotebookDeletionBtn = document.getElementById('executeNotebookDeletionBtn');

    const confirmNoteActionModal = document.getElementById('confirmNoteActionModal');
    const confirmNoteActionTitle = document.getElementById('confirmNoteActionTitle');
    const confirmNoteActionMessage = document.getElementById('confirmNoteActionMessage');
    const confirmNoteActionWarning = document.getElementById('confirmNoteActionWarning');
    const closeConfirmNoteActionModalBtn = document.getElementById('closeConfirmNoteActionModalBtn');
    const cancelNoteActionBtn = document.getElementById('cancelNoteActionBtn');
    const executeNoteActionBtn = document.getElementById('executeNoteActionBtn');


    const confirmThemeResetModal = document.getElementById('confirmThemeResetModal');
    const closeConfirmThemeResetModalBtn = document.getElementById('closeConfirmThemeResetModalBtn');
    const cancelThemeResetBtn = document.getElementById('cancelThemeResetBtn');
    const executeThemeResetBtn = document.getElementById('executeThemeResetBtn');


    const defaultHomepageSelector = document.getElementById('defaultHomepageSelector'); 
    const themeColorInputs = document.querySelectorAll('.theme-color-input');
    const paletteColorsContainer = document.getElementById('paletteColorsContainer');
    const newPaletteColorPicker = document.getElementById('newPaletteColorPicker');
    const addPaletteColorBtn = document.getElementById('addPaletteColorBtn');
    const resetThemeBtn = document.getElementById('resetThemeBtn');
    const editPaletteBtn = document.getElementById('editPaletteBtn');
    const paletteLimitMessage = document.getElementById('paletteLimitMessage');


    const allNotesPageTitle = document.getElementById('allNotesPageTitle');
    const notebookHeaderDisplay = document.getElementById('notebookHeaderDisplay'); 
    const notesListScrollableArea = document.getElementById('notesListScrollableArea'); 
    const noNotesMessagePreviewEl = document.getElementById('noNotesMessage');
    const noteInteractionPanel = document.getElementById('noteInteractionPanel'); 
    const noteInteractionPanelPlaceholder = document.getElementById('noteInteractionPanelPlaceholder'); 
    const noteInteractionFormContainer = document.getElementById('noteInteractionFormContainer'); 
    const interactionPanelForm = document.getElementById('interactionPanelForm');  
    const noteTitleInputField_panel = document.getElementById('noteTitleInputField_panel'); 
    const noteTextInputField_panel = document.getElementById('noteTextInputField_panel'); 
    const noteTagsContainer_panel = document.getElementById('noteTagsContainer_panel'); 
    const noteTagsInputField_panel = document.getElementById('noteTagsInputField_panel'); 
    const panelNotebookSelectorContainer = document.getElementById('panelNotebookSelectorContainer');
    const panelNotebookSelector = document.getElementById('panelNotebookSelector');
    const notebookChangeConfirmationEl = document.getElementById('notebookChangeConfirmation');
    const panelCreationTimeContainer = document.getElementById('panelCreationTimeContainer');
    const interactionPanelCreationTimeDisplayField = document.getElementById('interactionPanelCreationTimeDisplayField'); 
    const interactionPanelCreationTimeInputsContainer = document.getElementById('interactionPanelCreationTimeInputsContainer');
    const interactionPanelCreationDateInputField = document.getElementById('interactionPanelCreationDateInputField'); 
    const interactionPanelCreationTimeInputField_time = document.getElementById('interactionPanelCreationTimeInputField_time'); 
    const panelActivityContainer = document.getElementById('panelActivityContainer');
    const interactionPanelActivityDisplayField = document.getElementById('interactionPanelActivityDisplayField'); 
    const interactionPanelActivityInputField = document.getElementById('interactionPanelActivityInputField'); 
    const interactionPanelCurrentEditSessionContainer = document.getElementById('interactionPanelCurrentEditSessionContainer');  
    const interactionPanelEditsMadeInputField = document.getElementById('interactionPanelEditsMadeInputField'); 
    
    const noteInfoPanelContainer = document.getElementById('noteInfoPanelContainer');
    const noteInfoTags = document.getElementById('noteInfoTags');
    const noteInfoTagsValue = document.getElementById('noteInfoTagsValue');
    const noteInfoCreated = document.getElementById('noteInfoCreated');
    const noteInfoCreatedValue = document.getElementById('noteInfoCreatedValue');
    const noteInfoActivity = document.getElementById('noteInfoActivity');
    const noteInfoActivityValue = document.getElementById('noteInfoActivityValue');
    const noteInfoEditsContainer = document.getElementById('noteInfoEditsContainer');
    const noteInfoEditsList = document.getElementById('noteInfoEditsList');

    const settingsMenuItems = document.querySelectorAll('.settings-menu-item');
    const settingsContentSections = document.querySelectorAll('.settings-content-section');
    const settingsTagsListContainer = document.getElementById('settingsTagsListContainer'); 
    const settingsNoTagsMessage = document.getElementById('settingsNoTagsMessage');
    const adminModeToggle = document.getElementById('adminModeToggle');
    const fabCreateNote = document.getElementById('fabCreateNote');
    const fabNavigateBack = document.getElementById('fabNavigateBack'); 

    // Trash View Elements
    const deletedNotesListContainer = document.getElementById('deletedNotesListContainer');
    const noDeletedNotesMessage = document.getElementById('noDeletedNotesMessage');
    const emptyTrashBtn = document.getElementById('emptyTrashBtn');

    // Restore Options Modal Elements
    const restoreNoteWithOptionsModal = document.getElementById('restoreNoteWithOptionsModal');
    const closeRestoreNoteWithOptionsModalBtn = document.getElementById('closeRestoreNoteWithOptionsModalBtn');
    const restoreNoteOptionsMessage = document.getElementById('restoreNoteOptionsMessage');
    const restoreToNewNotebookBtn = document.getElementById('restoreToNewNotebookBtn');
    const restoreToExistingNotebookSelector = document.getElementById('restoreToExistingNotebookSelector');
    const restoreToSelectedNotebookBtn = document.getElementById('restoreToSelectedNotebookBtn');
    const cancelRestoreWithOptionsBtn = document.getElementById('cancelRestoreWithOptionsBtn');

    // Empty Trash Confirmation Modal Elements
    const confirmEmptyTrashModal = document.getElementById('confirmEmptyTrashModal');
    const closeConfirmEmptyTrashModalBtn = document.getElementById('closeConfirmEmptyTrashModalBtn');
    const cancelEmptyTrashBtn = document.getElementById('cancelEmptyTrashBtn');
    const executeEmptyTrashBtn = document.getElementById('executeEmptyTrashBtn');

    // Export Settings Elements
    const exportNotebookSelector = document.getElementById('exportNotebookSelector');
    const exportNotebookBtn = document.getElementById('exportNotebookBtn');
    const exportStatusMessage = document.getElementById('exportStatusMessage');


    // --- HELPER FUNCTIONS ---
    function showLoadingOverlay(message = "Loading...") { if(loadingOverlay) { loadingOverlay.innerHTML = `<i class="fas fa-spinner fa-spin fa-2x mr-3"></i> ${message}`; loadingOverlay.classList.remove('hidden');} }
    function hideLoadingOverlay() { if(loadingOverlay) loadingOverlay.classList.add('hidden'); }
    function getTimeOfDay(date) { return date.getHours()>=5&&date.getHours()<12?"Morning":date.getHours()>=12&&date.getHours()<17?"Afternoon":date.getHours()>=17&&date.getHours()<21?"Evening":"Night"; }
    function formatDateFromTimestamp(timestamp) { 
        if (!timestamp) return "N/A"; 
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp)); 
        if (isNaN(date.getTime())) return "N/A"; 
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
     function formatFullDateFromTimestamp(timestamp) { 
        if (!timestamp) return "N/A";
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp));
        if (isNaN(date.getTime())) return "N/A";
        const t=date.toLocaleDateString(undefined,{month:"long"}),e=date.getDate(),o=date.getFullYear(),n=date.toLocaleDateString(undefined,{weekday:"long"}),a=getTimeOfDay(date).toLowerCase();let i=date.getHours();const r=i>=12?"PM":"AM";return i%=12,i||(i=12),`${t} ${e},${o} ${n} ${a} at ${i}:${date.getMinutes().toString().padStart(2,"0")} ${r}`
    }
    function debounce(func, delay) { let t;return(...e)=>{clearTimeout(t),t=setTimeout(()=>func.apply(this,e),delay)}}
    
    function switchToMainView(viewName) { 
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
            console.error("Target content for view not found:", viewName, ". Defaulting to notebooks.");
            if(notebooksContentDiv) notebooksContentDiv.classList.add("main-view-content-active"); 
        }

        // Hide back button for main navigation views or when in "All Notes" (no specific notebook)
        if (viewName === 'notebooks' || viewName === 'settings' || viewName === 'trash' || 
            (viewName === 'notes' && !currentlyViewedNotebookId && !currentFilterTag && !isFavoritesViewActive) || 
            (viewName === 'favorites' && !currentlyViewedNotebookId && !currentFilterTag) ) { // Added favorites here
            if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        }


        if (viewName === 'settings' && !document.querySelector('.settings-menu-item-active')) {
            switchToSettingsSection("admin"); 
        }
        if (viewName === 'notebooks') { 
            renderNotebooksOnPage(); 
        }
        if (viewName === 'trash') {
            renderDeletedNotesList();
            if(fabCreateNote) fabCreateNote.classList.add('hidden');
        } else {
            if(fabCreateNote) fabCreateNote.classList.remove('hidden');
        }
    }
    function getTextColorForBackground(hexColor) { if (!hexColor) return '#000000'; const r = parseInt(hexColor.slice(1, 3), 16); const g = parseInt(hexColor.slice(3, 5), 16); const b = parseInt(hexColor.slice(5, 7), 16); const luminance = (0.299 * r + 0.587 * g + 0.114 * b); return luminance > 128 ? '#000000' : '#FFFFFF'; }
    function sanitizeFilename(filename) {
        if (!filename) return "untitled_export";
        return filename.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '').replace(/_+/g, '_');
    }
    function convertTimestampToISO(timestamp) {
        if (!timestamp) return null;
        if (timestamp instanceof Timestamp) return timestamp.toDate().toISOString();
        if (timestamp instanceof Date) return timestamp.toISOString();
        const date = new Date(timestamp); 
        return isNaN(date.getTime()) ? null : date.toISOString();
    }


    // --- FIRESTORE DATA LISTENERS ---
    async function initializeDataListeners() {
        showLoadingOverlay("Loading App Data...");
        try {
            const appSettingsRef = doc(db, "app_settings", "global");
            unsubscribeAppSettings = onSnapshot(appSettingsRef, async (docSnap) => {
                console.log("Firestore app_settings snapshot received.");
                if (docSnap.exists()) {
                    const settingsData = docSnap.data();
                    console.log("Settings data from Firestore:", settingsData);
                    
                    themeSettings.appDefaultBackgroundColor = settingsData.activeThemeColors?.appDefaultBackgroundColor || initialThemeSettings.appDefaultBackgroundColor;
                    themeSettings.themeSidebarBg = settingsData.activeThemeColors?.themeSidebarBg || initialThemeSettings.themeSidebarBg;
                    themeSettings.themeButtonPrimary = settingsData.activeThemeColors?.themeButtonPrimary || initialThemeSettings.themeButtonPrimary;
                    themeSettings.themeBorderAccent = settingsData.activeThemeColors?.themeBorderAccent || initialThemeSettings.themeBorderAccent;
                    themeSettings.defaultHomepage = settingsData.defaultHomepage || initialThemeSettings.defaultHomepage; 
                    
                    paletteColors = settingsData.paletteColors || [...initialPaletteColors]; 
                    defaultThemeColorsFromDB = settingsData.defaultThemeColors || [...initialDefaultThemeColors]; 
                } else { 
                    console.log("No app_settings found in Firestore, creating with initial defaults.");
                    themeSettings = { ...initialThemeSettings }; 
                    paletteColors = [...initialPaletteColors];
                    defaultThemeColorsFromDB = [...initialDefaultThemeColors];
                    try { 
                        await setDoc(appSettingsRef, { 
                            activeThemeColors: { ...initialThemeSettings }, 
                            defaultThemeColors: [...initialDefaultThemeColors], 
                            paletteColors: [...initialPaletteColors],
                            defaultHomepage: initialThemeSettings.defaultHomepage
                        }); 
                        console.log("Default app settings created in Firestore.");
                    } catch (e) { console.error("Error creating default app settings:", e); }
                }
                applyThemeSettings(); 
                renderPaletteColors(); 
                DEFAULT_TAG_COLOR = themeSettings.appDefaultBackgroundColor; 
                updatePaletteLimitMessage();

                if (!initialViewDetermined && db) {
                    switchToMainView(themeSettings.defaultHomepage);
                    if (themeSettings.defaultHomepage === 'notes' || themeSettings.defaultHomepage === 'favorites') {
                        isFavoritesViewActive = themeSettings.defaultHomepage === 'favorites';
                        currentlyViewedNotebookId = null; 
                        currentFilterTag = null;
                        if(allNotesPageTitle) allNotesPageTitle.textContent = isFavoritesViewActive ? "Favorite Notes" : "All Notes";
                        if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none';
                    } else if (themeSettings.defaultHomepage === 'trash') {
                        renderDeletedNotesList();
                    }
                    initialViewDetermined = true;
                }
                renderAllNotesPreviews(); 
                renderTagsInSettings(); 
                renderNotebooksOnPage(); 
            }, (error) => {
                console.error("Error fetching app settings:", error);
                themeSettings = { ...initialThemeSettings }; paletteColors = [...initialPaletteColors]; defaultThemeColorsFromDB = [...initialDefaultThemeColors];
                applyThemeSettings(); renderPaletteColors(); updatePaletteLimitMessage();
                if (!initialViewDetermined && db) { 
                    switchToMainView(themeSettings.defaultHomepage); 
                    initialViewDetermined = true;
                }
            });

            const notebooksQuery = query(collection(db, "notebooks"), orderBy("createdAt", "desc"));
            unsubscribeNotebooks = onSnapshot(notebooksQuery, (querySnapshot) => {
                const fetchedNotebooks = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedNotebooks.push({ id: doc.id, ...data, createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()) });
                });
                localNotebooksCache = fetchedNotebooks;
                renderNotebooksOnPage(); 
                updatePanelNotebookSelector(); 
                if (currentlyViewedNotebookId) displayNotebookHeader(currentlyViewedNotebookId);
                updatePaletteLimitMessage(); 
                populateExportNotebookSelector(); 
                
                if (localNotebooksCache.length === 0 && !querySnapshot.metadata.hasPendingWrites) { 
                    initializeDefaultNotebookFirestore();
                }
            }, (error) => { console.error("Error fetching notebooks: ", error); alert("Error loading notebooks."); hideLoadingOverlay(); });

            const notesGroupQuery = query(collectionGroup(db, "notes"), orderBy("modifiedAt", "desc"));
            unsubscribeNotes = onSnapshot(notesGroupQuery, (querySnapshot) => {
                const fetchedNotes = [];
                querySnapshot.forEach((noteDoc) => { 
                    const data = noteDoc.data();
                    fetchedNotes.push({ 
                        id: noteDoc.id, ...data, notebookId: data.notebookId || noteDoc.ref.parent.parent.id, 
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
                        modifiedAt: data.modifiedAt?.toDate ? data.modifiedAt.toDate() : (data.modifiedAt ? new Date(data.modifiedAt) : new Date()),
                        edits: (data.edits || []).map(edit => ({ ...edit, timestamp: edit.timestamp?.toDate ? edit.timestamp.toDate() : (edit.timestamp ? new Date(edit.timestamp) : new Date()) }))
                    });
                });
                localNotesCache = fetchedNotes;
                renderAllNotesPreviews(); 
                if (settingsContentDiv && settingsContentDiv.classList.contains('main-view-content-active') && document.getElementById('tags-settings-section')?.classList.contains('settings-content-section-active')) { renderTagsInSettings(); }
                
                if (currentInteractingNoteIdInPanel && !isNewNoteSessionInPanel && activelyCreatingNoteId !== currentInteractingNoteIdInPanel) { 
                    const updatedNote = localNotesCache.find(n => n.id === currentInteractingNoteIdInPanel);
                    if (updatedNote) {
                        displayNoteInInteractionPanel(currentInteractingNoteIdInPanel, false); 
                    } else {
                        clearInteractionPanel(); 
                    }
                } else if (activelyCreatingNoteId && currentInteractingNoteIdInPanel === activelyCreatingNoteId) {
                    const updatedNote = localNotesCache.find(n => n.id === activelyCreatingNoteId);
                    if (updatedNote) {
                        lastSavedNoteTitleInPanel = updatedNote.title;
                        lastSavedNoteTextInPanel = updatedNote.text;
                        lastSavedNoteTagsInPanel = (updatedNote.tags || []).map(t => t.name).sort().join(',');
                        lastSavedNoteActivityInPanel = updatedNote.activity || '';

                        if(noteTitleInputField_panel && document.activeElement !== noteTitleInputField_panel) noteTitleInputField_panel.value = updatedNote.title;
                        if(noteTextInputField_panel && document.activeElement !== noteTextInputField_panel) noteTextInputField_panel.value = updatedNote.text;
                        
                        const newTagsValue = (updatedNote.tags || []).map(tagObj => tagObj.name);
                        if (document.activeElement !== noteTagsInputField_panel && JSON.stringify(currentNoteTagsArrayInPanel.sort()) !== JSON.stringify(newTagsValue.sort())) {
                            currentNoteTagsArrayInPanel = newTagsValue;
                            renderTagPills();
                        }
                        
                        if(interactionPanelActivityInputField && (isAdminModeEnabled || activelyCreatingNoteId === updatedNote.id || isNewNoteSessionInPanel)) { 
                            if(document.activeElement !== interactionPanelActivityInputField) interactionPanelActivityInputField.value = updatedNote.activity || '';
                        }
                        updateNoteInfoPanel(updatedNote); 
                    }
                }
                hideLoadingOverlay(); 
            }, (error) => { 
                console.error("Error fetching notes (collection group): ", error); 
                let alertMessage = "Error loading notes. Firestore index might be required for 'notes' collection group, ordered by 'modifiedAt' (descending).\nCheck console (F12) for Firebase link to create index.";
                alertMessage += `\n\nError: ${error.message} ${error.code ? `(Code: ${error.code})` : ""}`;
                alert(alertMessage); hideLoadingOverlay(); 
            });
            
            unsubscribeTags = onSnapshot(query(collection(db, "tags"), orderBy("name")), (querySnapshot) => {
                const newLocalTagsCache = [];
                const tagMap = new Map(); 
                querySnapshot.forEach((doc) => {
                    const tagData = { id: doc.id, ...doc.data() };
                    if (tagData.name) {
                        tagData.name = tagData.name.toLowerCase(); 
                        if (!tagMap.has(tagData.name)) { 
                            tagMap.set(tagData.name, tagData);
                        } else {
                            console.warn(`Duplicate tag name found: '${tagData.name}'. Keeping first encountered.`);
                        }
                    }
                });
                localTagsCache = Array.from(tagMap.values()); 
                renderTagsInSettings(); 
                renderAllNotesPreviews(); 
                if (currentInteractingNoteIdInPanel) renderTagPills(); 
            }, (error) => { console.error("Error fetching tags: ", error); alert("Error loading tags."); hideLoadingOverlay(); });

            const deletedNotesQuery = query(collection(db, "deleted_notes"), orderBy("deletedAt", "desc"));
            unsubscribeDeletedNotes = onSnapshot(deletedNotesQuery, (querySnapshot) => {
                const fetchedDeletedNotes = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedDeletedNotes.push({ 
                        id: doc.id, 
                        ...data, 
                        deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : new Date(),
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
                        modifiedAt: data.modifiedAt?.toDate ? data.modifiedAt.toDate() : (data.modifiedAt ? new Date(data.modifiedAt) : null),
                    });
                });
                localDeletedNotesCache = fetchedDeletedNotes;
                if (trashContentDiv && trashContentDiv.classList.contains('main-view-content-active')) {
                    renderDeletedNotesList();
                }
            }, (error) => { console.error("Error fetching deleted notes: ", error); alert("Error loading deleted notes."); });


        } catch (error) { console.error("Error setting up Firestore listeners: ", error); alert("Could not connect to the database."); hideLoadingOverlay(); }
    }
    initializeDataListeners();

    // Sidebar and Main Content Area Sizing (No expansion, fixed width)
    const fixedSidebarWidth = '7rem'; // New fixed width
    if (appSidebar && mainContentArea) {
        appSidebar.style.width = fixedSidebarWidth;
        mainContentArea.style.marginLeft = fixedSidebarWidth;
        // Remove hamburger button functionality if it's not needed
        if (hamburgerBtn) {
            hamburgerBtn.style.display = 'none'; // Or remove it from HTML if truly not needed
        }
    }
    
    if(sidebarNotebooksPageBtn) {
        sidebarNotebooksPageBtn.addEventListener('click', () => { 
            if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
            isFavoritesViewActive = false; 
            currentFilterTag = null; 
            currentlyViewedNotebookId = null; 
            clearInteractionPanel(true); 
            switchToMainView('notebooks');
        }); 
    }
    if(sidebarAllNotesBtn) { 
        sidebarAllNotesBtn.addEventListener('click', () => { 
            if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
            isFavoritesViewActive = false; 
            currentFilterTag = null; 
            currentlyViewedNotebookId = null; 
            clearInteractionPanel(true); 
            switchToMainView('notes'); 
            renderAllNotesPreviews(); 
        }); 
    }
    if(sidebarFavoritesBtn) { 
        sidebarFavoritesBtn.addEventListener('click', () => { 
            if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
            isFavoritesViewActive = true; 
            currentlyViewedNotebookId = null; 
            currentFilterTag = null; 
            clearInteractionPanel(true); 
            switchToMainView('notes'); 
            renderAllNotesPreviews(); 
        }); 
    }
    if(sidebarTrashBtn) { 
        sidebarTrashBtn.addEventListener('click', () => { 
            if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
            isFavoritesViewActive = false; 
            currentFilterTag = null; 
            currentlyViewedNotebookId = null; 
            clearInteractionPanel(true); 
            switchToMainView('trash'); 
        }); 
    }
    if(sidebarSettingsBtn) {
        sidebarSettingsBtn.addEventListener('click', () => {
            if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
            switchToMainView('settings');
        });
    }
    
    function handleNavigateBackToNotebooks() {
        if (fabNavigateBack) fabNavigateBack.classList.add('hidden');
        isFavoritesViewActive = false; 
        currentFilterTag = null; 
        currentlyViewedNotebookId = null; 
        clearInteractionPanel(true); 
        switchToMainView('notebooks');
        if (notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none';
        if (allNotesPageTitle) allNotesPageTitle.textContent = "All Notes"; 
    }

    if (fabNavigateBack) {
        fabNavigateBack.addEventListener('click', handleNavigateBackToNotebooks);
    }
    
    function renderNotebooksOnPage() {
        if (!notebooksPageListContainer || !notebooksPageNoNotebooksMessage) return;
        notebooksPageListContainer.innerHTML = ""; 

        const sortedNotebooks = [...localNotebooksCache].sort((a,b) => a.title.localeCompare(b.title));

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
                <div class="notebook-page-card-title-container">
                    <h3 class="notebook-page-card-title">${notebook.title}</h3>
                </div>
                <div class="notebook-page-card-spacer"></div> <div class="notebook-page-card-icons">
                    <span class="notebook-page-card-icon edit-notebook-icon-btn" title="Edit Notebook"><i class="fas fa-pencil-alt"></i></span>
                    <span class="notebook-page-card-icon delete-notebook-icon-btn" title="Delete Notebook"><i class="fas fa-trash-alt"></i></span>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.notebook-page-card-icon')) return;
                const notebookId = e.currentTarget.dataset.notebookId;
                currentlyViewedNotebookId = notebookId;
                isFavoritesViewActive = false; currentFilterTag = null;
                if (fabNavigateBack) fabNavigateBack.classList.remove('hidden'); 
                clearInteractionPanel(true); switchToMainView('notes');
                displayNotebookHeader(notebookId); renderAllNotesPreviews();
            });

            card.querySelector('.edit-notebook-icon-btn').addEventListener('click', (e) => {
                e.stopPropagation(); 
                openEditNotebookModal(notebook.id);
            });
            card.querySelector('.delete-notebook-icon-btn').addEventListener('click', (e) => {
                e.stopPropagation(); 
                handleDeleteNotebook(notebook.id);
            });
            notebooksPageListContainer.appendChild(card);
        });

        const createCard = document.createElement('div');
        createCard.className = 'create-notebook-card';
        createCard.innerHTML = `
            <i class="fas fa-plus create-notebook-card-icon"></i>
            <span class="create-notebook-card-text">Create Notebook</span>
        `;
        createCard.addEventListener('click', () => {
            if(createNotebookModal) {
                openCreateNotebookModal(); 
                createNotebookModal.style.display = 'flex'; 
            }
        });
        notebooksPageListContainer.appendChild(createCard); 
    }

    function applyThemeSettings() {
        const root = document.documentElement;
        root.style.setProperty('--theme-app-default-bg', themeSettings.appDefaultBackgroundColor);
        root.style.setProperty('--theme-bg-sidebar', themeSettings.themeSidebarBg);
        root.style.setProperty('--theme-bg-sidebar-hover', shadeColor(themeSettings.themeSidebarBg, -20)); 
        root.style.setProperty('--theme-bg-button-primary', themeSettings.themeButtonPrimary);
        root.style.setProperty('--theme-bg-button-primary-hover', shadeColor(themeSettings.themeButtonPrimary, -10)); 
        root.style.setProperty('--theme-border-accent', themeSettings.themeBorderAccent);
        root.style.setProperty('--theme-text-on-dark', getTextColorForBackground(themeSettings.themeSidebarBg)); 
        
        const addPaletteColorBtnEl = addPaletteColorBtn; 
        if(addPaletteColorBtnEl) addPaletteColorBtnEl.style.color = getTextColorForBackground(themeSettings.themeButtonPrimary);
        
        const resetThemeBtnEl = resetThemeBtn; 
        if(resetThemeBtnEl) resetThemeBtnEl.style.color = getTextColorForBackground(themeSettings.themeButtonPrimary);
        
        const editPaletteBtnEl = editPaletteBtn;
        if(editPaletteBtnEl) editPaletteBtnEl.style.color = getTextColorForBackground(themeSettings.themeButtonPrimary);

        const exportNotebookBtnEl = exportNotebookBtn;
        if(exportNotebookBtnEl) exportNotebookBtnEl.style.color = getTextColorForBackground(themeSettings.themeButtonPrimary);


        DEFAULT_TAG_COLOR = themeSettings.appDefaultBackgroundColor;
        document.getElementById('themeAppDefaultBgColorPicker').value = themeSettings.appDefaultBackgroundColor;
        document.getElementById('themeSidebarBgColorPicker').value = themeSettings.themeSidebarBg;
        document.getElementById('themeButtonPrimaryColorPicker').value = themeSettings.themeButtonPrimary;
        document.getElementById('themeBorderAccentColorPicker').value = themeSettings.themeBorderAccent;
        if(defaultHomepageSelector) defaultHomepageSelector.value = themeSettings.defaultHomepage; 

        renderAllNotesPreviews(); 
        renderTagsInSettings(); 
        renderNotebooksOnPage(); 
        renderDeletedNotesList();
    }
    function shadeColor(color, percent) { let R = parseInt(color.substring(1,3),16); let G = parseInt(color.substring(3,5),16); let B = parseInt(color.substring(5,7),16); R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100); R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255; R = Math.round(R); G = Math.round(G); B = Math.round(B); return "#"+(R.toString(16).padStart(2,'0'))+(G.toString(16).padStart(2,'0'))+(B.toString(16).padStart(2,'0')); }
    
    themeColorInputs.forEach(input => { 
        input.addEventListener('input', debounce(async (event) => { 
            const key = event.target.dataset.themeKey; 
            const value = event.target.value; 
            themeSettings[key] = value; 
            applyThemeSettings(); 
            try { 
                const activeThemeColorsToSave = {
                    appDefaultBackgroundColor: themeSettings.appDefaultBackgroundColor,
                    themeSidebarBg: themeSettings.themeSidebarBg,
                    themeButtonPrimary: themeSettings.themeButtonPrimary,
                    themeBorderAccent: themeSettings.themeBorderAccent
                };
                await setDoc(doc(db, "app_settings", "global"), { activeThemeColors: activeThemeColorsToSave }, { merge: true }); 
            } catch (e) { 
                console.error("Error updating theme setting:", e); 
                alert("Failed to save theme."); 
            } 
        }, 250)); 
    });
    
    if(defaultHomepageSelector) {
        defaultHomepageSelector.addEventListener('change', async (event) => {
            const newDefaultPage = event.target.value;
            themeSettings.defaultHomepage = newDefaultPage; 
            try {
                await setDoc(doc(db, "app_settings", "global"), { defaultHomepage: newDefaultPage }, { merge: true });
            } catch (e) {
                console.error("Error updating default homepage setting:", e);
                alert("Failed to save default homepage preference.");
                const appSettingsSnap = await getDoc(doc(db, "app_settings", "global"));
                if (appSettingsSnap.exists()) {
                    themeSettings.defaultHomepage = appSettingsSnap.data().defaultHomepage || initialThemeSettings.defaultHomepage;
                    defaultHomepageSelector.value = themeSettings.defaultHomepage;
                }
            }
        });
    }

    if (resetThemeBtn) {
        resetThemeBtn.addEventListener('click', () => {
            if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'flex';
        });
    }
    if (closeConfirmThemeResetModalBtn) closeConfirmThemeResetModalBtn.addEventListener('click', () => { if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none'; });
    if (cancelThemeResetBtn) cancelThemeResetBtn.addEventListener('click', () => { if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none'; });
    if (executeThemeResetBtn) {
        executeThemeResetBtn.addEventListener('click', async () => {
            console.log("Reset confirmed by user via custom modal.");
            showLoadingOverlay("Resetting theme...");
            try {
                await setDoc(doc(db, "app_settings", "global"), { 
                    activeThemeColors: { ...initialThemeSettings }, 
                    defaultThemeColors: [...initialDefaultThemeColors], 
                    paletteColors: [...initialPaletteColors], 
                    defaultHomepage: initialThemeSettings.defaultHomepage 
                });
                console.log("Reset theme command sent to Firestore successfully.");
            } catch (e) {
                console.error("Error resetting theme in Firestore:", e);
                alert("Failed to reset theme in Firestore. Check console.");
            } finally {
                if (confirmThemeResetModal) confirmThemeResetModal.style.display = 'none';
                hideLoadingOverlay();
            }
        });
    }
    
    function updatePaletteLimitMessage() {
        if (paletteLimitMessage) {
            const limit = PALETTE_BASE_LIMIT + localNotebooksCache.length;
            paletteLimitMessage.textContent = `Palette colors: ${paletteColors.length} / ${limit}`;
        }
    }

    function renderPaletteColors() { 
        if (!paletteColorsContainer) return; 
        paletteColorsContainer.innerHTML = ''; 
        paletteColors.forEach((color, index) => { 
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
            if (isPaletteEditMode && !initialPaletteColors.includes(color)) { 
                const deleteBtn = document.createElement('button'); 
                deleteBtn.innerHTML = '&times;'; 
                deleteBtn.className = 'delete-palette-color-btn'; 
                deleteBtn.title = `Remove ${color}`; 
                deleteBtn.onclick = async (e) => { 
                    e.stopPropagation(); 
                    const originalColor = paletteColors[index]; 
                    paletteColors.splice(index, 1); 
                    try { 
                        await setDoc(doc(db, "app_settings", "global"), { paletteColors: paletteColors }, { merge: true }); 
                        renderPaletteColors(); 
                        updatePaletteLimitMessage();
                    } catch (err) { 
                        console.error("Error removing palette color:", err); 
                        alert("Failed to remove color."); 
                        paletteColors.splice(index, 0, originalColor); 
                        renderPaletteColors(); 
                        updatePaletteLimitMessage();
                    } 
                }; 
                swatchWrapper.appendChild(deleteBtn); 
            } 
            paletteColorsContainer.appendChild(swatchWrapper); 
        }); 
        updatePaletteLimitMessage();
    }
    if (addPaletteColorBtn && newPaletteColorPicker) { 
        addPaletteColorBtn.addEventListener('click', async () => { 
            const paletteLimit = PALETTE_BASE_LIMIT + localNotebooksCache.length;
            if (paletteColors.length >= paletteLimit) {
                alert(`Color palette limit reached (${paletteLimit} colors). You can delete existing palette colors or create more notebooks to increase the limit.`);
                return;
            }
            const newColor = newPaletteColorPicker.value; 
            if (newColor && !paletteColors.includes(newColor)) { 
                paletteColors.push(newColor); 
                try { 
                    await setDoc(doc(db, "app_settings", "global"), { paletteColors: paletteColors }, { merge: true }); 
                    renderPaletteColors(); 
                    newPaletteColorPicker.value = "#000000"; 
                } catch (e) { 
                    console.error("Error adding palette color:", e); 
                    alert("Failed to add color."); 
                    paletteColors.pop(); 
                    updatePaletteLimitMessage();
                } 
            } else if (paletteColors.includes(newColor)) { 
                alert("Color already in palette."); 
            } 
        }); 
    }
    if (editPaletteBtn) { editPaletteBtn.addEventListener('click', () => { isPaletteEditMode = !isPaletteEditMode; editPaletteBtn.textContent = isPaletteEditMode ? 'Done Editing' : 'Edit Palette'; renderPaletteColors(); }); }
    function switchToSettingsSection(sectionName) { 
        settingsMenuItems.forEach(t=>{t.classList.remove("settings-menu-item-active"),t.dataset.settingSection===sectionName&&t.classList.add("settings-menu-item-active")}); 
        settingsContentSections.forEach(t=>{t&&t.style&&(t.classList.remove("settings-content-section-active"),t.style.display="none",t.id===sectionName+"-settings-section"&&(t.classList.add("settings-content-section-active"),t.style.display="block"))}); 
        if (sectionName === 'tags') renderTagsInSettings(); 
        if (sectionName === 'appearance') { 
            document.getElementById('themeAppDefaultBgColorPicker').value = themeSettings.appDefaultBackgroundColor; 
            document.getElementById('themeSidebarBgColorPicker').value = themeSettings.themeSidebarBg; 
            document.getElementById('themeButtonPrimaryColorPicker').value = themeSettings.themeButtonPrimary; 
            document.getElementById('themeBorderAccentColorPicker').value = themeSettings.themeBorderAccent; 
            if(defaultHomepageSelector) defaultHomepageSelector.value = themeSettings.defaultHomepage; 
            renderPaletteColors(); 
        }
        if (sectionName === 'export') {
            populateExportNotebookSelector();
        }
    }
    settingsMenuItems.forEach(item => item.addEventListener('click', () => switchToSettingsSection(item.dataset.settingSection)));
    
    function openCreateNotebookModal() {
        currentSelectedNotebookCoverColor_create = null; 
        if (cnNotebookCoverPaletteContainer) {
            cnNotebookCoverPaletteContainer.innerHTML = ''; 
            paletteColors.forEach(color => {
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

    if (closeCreateNotebookModalBtn) closeCreateNotebookModalBtn.addEventListener('click', () => { if(createNotebookModal) createNotebookModal.style.display = 'none'; if(createNotebookForm) createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null; });
    if (cancelNotebookCreationBtn) cancelNotebookCreationBtn.addEventListener('click', () => { if(createNotebookModal) createNotebookModal.style.display = 'none'; if(createNotebookForm) createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null; });
    if (createNotebookForm) createNotebookForm.addEventListener('submit', async (event) => { 
        event.preventDefault(); 
        let finalCoverColor = currentSelectedNotebookCoverColor_create;
        if (!finalCoverColor && paletteColors.length > 0) {
            finalCoverColor = paletteColors[0]; 
        } else if (!finalCoverColor) {
            finalCoverColor = 'var(--default-notebook-cover-bg)'; 
        }

        const newNotebook = { 
            title: cnNotebookTitleField.value.trim() || "Untitled Notebook", 
            purpose: cnNotebookPurposeField.value.trim(), 
            createdAt: serverTimestamp(), 
            notesCount: 0, 
            coverColor: finalCoverColor 
        }; 
        try { const docRef = await addDoc(collection(db, "notebooks"), newNotebook); } catch (e) { console.error("Error adding notebook: ", e); alert("Failed to create notebook."); } 
        if(createNotebookModal) createNotebookModal.style.display = 'none'; 
        createNotebookForm.reset(); 
        currentSelectedNotebookCoverColor_create = null;
    });

    if (editNotebookModal) { 
        if(closeEditNotebookModalBtn_notebook) closeEditNotebookModalBtn_notebook.addEventListener('click', () => { if(editNotebookModal) editNotebookModal.style.display = 'none'; if(editNotebookForm) editNotebookForm.reset(); currentSelectedNotebookCoverColor = null; }); 
    }
    if (cancelNotebookEditBtn) cancelNotebookEditBtn.addEventListener('click', () => { if(editNotebookModal) editNotebookModal.style.display = 'none'; if(editNotebookForm) editNotebookForm.reset(); currentSelectedNotebookCoverColor = null; });
    
    if (editNotebookForm) editNotebookForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        showLoadingOverlay("Saving notebook...");
        const notebookId = editingNotebookIdField.value;
        if (!notebookId) { hideLoadingOverlay(); return; }

        const notebookRef = doc(db, "notebooks", notebookId);
        const updates = {
            title: enNotebookTitleField.value.trim() || "Untitled Notebook",
            purpose: enNotebookPurposeField.value.trim(),
            coverColor: currentSelectedNotebookCoverColor 
        };

        try {
            await updateDoc(notebookRef, updates);
        } catch (e) {
            console.error("Error updating notebook: ", e);
            alert("Failed to update notebook.");
        } finally {
            currentSelectedNotebookCoverColor = null; 
            if(editNotebookModal) editNotebookModal.style.display = 'none';
            editNotebookForm.reset();
            hideLoadingOverlay();
        }
    });

    function openEditNotebookModal(notebookId) {
        const notebook = localNotebooksCache.find(nb => nb.id === notebookId);
        if (!notebook) return;
        editingNotebookIdField.value = notebook.id;
        enNotebookTitleField.value = notebook.title;
        enNotebookPurposeField.value = notebook.purpose || '';
        currentSelectedNotebookCoverColor = notebook.coverColor || null; 

        if (enNotebookCoverPaletteContainer) {
            enNotebookCoverPaletteContainer.innerHTML = ''; 
            paletteColors.forEach(color => {
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
    
    function openConfirmDeleteNotebookModal(notebookId, notebookName) { notebookToDeleteGlobally = { id: notebookId, name: notebookName }; if (notebookNameToDeleteDisplay) notebookNameToDeleteDisplay.textContent = notebookName; if (confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'flex'; }
    function closeConfirmDeleteNotebookModal() { if (confirmNotebookDeleteModal) confirmNotebookDeleteModal.style.display = 'none'; notebookToDeleteGlobally = { id: null, name: null }; }
    if (closeConfirmNotebookDeleteModalBtn) closeConfirmNotebookDeleteModalBtn.addEventListener('click', closeConfirmDeleteNotebookModal);
    if (cancelNotebookDeletionBtn) cancelNotebookDeletionBtn.addEventListener('click', closeConfirmDeleteNotebookModal);
    if (executeNotebookDeletionBtn) executeNotebookDeletionBtn.addEventListener('click', async () => { if (notebookToDeleteGlobally.id && notebookToDeleteGlobally.name) { await performActualNotebookDeletion(notebookToDeleteGlobally.id, notebookToDeleteGlobally.name); } closeConfirmDeleteNotebookModal(); });
    
    async function performActualNotebookDeletion(notebookId, notebookName) {
        showLoadingOverlay(`Moving notes from "${notebookName}" to Trash...`);
        try {
            const batch = writeBatch(db);
            const notesInNotebookRef = collection(db, "notebooks", notebookId, "notes");
            const notesSnapshot = await getDocs(notesInNotebookRef);
            const notesToMoveIds = []; 
            let tagsFromMovedNotes = new Set();

            notesSnapshot.forEach(noteDoc => {
                const noteData = noteDoc.data();
                const deletedNoteData = {
                    ...noteData,
                    originalNoteId: noteDoc.id,
                    originalNotebookId: notebookId,
                    originalNotebookName: notebookName,
                    deletedAt: serverTimestamp()
                };
                const newDeletedNoteRef = doc(collection(db, "deleted_notes"));
                batch.set(newDeletedNoteRef, deletedNoteData);
                batch.delete(noteDoc.ref); 
                
                notesToMoveIds.push(noteDoc.id);
                if (noteData.tags && Array.isArray(noteData.tags)) {
                    noteData.tags.forEach(tag => tagsFromMovedNotes.add(tag.name.toLowerCase()));
                }
            });

            const notebookRef = doc(db, "notebooks", notebookId);
            batch.delete(notebookRef); 
            await batch.commit();

            if (currentlyViewedNotebookId === notebookId) {
                currentlyViewedNotebookId = null;
                switchToMainView(themeSettings.defaultHomepage || "notebooks");
                if ((themeSettings.defaultHomepage || "notebooks") === 'notes' || (themeSettings.defaultHomepage || "notebooks") === 'favorites') {
                    isFavoritesViewActive = (themeSettings.defaultHomepage || "notebooks") === 'favorites';
                    currentFilterTag = null;
                    if(allNotesPageTitle) allNotesPageTitle.textContent = isFavoritesViewActive ? "Favorite Notes" : "All Notes";
                    if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none';
                    renderAllNotesPreviews();
                }
                clearInteractionPanel(false);
            }
            if (currentInteractingNoteIdInPanel && notesToMoveIds.some(movedNoteId => localNotesCache.find(n => n.id === currentInteractingNoteIdInPanel && n.notebookId === notebookId && movedNoteId === currentInteractingNoteIdInPanel))) { 
                clearInteractionPanel(false); 
            }
            if (tagsFromMovedNotes.size > 0) {
                for (const tagName of tagsFromMovedNotes) {
                    await checkAndCleanupOrphanedTag(tagName);
                }
            }
            setTimeout(async () => { if (localNotebooksCache.length === 0) { await initializeDefaultNotebookFirestore(); } }, 500);

        } catch (e) {
            console.error(`Error deleting notebook "${notebookName}" and moving notes: `, e);
            alert(`Failed to delete notebook "${notebookName}". Error: ${e.message}`);
        } finally {
            hideLoadingOverlay();
        }
    }
    function handleDeleteNotebook(notebookId) { if (!notebookId) { alert("Cannot delete notebook: ID missing."); return; } const notebookToDelete = localNotebooksCache.find(nb => nb.id === notebookId); if (!notebookToDelete) { alert(`Error: Notebook to delete (ID: ${notebookId}) not found.`); return; } openConfirmDeleteNotebookModal(notebookId, notebookToDelete.title); }

    function openConfirmNoteActionModal(type, noteId, notebookId, noteTitle, isDeletedNote = false) {
        noteActionContext = { type, id: noteId, notebookId, title: noteTitle || "(Untitled Note)", isDeletedNote };
        
        if (!confirmNoteActionModal || !confirmNoteActionTitle || !confirmNoteActionMessage || !confirmNoteActionWarning || !executeNoteActionBtn) return;

        if (type === 'deletePermanently') { 
            confirmNoteActionTitle.textContent = "Delete Note Permanently?";
            confirmNoteActionMessage.textContent = `Are you sure you want to permanently delete the note "${noteActionContext.title}"?`;
            confirmNoteActionWarning.textContent = "This action cannot be undone.";
            executeNoteActionBtn.textContent = "Delete Permanently";
            executeNoteActionBtn.className = "px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm";
            confirmNoteActionModal.style.display = 'flex';
        } else {
            console.error("Unknown or unconfirmed note action type for modal:", type);
        }
    }

    function closeConfirmNoteActionModal() {
        if (confirmNoteActionModal) confirmNoteActionModal.style.display = 'none';
        noteActionContext = { type: null, id: null, notebookId: null, title: null, isDeletedNote: false };
    }

    async function performActualNoteAction() { 
        if (!noteActionContext.id || noteActionContext.type !== 'deletePermanently') return;
        showLoadingOverlay("Deleting Permanently...");
        
        if (noteActionContext.isDeletedNote) { 
            try {
                await deleteDoc(doc(db, "deleted_notes", noteActionContext.id));
            } catch (e) { console.error("Error deleting note permanently from trash:", e); alert("Failed to delete note permanently."); }
        }
        hideLoadingOverlay();
        closeConfirmNoteActionModal();
    }

    async function moveNoteToTrashImmediately(noteId, notebookId, noteTitle) {
        if (!noteId || !notebookId) {
            console.error("Note ID or Notebook ID missing for move to trash.");
            return;
        }
        showLoadingOverlay("Moving to Trash...");
        try {
            const noteRef = doc(db, "notebooks", notebookId, "notes", noteId);
            const noteSnap = await getDoc(noteRef);
            if (noteSnap.exists()) {
                const noteData = noteSnap.data();
                const originalNotebook = localNotebooksCache.find(nb => nb.id === notebookId);
                
                const deletedNoteData = {
                    ...noteData,
                    originalNoteId: noteId,
                    originalNotebookId: notebookId,
                    originalNotebookName: originalNotebook ? originalNotebook.title : "Unknown Notebook",
                    deletedAt: serverTimestamp()
                };
                
                const batch = writeBatch(db);
                const newDeletedNoteRef = doc(collection(db, "deleted_notes"));
                batch.set(newDeletedNoteRef, deletedNoteData);
                batch.delete(noteRef);

                const parentNotebookRef = doc(db, "notebooks", notebookId);
                const parentNotebookSnap = await getDoc(parentNotebookRef);
                if (parentNotebookSnap.exists()) {
                    batch.update(parentNotebookRef, { notesCount: Math.max(0, (parentNotebookSnap.data().notesCount || 0) - 1) });
                }
                await batch.commit();

                if (currentInteractingNoteIdInPanel === noteId) {
                    clearInteractionPanel(false);
                }
                if (noteData.tags && noteData.tags.length > 0) {
                    for (const tag of noteData.tags) {
                        await checkAndCleanupOrphanedTag(tag.name);
                    }
                }
            }
        } catch (e) { console.error("Error moving note to trash:", e); alert("Failed to move note to trash."); 
        } finally {
            hideLoadingOverlay();
        }
    }


    if(closeConfirmNoteActionModalBtn) closeConfirmNoteActionModalBtn.addEventListener('click', closeConfirmNoteActionModal);
    if(cancelNoteActionBtn) cancelNoteActionBtn.addEventListener('click', closeConfirmNoteActionModal);
    if(executeNoteActionBtn) executeNoteActionBtn.addEventListener('click', performActualNoteAction);


    if (editTagModal) { if (closeEditTagModalBtn_tag) closeEditTagModalBtn_tag.addEventListener('click', closeEditTagModal); if (cancelEditTagBtn) cancelEditTagBtn.addEventListener('click', closeEditTagModal); if (editTagForm) editTagForm.addEventListener('submit', handleSaveTagChanges); if (deleteTagBtn) deleteTagBtn.addEventListener('click', handleDeleteTagConfirmation); }
    if (confirmTagDeleteModal) { if (closeConfirmTagDeleteModalBtn) closeConfirmTagDeleteModalBtn.addEventListener('click', closeConfirmTagDeleteModal); if (cancelTagDeletionBtn) cancelTagDeletionBtn.addEventListener('click', closeConfirmTagDeleteModal); if (executeTagDeletionBtn) executeTagDeletionBtn.addEventListener('click', () => { if (tagToDeleteGlobally.id && tagToDeleteGlobally.name) performActualTagDeletion(tagToDeleteGlobally.id, tagToDeleteGlobally.name); closeConfirmTagDeleteModal(); closeEditTagModal(); }); }
    function openEditTagModal(tagId) { const tag = localTagsCache.find(t => t.id === tagId); if (!tag) return; editingTagIdField.value = tag.id; editingOriginalTagNameField.value = tag.name; etTagNameField.value = tag.name; currentSelectedColorForTagEdit = tag.color || DEFAULT_TAG_COLOR; if(etTagColorDisplay) etTagColorDisplay.value = currentSelectedColorForTagEdit; if(editTagPaletteContainer) { editTagPaletteContainer.innerHTML = ''; paletteColors.forEach(color => { const swatch = document.createElement('div'); swatch.className = 'palette-color-swatch inline-block mr-2 mb-2'; swatch.style.backgroundColor = color; swatch.dataset.colorValue = color; if (color === currentSelectedColorForTagEdit) swatch.classList.add('selected-for-tag-edit'); swatch.addEventListener('click', () => { currentSelectedColorForTagEdit = color; if(etTagColorDisplay) { etTagColorDisplay.value = color; etTagColorDisplay.style.backgroundColor = color; etTagColorDisplay.style.color = getTextColorForBackground(color); } editTagPaletteContainer.querySelectorAll('.palette-color-swatch').forEach(s => s.classList.remove('selected-for-tag-edit')); swatch.classList.add('selected-for-tag-edit'); }); editTagPaletteContainer.appendChild(swatch); }); } etTagPurposeField.value = tag.purpose || ''; if (deleteTagBtn) deleteTagBtn.disabled = false; if(editTagModal) editTagModal.style.display = 'flex'; etTagNameField.focus(); }
    function closeEditTagModal() { if(editTagModal) editTagModal.style.display = 'none'; if(editTagForm) editTagForm.reset(); editingOriginalTagNameField.value = ''; editingTagIdField.value = ''; if (deleteTagBtn) deleteTagBtn.disabled = false; currentSelectedColorForTagEdit = DEFAULT_TAG_COLOR; }
    function closeConfirmTagDeleteModal() { if (confirmTagDeleteModal) confirmTagDeleteModal.style.display = 'none'; if (deleteTagBtn) deleteTagBtn.disabled = false; tagToDeleteGlobally = { id: null, name: null }; }
    async function handleSaveTagChanges(event) { event.preventDefault(); const tagId = editingTagIdField.value; const originalName = editingOriginalTagNameField.value; const newName = etTagNameField.value.trim().toLowerCase(); const newColor = currentSelectedColorForTagEdit; const newPurpose = etTagPurposeField.value.trim(); if (!newName) { alert("Tag name cannot be empty."); return; } if (newName !== originalName && localTagsCache.some(t => t.name === newName && t.id !== tagId)) { alert(`Tag "${newName}" already exists.`); return; } const tagRef = doc(db, "tags", tagId); try { await updateDoc(tagRef, { name: newName, color: newColor, purpose: newPurpose }); if (originalName !== newName) { const batch = writeBatch(db); const notesWithOldTagQuery = query(collectionGroup(db, "notes"), where("tags", "array-contains", { name: originalName })); const notesSnapshot = await getDocs(notesWithOldTagQuery); notesSnapshot.forEach(noteDoc => { const noteData = noteDoc.data(); const updatedTags = noteData.tags.map(t => t.name === originalName ? { ...t, name: newName } : t); batch.update(noteDoc.ref, { tags: updatedTags }); }); await batch.commit(); } } catch (e) { console.error("Error updating tag:", e); alert("Failed to update tag."); } closeEditTagModal(); }
    function handleDeleteTagConfirmation() { if (deleteTagBtn && deleteTagBtn.disabled) return; const tagId = editingTagIdField.value; const tagName = editingOriginalTagNameField.value; if (!tagId || !tagName) return; tagToDeleteGlobally = { id: tagId, name: tagName }; if(deleteTagBtn) deleteTagBtn.disabled = true; if (tagNameToDeleteDisplay) tagNameToDeleteDisplay.textContent = tagName; if (confirmTagDeleteModal) confirmTagDeleteModal.style.display = 'flex'; }
    async function performActualTagDeletion(tagId, tagName) { 
        if (!tagId || !tagName) return; 
        showLoadingOverlay("Deleting tag..."); 
        const tagNameLower = tagName.toLowerCase();
        try { 
            const batch = writeBatch(db); 
            const tagRef = doc(db, "tags", tagId); 
            batch.delete(tagRef); 
            const notesWithTagQuery = query(collectionGroup(db, "notes"), where("tags", "array-contains", { name: tagNameLower })); 
            const notesSnapshot = await getDocs(notesWithTagQuery); 
            notesSnapshot.forEach(noteDoc => { 
                const noteData = noteDoc.data(); 
                const updatedTags = noteData.tags.filter(t => t.name !== tagNameLower); 
                batch.update(noteDoc.ref, { tags: updatedTags }); 
            }); 
            await batch.commit(); 
        } catch (e) { 
            console.error("Error deleting tag: ", e); alert("Failed to delete tag."); 
        } finally { 
            hideLoadingOverlay(); 
            tagToDeleteGlobally = { id: null, name: null }; 
        } 
    }
    async function checkAndCleanupOrphanedTag(tagName) {
        if (!tagName) return;
        const tagNameLower = tagName.toLowerCase();
        const notesWithTagQuery = query(collectionGroup(db, "notes"), where("tags", "array-contains", { name: tagNameLower }), limit(1));
        try {
            const notesSnapshot = await getDocs(notesWithTagQuery);
            if (notesSnapshot.empty) { 
                const tagsQueryToDelete = query(collection(db, "tags"), where("name", "==", tagNameLower));
                const tagDocsSnapshot = await getDocs(tagsQueryToDelete);
                if (!tagDocsSnapshot.empty) {
                    const tagDocToDelete = tagDocsSnapshot.docs[0]; 
                    await deleteDoc(doc(db, "tags", tagDocToDelete.id));
                }
            }
        } catch (e) {
            console.error(`Error checking/cleaning up orphaned tag "${tagNameLower}":`, e);
        }
    }
    
    function updateNoteInfoPanel(note) {
        if (!noteInfoPanelContainer) return;

        if (!note || (!note.tags?.length && !note.createdAt && !note.activity?.trim() && (!note.edits || note.edits.length === 0))) {
            noteInfoPanelContainer.style.display = 'none';
            return;
        }
        noteInfoPanelContainer.style.display = 'block';

        if (note.tags && note.tags.length > 0) {
            noteInfoTags.style.display = 'block';
            noteInfoTagsValue.textContent = note.tags.map(t => t.name).join(', ');
        } else {
            noteInfoTags.style.display = 'none';
        }

        if (note.createdAt) {
            noteInfoCreated.style.display = 'block';
            noteInfoCreatedValue.textContent = (note.createdAt === 'PENDING_SAVE') ? '(Will be set on first save)' : formatFullDateFromTimestamp(note.createdAt);
        } else {
            noteInfoCreated.style.display = 'none';
        }

        if (note.activity && note.activity.trim() !== '') {
            noteInfoActivity.style.display = 'block';
            noteInfoActivityValue.textContent = note.activity;
        } else {
            noteInfoActivity.style.display = 'none';
        }

        noteInfoEditsList.innerHTML = ''; 
        if (note.edits && note.edits.length > 0) {
            noteInfoEditsContainer.style.display = 'block';
            const sortedEdits = [...note.edits].sort((a, b) => (a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime()) - (b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime()));
            sortedEdits.forEach(edit => {
                const editEntryDiv = document.createElement('div');
                editEntryDiv.className = 'note-info-edit-entry mb-1';
                const dateLine = document.createElement('div');
                dateLine.innerHTML = `<strong>On:</strong> ${formatDateFromTimestamp(edit.timestamp)}`;
                editEntryDiv.appendChild(dateLine);
                const changesLine = document.createElement('div');
                let descriptionText = edit.description && edit.description.trim() !== '' ? edit.description : '(No description provided)';
                changesLine.innerHTML = `<span class="italic">${descriptionText}</span>`;
                editEntryDiv.appendChild(changesLine);
                noteInfoEditsList.appendChild(editEntryDiv);
            });
        } else {
            noteInfoEditsContainer.style.display = 'none';
        }
    }

    function setupPanelForNewNote(notebookId, notebookName) { 
        if (currentInteractingNoteIdInPanel || isNewNoteSessionInPanel || activelyCreatingNoteId) {
            processInteractionPanelEditsOnDeselect(true); 
        }
        clearInteractionPanel(false); 

        isNewNoteSessionInPanel = true; 
        activelyCreatingNoteId = null; 
        currentInteractingNoteIdInPanel = null; 
        currentOpenNotebookIdForPanel = notebookId; 
        currentInteractingNoteOriginalNotebookId = null; 
        currentEditSessionOpenTimePanel = new Date(); 
        hasUserStartedEditingCurrentNoteText = false;
        currentNoteTagsArrayInPanel = []; 


        if(interactionPanelForm) interactionPanelForm.reset(); 
        updatePanelNotebookSelector(notebookId); 
        if(panelNotebookSelectorContainer) panelNotebookSelectorContainer.style.display = 'block'; 
        if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; 
        
        if (panelCreationTimeContainer) {
            if (isAdminModeEnabled) { 
                panelCreationTimeContainer.style.display = 'block';
                if(interactionPanelCreationTimeDisplayField) {
                    interactionPanelCreationTimeDisplayField.textContent = formatFullDateFromTimestamp(currentEditSessionOpenTimePanel); 
                    interactionPanelCreationTimeDisplayField.style.display = 'flex';
                }
                if(interactionPanelCreationTimeInputsContainer) interactionPanelCreationTimeInputsContainer.style.display = 'none';
            } else { 
                panelCreationTimeContainer.style.display = 'none';
            }
        }
        
        if(panelActivityContainer) panelActivityContainer.style.display = 'block';
        if(interactionPanelActivityInputField) {
            interactionPanelActivityInputField.style.display = 'block';
            interactionPanelActivityInputField.value = '';
        }
        if(interactionPanelActivityDisplayField) interactionPanelActivityDisplayField.style.display = 'none';
        
        if(interactionPanelCurrentEditSessionContainer) interactionPanelCurrentEditSessionContainer.style.display = 'none'; 
        
        renderTagPills(); 
        updateNoteInfoPanel({ createdAt: 'PENDING_SAVE', activity: '', tags: [], edits: [] }); 
        
        if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'none';
        if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'flex'; 
        if(noteTitleInputField_panel) noteTitleInputField_panel.focus();

        lastSavedNoteTitleInPanel = "";
        lastSavedNoteTextInPanel = "";
        lastSavedNoteTagsInPanel = "";
        lastSavedNoteActivityInPanel = "";
    }
    
    function displayNoteInInteractionPanel(noteId, forceFocusToTitle = true) { 
        if ((currentInteractingNoteIdInPanel && currentInteractingNoteIdInPanel !== noteId) || isNewNoteSessionInPanel ) {
            processInteractionPanelEditsOnDeselect(true); 
        }
        
        const noteToEdit = localNotesCache.find(n => n.id === noteId); 
        if (!noteToEdit) { clearInteractionPanel(false); return; } 
        
        if (currentInteractingNoteIdInPanel !== noteId) { 
            hasUserStartedEditingCurrentNoteText = false;
        }
        
        isNewNoteSessionInPanel = false; 
        currentInteractingNoteIdInPanel = noteId; 
        currentInteractingNoteOriginalNotebookId = noteToEdit.notebookId; 
        currentOpenNotebookIdForPanel = noteToEdit.notebookId; 
        currentEditSessionOpenTimePanel = new Date(); 

        lastSavedNoteTitleInPanel = noteToEdit.title || "";
        lastSavedNoteTextInPanel = noteToEdit.text || "";
        currentNoteTagsArrayInPanel = (noteToEdit.tags || []).map(tagObj => tagObj.name);
        lastSavedNoteTagsInPanel = currentNoteTagsArrayInPanel.slice().sort().join(',');
        lastSavedNoteActivityInPanel = noteToEdit.activity || '';

        if(noteTitleInputField_panel) {
            const newTitle = noteToEdit.title || "";
            if (document.activeElement !== noteTitleInputField_panel) { 
                if (noteTitleInputField_panel.value !== newTitle) noteTitleInputField_panel.value = newTitle;
            }
        }
        if(noteTextInputField_panel) {
            const newText = noteToEdit.text || "";
             if (document.activeElement !== noteTextInputField_panel) { 
                if (noteTextInputField_panel.value !== newText) noteTextInputField_panel.value = newText;
            }
        }
        renderTagPills(); 
        
        updatePanelNotebookSelector(noteToEdit.notebookId); 
        if(panelNotebookSelectorContainer) panelNotebookSelectorContainer.style.display = 'block'; 
        if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; 
        
        if (panelCreationTimeContainer) {
            if (isAdminModeEnabled) { 
                panelCreationTimeContainer.style.display = 'block';
                const creationDate = noteToEdit.createdAt instanceof Timestamp ? noteToEdit.createdAt.toDate() : new Date(noteToEdit.createdAt);
                if(interactionPanelCreationTimeDisplayField) interactionPanelCreationTimeDisplayField.style.display = 'none';
                if(interactionPanelCreationTimeInputsContainer) interactionPanelCreationTimeInputsContainer.style.display = 'flex';
                if(interactionPanelCreationDateInputField) interactionPanelCreationDateInputField.value = !isNaN(creationDate) ? creationDate.toISOString().split('T')[0] : '';
                if(interactionPanelCreationTimeInputField_time) interactionPanelCreationTimeInputField_time.value = !isNaN(creationDate) ? creationDate.toTimeString().split(' ')[0].substring(0,5) : '';
            } else { 
                panelCreationTimeContainer.style.display = 'none'; 
            }
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
            } else { 
                 panelActivityContainer.style.display = 'none'; 
            }
        }
        
        if (interactionPanelCurrentEditSessionContainer) {
            if (noteToEdit.id && !isNewNoteSessionInPanel) { 
                if (hasUserStartedEditingCurrentNoteText && currentInteractingNoteIdInPanel === noteId) { 
                    interactionPanelCurrentEditSessionContainer.style.display = 'block';
                } else {
                    interactionPanelCurrentEditSessionContainer.style.display = 'none'; 
                    const handleFirstTextInputForEditSession = () => {
                        if (currentInteractingNoteIdInPanel === noteId && !isNewNoteSessionInPanel) { 
                            interactionPanelCurrentEditSessionContainer.style.display = 'block';
                            currentEditSessionOpenTimePanel = new Date(); 
                            if (interactionPanelEditsMadeInputField) {
                                interactionPanelEditsMadeInputField.value = ''; 
                            }
                            hasUserStartedEditingCurrentNoteText = true; 
                        }
                    };
                    noteTextInputField_panel.removeEventListener('input', handleFirstTextInputForEditSession); 
                    noteTextInputField_panel.addEventListener('input', handleFirstTextInputForEditSession, { once: true });
                }
            } else { 
                interactionPanelCurrentEditSessionContainer.style.display = 'none';
            }
        }
        
        updateNoteInfoPanel(noteToEdit); 
        
        if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'none'; 
        if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'flex'; 
        
        if (forceFocusToTitle && noteTitleInputField_panel && document.activeElement !== noteTitleInputField_panel) { 
            noteTitleInputField_panel.focus();
        }

        if (lastSelectedNotePreviewElement) {
            const deselectedNoteId = lastSelectedNotePreviewElement.dataset.noteId;
            const deselectedNoteData = localNotesCache.find(n => n.id === deselectedNoteId);

            lastSelectedNotePreviewElement.classList.remove('selected'); 

            if (deselectedNoteData) {
                let noteBgColor = themeSettings.appDefaultBackgroundColor;
                if (deselectedNoteData.tags && deselectedNoteData.tags.length > 0) {
                    const firstTagObject = localTagsCache.find(t => t.name === deselectedNoteData.tags[0].name.toLowerCase());
                    if (firstTagObject && firstTagObject.color) {
                        noteBgColor = firstTagObject.color;
                    }
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
                if (delIcon) {
                    delIcon.style.color = '#ef4444'; 
                }
            } else { 
                lastSelectedNotePreviewElement.style.backgroundColor = themeSettings.appDefaultBackgroundColor;
                const textColor = getTextColorForBackground(themeSettings.appDefaultBackgroundColor);
                const h4El = lastSelectedNotePreviewElement.querySelector('h4');
                const pContentEl = lastSelectedNotePreviewElement.querySelector('.note-content-preview');
                const pNotebookEl = lastSelectedNotePreviewElement.querySelector('.note-preview-notebook-name');
                if (h4El) h4El.style.color = textColor;
                if (pContentEl) pContentEl.style.color = textColor;
                if (pNotebookEl) pNotebookEl.style.color = '#6b7280';
                const favIcon = lastSelectedNotePreviewElement.querySelector('.favorite-star i');
                if (favIcon) favIcon.style.color = '#a0aec0';
                const delIcon = lastSelectedNotePreviewElement.querySelector('.delete-note-icon i');
                if (delIcon) delIcon.style.color = '#ef4444';
            }
        }

        const currentPreviewEl = document.querySelector(`.note-preview-card[data-note-id="${noteId}"]`);
        if (currentPreviewEl) {
            currentPreviewEl.style.backgroundColor = ''; 
            const h4Selected = currentPreviewEl.querySelector('h4');
            const pContentSelected = currentPreviewEl.querySelector('.note-content-preview');
            const pNotebookSelected = currentPreviewEl.querySelector('.note-preview-notebook-name');
            if(h4Selected) h4Selected.style.color = '';
            if(pContentSelected) pContentSelected.style.color = '';
            if(pNotebookSelected) pNotebookSelected.style.color = '';

            currentPreviewEl.classList.add('selected'); 

            const favoriteIconSelected = currentPreviewEl.querySelector('.favorite-star i');
            const deleteIconSelected = currentPreviewEl.querySelector('.delete-note-icon i');
            const favStarDivSelected = currentPreviewEl.querySelector('.favorite-star');

            if (favStarDivSelected && favoriteIconSelected) {
                favStarDivSelected.classList.toggle('is-favorite', noteToEdit.isFavorite || false);
                favoriteIconSelected.className = noteToEdit.isFavorite ? 'fas fa-star' : 'far fa-star';
                favoriteIconSelected.style.color = noteToEdit.isFavorite ? '#FBBF24' : '#FFFFFF';
            }
            if (deleteIconSelected) {
                deleteIconSelected.style.color = '#f87171'; 
            }

            lastSelectedNotePreviewElement = currentPreviewEl;
            currentPreviewEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    async function processInteractionPanelEditsOnDeselect(isSwitchingContext = false) { 
        if (interactionPanelCurrentEditSessionContainer && interactionPanelCurrentEditSessionContainer.style.display !== 'none' && currentInteractingNoteIdInPanel) {
            const note = localNotesCache.find(n => n.id === currentInteractingNoteIdInPanel);
            if (note) {
                const editsDescription = interactionPanelEditsMadeInputField ? interactionPanelEditsMadeInputField.value.trim() : "";
                if (editsDescription !== "" && currentEditSessionOpenTimePanel) {
                    const newEditEntry = { timestamp: Timestamp.fromDate(currentEditSessionOpenTimePanel), description: editsDescription };
                    const updatedEdits = [...(note.edits || []), newEditEntry];
                    try {
                        await updateDoc(doc(db, "notebooks", note.notebookId, "notes", currentInteractingNoteIdInPanel), { edits: updatedEdits, modifiedAt: serverTimestamp() });
                        if (interactionPanelEditsMadeInputField) interactionPanelEditsMadeInputField.value = ''; 
                    } catch (e) { console.error("Error saving edits description:", e); }
                }
            }
        }
        
        let noteBeingProcessedId = currentInteractingNoteIdInPanel || activelyCreatingNoteId; 
        if (isNewNoteSessionInPanel && !noteBeingProcessedId) { 
            if (noteTitleInputField_panel.value.trim() === "" && noteTextInputField_panel.value.trim() === "") return; 
        }

        if (activelyCreatingNoteId && noteBeingProcessedId === activelyCreatingNoteId) {
            const tempNote = localNotesCache.find(n => n.id === noteBeingProcessedId);
            if (tempNote && tempNote.title.trim() === "" && tempNote.text.trim() === "" && (!tempNote.activity || tempNote.activity.trim() === "")) {
                if(isSwitchingContext || (!noteTitleInputField_panel.value.trim() && !noteTextInputField_panel.value.trim())){ 
                    try {
                        await deleteDoc(doc(db, "notebooks", tempNote.notebookId, "notes", noteBeingProcessedId));
                        const notebookRef = doc(db, "notebooks", tempNote.notebookId);
                        const notebookSnap = await getDoc(notebookRef);
                        if (notebookSnap.exists()) {
                            await updateDoc(notebookRef, { notesCount: Math.max(0, (notebookSnap.data().notesCount || 0) - 1) });
                        }
                        if (tempNote.tags && tempNote.tags.length > 0) {
                            for (const tag of tempNote.tags) {
                                await checkAndCleanupOrphanedTag(tag.name);
                            }
                        }
                    } catch (e) { console.error("Error deleting empty new note:", e); }
                    activelyCreatingNoteId = null; 
                    return; 
                }
            }
        }
    }
    function clearInteractionPanel(processEdits = true) { 
        if (processEdits) processInteractionPanelEditsOnDeselect(true); 
        if(noteInteractionFormContainer) noteInteractionFormContainer.style.display = 'none'; 
        if(noteInteractionPanelPlaceholder) noteInteractionPanelPlaceholder.style.display = 'flex'; 
        if(interactionPanelForm) interactionPanelForm.reset(); 
        currentInteractingNoteIdInPanel = null; 
        isNewNoteSessionInPanel = false; 
        activelyCreatingNoteId = null; 
        currentEditSessionOpenTimePanel = null; 
        currentOpenNotebookIdForPanel = null; 
        currentInteractingNoteOriginalNotebookId = null; 
        hasUserStartedEditingCurrentNoteText = false;
        currentNoteTagsArrayInPanel = [];
        renderTagPills(); 
        if (lastSelectedNotePreviewElement) { 
            lastSelectedNotePreviewElement.classList.remove('selected'); 
            const deselectedNoteId = lastSelectedNotePreviewElement.dataset.noteId;
            const deselectedNoteData = localNotesCache.find(n => n.id === deselectedNoteId);
            if (deselectedNoteData) {
                let noteBgColor = themeSettings.appDefaultBackgroundColor;
                if (deselectedNoteData.tags && deselectedNoteData.tags.length > 0) {
                    const firstTagObject = localTagsCache.find(t => t.name === deselectedNoteData.tags[0].name.toLowerCase());
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
        updateNoteInfoPanel(null); 
    }
    function displayNotebookHeader(notebookId) { const notebook = localNotebooksCache.find(nb => nb.id === notebookId); if (notebook && notebookHeaderDisplay) { notebookHeaderDisplay.innerHTML = `<h3 class="text-lg font-semibold" style="color: var(--theme-bg-sidebar);">${notebook.title}</h3><p class="text-sm text-gray-600 mt-1">${notebook.purpose || 'No specific purpose defined.'}</p><div class="text-xs text-gray-500 mt-2"><span>${notebook.notesCount || 0} note(s)</span> | <span>Created: ${formatFullDateFromTimestamp(notebook.createdAt)}</span></div>`; notebookHeaderDisplay.style.display = 'block'; } else if (notebookHeaderDisplay) { notebookHeaderDisplay.style.display = 'none'; } }
    window.addEventListener('click', (event) => { if (event.target === createNotebookModal) { createNotebookModal.style.display = 'none'; createNotebookForm.reset(); currentSelectedNotebookCoverColor_create = null; } if (event.target === editTagModal) closeEditTagModal(); if (event.target === editNotebookModal) { editNotebookModal.style.display = 'none'; editNotebookForm.reset(); currentSelectedNotebookCoverColor = null; } if (event.target === confirmTagDeleteModal) closeConfirmTagDeleteModal(); if (event.target === confirmNotebookDeleteModal) closeConfirmDeleteNotebookModal(); if (event.target === confirmNoteActionModal) closeConfirmNoteActionModal(); if (event.target === confirmThemeResetModal) { if(confirmThemeResetModal) confirmThemeResetModal.style.display = 'none';} if (event.target === restoreNoteWithOptionsModal) { restoreNoteWithOptionsModal.style.display = 'none'; noteToRestoreWithOptions = null; } if (event.target === confirmEmptyTrashModal) { confirmEmptyTrashModal.style.display = 'none'; } });

    function renderAllNotesPreviews() { 
        if(!notesListScrollableArea || !noNotesMessagePreviewEl || !allNotesPageTitle) return; 
        notesListScrollableArea.innerHTML = ""; 
        let notesToDisplay; 
        if (currentFilterTag) { 
            allNotesPageTitle.textContent = `Notes tagged: "${currentFilterTag}"`; 
            notesToDisplay = localNotesCache.filter(note => note.tags && note.tags.some(t => t.name === currentFilterTag)); 
            if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none'; 
        } else if (isFavoritesViewActive) { 
            allNotesPageTitle.textContent = "Favorite Notes"; 
            notesToDisplay = localNotesCache.filter(note => note.isFavorite); 
            if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none'; 
        } else if (currentlyViewedNotebookId) { 
            const currentNb = localNotebooksCache.find(nb => nb.id === currentlyViewedNotebookId); 
            allNotesPageTitle.textContent = `Notes in "${currentNb ? currentNb.title : 'Selected Notebook'}"`; 
            notesToDisplay = localNotesCache.filter(note => note.notebookId === currentlyViewedNotebookId); 
            displayNotebookHeader(currentlyViewedNotebookId); 
        } else { 
            allNotesPageTitle.textContent = "All Notes"; 
            notesToDisplay = localNotesCache; 
            if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none'; 
        } 
        if (notesToDisplay.length === 0) { 
            if (currentFilterTag) noNotesMessagePreviewEl.textContent = `No notes with tag "${currentFilterTag}".`; 
            else if (isFavoritesViewActive) noNotesMessagePreviewEl.textContent = 'No favorite notes.'; 
            else if (currentlyViewedNotebookId) noNotesMessagePreviewEl.textContent = 'No notes in this notebook.'; 
            else noNotesMessagePreviewEl.textContent = 'No notes yet.'; 
            notesListScrollableArea.appendChild(noNotesMessagePreviewEl); 
            noNotesMessagePreviewEl.style.display = 'block'; 
            if (!isNewNoteSessionInPanel && !activelyCreatingNoteId && !currentInteractingNoteIdInPanel) clearInteractionPanel(false); 
            return; 
        } 
        noNotesMessagePreviewEl.style.display = 'none'; 
        const sortedNotes = notesToDisplay.slice().sort((a,b) => (b.modifiedAt?.toMillis?.() || new Date(b.modifiedAt).getTime()) - (a.modifiedAt?.toMillis?.() || new Date(a.modifiedAt).getTime())); 
        sortedNotes.forEach(note => { 
            const notebook = localNotebooksCache.find(nb => nb.id === note.notebookId); 
            const previewEl = document.createElement('div'); 
            previewEl.className = 'note-preview-card'; 
            const isCurrentlyTheInteractingNote = currentInteractingNoteIdInPanel === note.id && !isNewNoteSessionInPanel ; 
            let noteBgColor = themeSettings.appDefaultBackgroundColor; 
            if (note.tags && note.tags.length > 0) { 
                const firstTagObject = localTagsCache.find(t => t.name === note.tags[0].name.toLowerCase()); 
                if (firstTagObject && firstTagObject.color) noteBgColor = firstTagObject.color; 
            } 
            previewEl.style.backgroundColor = ''; 
            const h4El = document.createElement('h4'); 
            h4El.className = "font-semibold text-md truncate"; 
            const pContentEl = document.createElement('p'); 
            pContentEl.className = "text-xs mt-1 note-content-preview"; 
            const pNotebookEl = document.createElement('p'); 
            pNotebookEl.className = "text-xs mt-1 note-preview-notebook-name"; 
            
            const noteActionsDiv = document.createElement('div');
            noteActionsDiv.className = 'note-actions-container';

            const deleteDiv = document.createElement('div'); 
            deleteDiv.className = 'delete-note-icon';
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash-alt';

            const favoriteDiv = document.createElement('div'); 
            favoriteDiv.className = `favorite-star ${note.isFavorite ? 'is-favorite' : ''}`; 
            const favoriteIcon = document.createElement('i'); 
            favoriteIcon.className = note.isFavorite ? 'fas fa-star' : 'far fa-star';
            
            if (isCurrentlyTheInteractingNote) { 
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
                const maxLines = 3; 
                const linesToDisplay = lines.slice(0, maxLines); 
                previewHTML = linesToDisplay.map(line => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join('<br>'); 
                if (lines.length > maxLines) previewHTML += '...'; 
            } 
            h4El.textContent = note.title || '(Untitled Note)'; 
            pContentEl.innerHTML = previewHTML; 
            pNotebookEl.textContent = notebook ? notebook.title : 'Unknown'; 
            
            deleteDiv.appendChild(deleteIcon); 
            favoriteDiv.appendChild(favoriteIcon); 
            
            noteActionsDiv.appendChild(deleteDiv); 
            noteActionsDiv.appendChild(favoriteDiv); 

            previewEl.appendChild(h4El); 
            previewEl.appendChild(pContentEl); 
            previewEl.appendChild(pNotebookEl); 
            previewEl.appendChild(noteActionsDiv); 
            
            previewEl.addEventListener('click', (e) => { 
                if (e.target.closest('.favorite-star') || e.target.closest('.delete-note-icon')) return; 
                displayNoteInInteractionPanel(note.id); 
            }); 
            favoriteDiv.addEventListener('click', async (e) => { 
                e.stopPropagation(); 
                const noteToToggle = localNotesCache.find(n => n.id === note.id); 
                if (noteToToggle) { 
                    const newFavStatus = !noteToToggle.isFavorite; 
                    try { 
                        await updateDoc(doc(db, "notebooks", noteToToggle.notebookId, "notes", note.id), { isFavorite: newFavStatus }); 
                    } catch (err) { console.error("Error updating favorite:", err); alert("Could not update favorite."); } 
                } 
            }); 
            deleteDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                moveNoteToTrashImmediately(note.id, note.notebookId, note.title); 
            });
            notesListScrollableArea.appendChild(previewEl); 
        }); 
    }
    function renderTagsInSettings() { 
        if(!settingsTagsListContainer || !settingsNoTagsMessage) return; 
        settingsTagsListContainer.innerHTML = ''; 
        if (localTagsCache.length === 0) { 
            settingsNoTagsMessage.style.display = 'block'; 
            return; 
        } 
        settingsNoTagsMessage.style.display = 'none'; 
        localTagsCache.forEach(tagObj => { 
            const tagCard = document.createElement('div'); 
            tagCard.className = 'tag-item-display'; 
            tagCard.dataset.tagName = tagObj.name; 
            const tagColor = tagObj.color || DEFAULT_TAG_COLOR; 
            const textColor = getTextColorForBackground(tagColor); 
            tagCard.style.backgroundColor = tagColor; 
            let notesWithThisTagCount = localNotesCache.filter(note => note.tags && note.tags.some(t => t.name === tagObj.name)).length; 
            tagCard.innerHTML = `
                <div class="tag-item-header">
                    <h4 class="tag-name" style="color: ${textColor};">${tagObj.name}</h4>
                    <span class="tag-count" style="color: ${textColor};">(${notesWithThisTagCount} notes)</span>
                </div>
                <p class="tag-purpose" style="color: ${textColor};">${tagObj.purpose || '<em>No purpose.</em>'}</p>
                <div class="tag-item-actions-icons">
                    <button class="tag-action-icon edit-tag-icon-btn" data-tag-id="${tagObj.id}" title="Edit Tag"><i class="fas fa-pencil-alt"></i></button>
                    <button class="tag-action-icon delete-tag-icon-btn" data-tag-id="${tagObj.id}" data-tag-name="${tagObj.name}" title="Delete Tag"><i class="fas fa-trash-alt"></i></button>
                </div>
            `; 
            tagCard.addEventListener('click', (e) => {
                if (e.target.closest('.tag-action-icon')) return; 
                currentFilterTag = tagObj.name; 
                currentlyViewedNotebookId = null; 
                isFavoritesViewActive = false; 
                clearInteractionPanel(true); 
                switchToMainView('notes'); 
                renderAllNotesPreviews();
            });
            tagCard.querySelector('.edit-tag-icon-btn').addEventListener('click', (e) => { 
                e.stopPropagation(); 
                openEditTagModal(tagObj.id); 
            }); 
            tagCard.querySelector('.delete-tag-icon-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openConfirmDeleteTagModalFromCard(tagObj.id, tagObj.name);
            });
            settingsTagsListContainer.appendChild(tagCard); 
        }); 
    }
    function openConfirmDeleteTagModalFromCard(tagId, tagName) {
        if (!tagId || !tagName) {
            console.error("Tag ID or name missing for deletion from card.");
            return;
        }
        tagToDeleteGlobally = { id: tagId, name: tagName };
        if (tagNameToDeleteDisplay) tagNameToDeleteDisplay.textContent = tagName;
        if (confirmTagDeleteModal) confirmTagDeleteModal.style.display = 'flex';
    }
    
    async function updateGlobalTagsFromNoteInput(tagNamesArray) { 
        if (!tagNamesArray || tagNamesArray.length === 0) return [];
        const newTagObjectsForNote = [];

        for (const rawTagName of tagNamesArray) {
            const tagName = rawTagName.toLowerCase().trim(); 
            if (!tagName) continue;

            let existingTag = localTagsCache.find(t => t.name === tagName); 
            
            if (!existingTag) { 
                const tagQuery = query(collection(db, "tags"), where("name", "==", tagName), limit(1)); 
                const querySnapshot = await getDocs(tagQuery);
                if (!querySnapshot.empty) {
                    existingTag = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                    if (!localTagsCache.some(t => t.id === existingTag.id)) {
                        localTagsCache.push(existingTag); 
                    }
                }
            }

            if (!existingTag) { 
                try {
                    const newTagData = { name: tagName, color: DEFAULT_TAG_COLOR, purpose: '' }; 
                    const docRef = await addDoc(collection(db, "tags"), newTagData);
                    existingTag = { id: docRef.id, ...newTagData }; 
                    localTagsCache.push(existingTag); 
                } catch (e) { 
                    console.error("Error creating new tag:", e); 
                    continue; 
                }
            }
            newTagObjectsForNote.push({ name: existingTag.name }); 
        } 
        return newTagObjectsForNote; 
    }
    
    async function handleNoteInputChange() { 
        if (!noteTitleInputField_panel || !noteTextInputField_panel || !noteTagsContainer_panel) return; 
        let title = noteTitleInputField_panel.value.trim();
        let text = noteTextInputField_panel.value;
        let activityValue = interactionPanelActivityInputField ? interactionPanelActivityInputField.value.trim() : null;
        
        const existingNoteData = (currentInteractingNoteIdInPanel && !isNewNoteSessionInPanel ) ? localNotesCache.find(n => n.id === currentInteractingNoteIdInPanel) : null;
        
        const processedTagsForNote = currentNoteTagsArrayInPanel.map(name => ({ name }));

        if (isNewNoteSessionInPanel && !currentInteractingNoteIdInPanel) { 
            if (title === "" && text.trim() === "" && (!activityValue || activityValue === "") && currentNoteTagsArrayInPanel.length === 0) return; 
            try {
                const newNoteData = { 
                    notebookId: currentOpenNotebookIdForPanel, 
                    title: title || "Untitled Note", text, tags: processedTagsForNote, 
                    createdAt: serverTimestamp(), modifiedAt: serverTimestamp(),
                    activity: activityValue || "", edits: [], isFavorite: false 
                };
                const docRef = await addDoc(collection(db, "notebooks", currentOpenNotebookIdForPanel, "notes"), newNoteData);
                currentInteractingNoteIdInPanel = docRef.id; 
                activelyCreatingNoteId = docRef.id; 
                currentInteractingNoteOriginalNotebookId = currentOpenNotebookIdForPanel; 
                isNewNoteSessionInPanel = false; 
                
                lastSavedNoteTitleInPanel = newNoteData.title;
                lastSavedNoteTextInPanel = newNoteData.text;
                lastSavedNoteTagsInPanel = currentNoteTagsArrayInPanel.slice().sort().join(',');
                lastSavedNoteActivityInPanel = newNoteData.activity || '';
                
                const parentNotebookRef = doc(db, "notebooks", currentOpenNotebookIdForPanel);
                const parentNotebookSnap = await getDoc(parentNotebookRef);
                if (parentNotebookSnap.exists()) {
                    await updateDoc(parentNotebookRef, { notesCount: (parentNotebookSnap.data().notesCount || 0) + 1 });
                }
            } catch (e) { console.error("Error creating new note:", e); alert("Failed to save new note."); }
        } else if (currentInteractingNoteIdInPanel && existingNoteData) { 
            const selectedNotebookIdInPanel = panelNotebookSelector.value; 
            const originalNotebookIdOfNote = currentInteractingNoteOriginalNotebookId; 

            if (selectedNotebookIdInPanel && originalNotebookIdOfNote && selectedNotebookIdInPanel !== originalNotebookIdOfNote) {
                showLoadingOverlay("Moving note...");
                try {
                    const noteToMoveRef = doc(db, "notebooks", originalNotebookIdOfNote, "notes", currentInteractingNoteIdInPanel);
                    const noteSnap = await getDoc(noteToMoveRef);
                    if (!noteSnap.exists()) throw new Error("Note to move not found.");
                    const noteDataToMove = noteSnap.data();
                    
                    const wasThisTheActivelyCreatedNote = (activelyCreatingNoteId === currentInteractingNoteIdInPanel);

                    const batch = writeBatch(db);
                    const newNoteRefAfterMove = doc(collection(db, "notebooks", selectedNotebookIdInPanel, "notes")); 
                    batch.set(newNoteRefAfterMove, { ...noteDataToMove, notebookId: selectedNotebookIdInPanel, title: title || noteDataToMove.title, text, tags: processedTagsForNote, modifiedAt: serverTimestamp() });
                    batch.delete(noteToMoveRef);
                    const oldNotebookRef = doc(db, "notebooks", originalNotebookIdOfNote);
                    const oldNotebookSnap = await getDoc(oldNotebookRef); 
                    if(oldNotebookSnap.exists()) batch.update(oldNotebookRef, { notesCount: Math.max(0, (oldNotebookSnap.data().notesCount || 0) - 1) });
                    const newNotebookRefDoc = doc(db, "notebooks", selectedNotebookIdInPanel); 
                    const newNotebookSnap = await getDoc(newNotebookRefDoc); 
                    if(newNotebookSnap.exists()) batch.update(newNotebookRefDoc, { notesCount: (newNotebookSnap.data().notesCount || 0) + 1 });
                    
                    await batch.commit();
                    
                    currentInteractingNoteIdInPanel = newNoteRefAfterMove.id; 
                    currentInteractingNoteOriginalNotebookId = selectedNotebookIdInPanel;
                    currentOpenNotebookIdForPanel = selectedNotebookIdInPanel;

                    if (wasThisTheActivelyCreatedNote) {
                        activelyCreatingNoteId = newNoteRefAfterMove.id; 
                    } else {
                        activelyCreatingNoteId = null; 
                    }
                    isNewNoteSessionInPanel = false; 
                    
                    if(notebookChangeConfirmationEl) { notebookChangeConfirmationEl.textContent = `Note moved!`; setTimeout(() => { if(notebookChangeConfirmationEl) notebookChangeConfirmationEl.textContent = ''; }, 3000); }
                    displayNoteInInteractionPanel(currentInteractingNoteIdInPanel, false); 

                } catch (e) { console.error("Error moving note:", e); alert("Failed to move note."); 
                } finally { hideLoadingOverlay(); }

            } else { 
                const updates = {};
                let contentActuallyChanged = false;

                if (title !== lastSavedNoteTitleInPanel) {
                    updates.title = title;
                    contentActuallyChanged = true;
                }
                if (text !== lastSavedNoteTextInPanel) {
                    updates.text = text;
                    contentActuallyChanged = true;
                }
                const currentTagsString = currentNoteTagsArrayInPanel.slice().sort().join(',');
                if (currentTagsString !== lastSavedNoteTagsInPanel) {
                    updates.tags = processedTagsForNote;
                    contentActuallyChanged = true;
                }

                if (isAdminModeEnabled) {
                    if (interactionPanelActivityInputField && interactionPanelActivityInputField.style.display === 'block') {
                        const newActivity = interactionPanelActivityInputField.value.trim();
                        if (newActivity !== lastSavedNoteActivityInPanel) {
                            updates.activity = newActivity;
                            contentActuallyChanged = true;
                        }
                    }
                    if (interactionPanelCreationTimeInputsContainer && interactionPanelCreationTimeInputsContainer.style.display === 'flex') {
                        const dateStr = interactionPanelCreationDateInputField.value;
                        const timeStr = interactionPanelCreationTimeInputField_time.value;
                        if (dateStr && timeStr) {
                            const combinedDateTimeStr = `${dateStr}T${timeStr}`;
                            const newCreationDate = new Date(combinedDateTimeStr);
                            if (!isNaN(newCreationDate.getTime())) {
                                const newTimestamp = Timestamp.fromDate(newCreationDate);
                                if (!existingNoteData.createdAt || newTimestamp.toMillis() !== existingNoteData.createdAt.toMillis()) {
                                    updates.createdAt = newTimestamp;
                                    contentActuallyChanged = true;
                                }
                            }
                        }
                    }
                } else if (isNewNoteSessionInPanel || activelyCreatingNoteId === currentInteractingNoteIdInPanel) { 
                    if (interactionPanelActivityInputField && interactionPanelActivityInputField.style.display === 'block') {
                        const newActivity = interactionPanelActivityInputField.value.trim();
                        if (newActivity !== lastSavedNoteActivityInPanel) {
                            updates.activity = newActivity;
                            contentActuallyChanged = true;
                        }
                    }
                }
                
                if (contentActuallyChanged) {
                    updates.modifiedAt = serverTimestamp();
                    try {
                        const noteToUpdateRef = doc(db, "notebooks", originalNotebookIdOfNote, "notes", currentInteractingNoteIdInPanel);
                        await updateDoc(noteToUpdateRef, updates);
                        console.log("Note updated with changes:", updates);
                        if (updates.title !== undefined) lastSavedNoteTitleInPanel = updates.title;
                        if (updates.text !== undefined) lastSavedNoteTextInPanel = updates.text;
                        if (updates.tags !== undefined) lastSavedNoteTagsInPanel = currentTagsString;
                        if (updates.activity !== undefined) lastSavedNoteActivityInPanel = updates.activity;
                    } catch (e) {
                        console.error("Error updating note:", e);
                        alert("Failed to save note changes.");
                    }
                } else {
                    console.log("No actual content changes detected for note, skipping Firestore write.");
                }
            }
        }
        const oldTagNamesSet = new Set(lastSavedNoteTagsInPanel ? lastSavedNoteTagsInPanel.split(',') : []);
        const currentTagNamesSet = new Set(currentNoteTagsArrayInPanel);
        const tagsToCheckForOrphan = [...oldTagNamesSet].filter(name => !currentTagNamesSet.has(name));
        if (tagsToCheckForOrphan.length > 0) {
            for (const tagName of tagsToCheckForOrphan) {
                await checkAndCleanupOrphanedTag(tagName);
            }
        }
    }

    const debouncedHandleInteractionPanelInputChange = debounce(handleNoteInputChange, 1200); 
    if (noteTitleInputField_panel) noteTitleInputField_panel.addEventListener('input', debouncedHandleInteractionPanelInputChange);
    if (noteTextInputField_panel) noteTextInputField_panel.addEventListener('input', debouncedHandleInteractionPanelInputChange);
    if (interactionPanelActivityInputField) interactionPanelActivityInputField.addEventListener('input', () => {if(isAdminModeEnabled || isNewNoteSessionInPanel || activelyCreatingNoteId === currentInteractingNoteIdInPanel) debouncedHandleInteractionPanelInputChange()});
    if (interactionPanelCreationDateInputField) { 
        interactionPanelCreationDateInputField.addEventListener('input', () => {
            if(isAdminModeEnabled) debouncedHandleInteractionPanelInputChange();
        });
    }
    if (interactionPanelCreationTimeInputField_time) { 
        interactionPanelCreationTimeInputField_time.addEventListener('input', () => {
            if(isAdminModeEnabled) debouncedHandleInteractionPanelInputChange();
        });
    }
    
    if (adminModeToggle) {
        adminModeToggle.addEventListener('change', () => { 
            isAdminModeEnabled = adminModeToggle.checked; 
            if (currentInteractingNoteIdInPanel && !isNewNoteSessionInPanel) {
                displayNoteInInteractionPanel(currentInteractingNoteIdInPanel, false);
            } else if (isNewNoteSessionInPanel && !currentInteractingNoteIdInPanel) {
                const tempNotebook = localNotebooksCache.find(nb => nb.id === currentOpenNotebookIdForPanel);
                setupPanelForNewNote(currentOpenNotebookIdForPanel, tempNotebook ? tempNotebook.title : "Selected Notebook");
            }
        });
    }
    
    if (fabCreateNote) {
        fabCreateNote.addEventListener('click', async () => {
            let targetNotebookId, targetNotebookName;
            if (currentlyViewedNotebookId && !isFavoritesViewActive && !currentFilterTag) { 
                const currentNb = localNotebooksCache.find(nb => nb.id === currentlyViewedNotebookId);
                if (currentNb) { targetNotebookId = currentNb.id; targetNotebookName = currentNb.title; }
            } else { 
                const defaultNotebookForCreation = localNotebooksCache.find(nb => nb.title === "My Notes 😏") || (localNotebooksCache.length > 0 ? localNotebooksCache[0] : null);
                if (defaultNotebookForCreation) { targetNotebookId = defaultNotebookForCreation.id; targetNotebookName = defaultNotebookForCreation.title; } 
            }

            if (!targetNotebookId && localNotebooksCache.length > 0) { 
                targetNotebookId = localNotebooksCache[0].id;
                targetNotebookName = localNotebooksCache[0].title;
            }
            
            if (!targetNotebookId) { 
                alert("No notebooks exist. Please create one first (go to Notebooks page).");
                switchToMainView('notebooks'); 
                return; 
            }
            
            if (!notesContentDiv.classList.contains('main-view-content-active')) {
                switchToMainView('notes');
                if (targetNotebookId && !currentlyViewedNotebookId) { 
                    currentlyViewedNotebookId = targetNotebookId;
                    displayNotebookHeader(targetNotebookId);
                } else if (!currentlyViewedNotebookId) { 
                    if(notebookHeaderDisplay) notebookHeaderDisplay.style.display = 'none';
                    if(allNotesPageTitle) allNotesPageTitle.textContent = "All Notes";
                }
                renderAllNotesPreviews(); 
            }
            
            setupPanelForNewNote(targetNotebookId, targetNotebookName);
        });
    }

    async function initializeDefaultNotebookFirestore() { 
        const defaultNotebookName = "My Notes 😏";
        const existingDefaultQuery = query(collection(db, "notebooks"), where("title", "==", defaultNotebookName)); 
        const querySnapshot = await getDocs(existingDefaultQuery); 
        if (querySnapshot.empty) { 
            try { 
                await addDoc(collection(db, "notebooks"), { 
                    title: defaultNotebookName, 
                    purpose: "Default notebook for your quick notes.", 
                    createdAt: serverTimestamp(), 
                    notesCount: 0, 
                    coverColor: paletteColors.length > 0 ? paletteColors[0] : null 
                }); 
            } catch (e) { 
                console.error(`Error creating default '${defaultNotebookName}' notebook:`, e); 
            } 
        } 
    }
    function updatePanelNotebookSelector(selectedNotebookId = null) { if(panelNotebookSelector) { const currentSelection = panelNotebookSelector.value; panelNotebookSelector.innerHTML = ''; if (localNotebooksCache.length === 0) { const option = document.createElement('option'); option.value = ""; option.textContent = "No notebooks"; option.disabled = true; panelNotebookSelector.appendChild(option); } else { localNotebooksCache.forEach(nb => { const option = document.createElement('option'); option.value = nb.id; option.textContent = nb.title; panelNotebookSelector.appendChild(option); }); } if (selectedNotebookId) panelNotebookSelector.value = selectedNotebookId; else if (currentSelection && localNotebooksCache.some(nb => nb.id === currentSelection)) panelNotebookSelector.value = currentSelection; else if (localNotebooksCache.length > 0) panelNotebookSelector.value = localNotebooksCache[0].id; } }

    function renderTagPills() {
        if (!noteTagsContainer_panel || !noteTagsInputField_panel) return;
        const pills = noteTagsContainer_panel.querySelectorAll('.tag-pill');
        pills.forEach(pill => pill.remove());

        currentNoteTagsArrayInPanel.forEach(tagName => {
            const tagPill = document.createElement('span');
            tagPill.className = 'tag-pill inline-flex items-center mr-1 mb-1'; 
            tagPill.textContent = tagName;

            const tagData = localTagsCache.find(t => t.name === tagName.toLowerCase());
            const tagColor = tagData?.color || DEFAULT_TAG_COLOR; 
            const textColor = getTextColorForBackground(tagColor);

            tagPill.style.backgroundColor = tagColor;
            tagPill.style.color = textColor;
            tagPill.style.padding = '0.125rem 0.5rem'; 
            tagPill.style.borderRadius = '9999px'; 
            tagPill.style.fontSize = '0.75rem';
            tagPill.style.lineHeight = '1rem';

            const removeBtn = document.createElement('span');
            removeBtn.className = 'tag-pill-remove ml-1.5 cursor-pointer';
            removeBtn.innerHTML = '&times;';
            removeBtn.style.opacity = '0.7';
            removeBtn.onmouseover = () => removeBtn.style.opacity = '1';
            removeBtn.onmouseout = () => removeBtn.style.opacity = '0.7';

            removeBtn.addEventListener('click', () => {
                currentNoteTagsArrayInPanel = currentNoteTagsArrayInPanel.filter(t => t !== tagName);
                renderTagPills(); 
                debouncedHandleInteractionPanelInputChange(); 
            });

            tagPill.appendChild(removeBtn);
            noteTagsContainer_panel.insertBefore(tagPill, noteTagsInputField_panel); 
        });
        noteTagsInputField_panel.value = ''; 
    }

    if (noteTagsInputField_panel) {
        noteTagsInputField_panel.addEventListener('keydown', async (event) => {
            if (event.key === ',' || event.key === 'Enter') {
                event.preventDefault();
                if (currentNoteTagsArrayInPanel.length >= 5) {
                    alert("A note can have a maximum of 5 tags.");
                    noteTagsInputField_panel.value = ''; 
                    return;
                }
                const newTagName = noteTagsInputField_panel.value.trim().toLowerCase();
                if (newTagName && !currentNoteTagsArrayInPanel.includes(newTagName)) {
                    currentNoteTagsArrayInPanel.push(newTagName);
                    await updateGlobalTagsFromNoteInput([newTagName]); 
                    renderTagPills();
                    debouncedHandleInteractionPanelInputChange();
                }
                noteTagsInputField_panel.value = '';
            } else if (event.key === 'Backspace' && noteTagsInputField_panel.value === '' && currentNoteTagsArrayInPanel.length > 0) {
                event.preventDefault();
                currentNoteTagsArrayInPanel.pop(); 
                renderTagPills();
                debouncedHandleInteractionPanelInputChange();
            }
        });
        noteTagsInputField_panel.addEventListener('blur', () => {
            const newTagName = noteTagsInputField_panel.value.trim().toLowerCase();
            if (newTagName) {
                if (currentNoteTagsArrayInPanel.length >= 5 && !currentNoteTagsArrayInPanel.includes(newTagName)) {
                    alert("A note can have a maximum of 5 tags.");
                } else if (!currentNoteTagsArrayInPanel.includes(newTagName)) {
                    currentNoteTagsArrayInPanel.push(newTagName);
                    updateGlobalTagsFromNoteInput([newTagName]).then(() => { 
                        renderTagPills();
                        debouncedHandleInteractionPanelInputChange();
                    });
                } else { 
                   debouncedHandleInteractionPanelInputChange();
                }
            } else { 
                debouncedHandleInteractionPanelInputChange();
            }
            noteTagsInputField_panel.value = ''; 
        });
    }

    function renderDeletedNotesList() {
        if (!deletedNotesListContainer || !noDeletedNotesMessage || !emptyTrashBtn) return;
        deletedNotesListContainer.innerHTML = '';

        if (localDeletedNotesCache.length === 0) {
            noDeletedNotesMessage.style.display = 'block';
            emptyTrashBtn.disabled = true;
            return;
        }
        noDeletedNotesMessage.style.display = 'none';
        emptyTrashBtn.disabled = false;

        localDeletedNotesCache.forEach(deletedNote => {
            const card = document.createElement('div');
            card.className = 'deleted-note-card'; 
            card.style.backgroundColor = themeSettings.appDefaultBackgroundColor;

            const textColor = getTextColorForBackground(themeSettings.appDefaultBackgroundColor);

            let previewHTML = '<em>No content</em>';
            if (deletedNote.text && deletedNote.text.trim() !== "") {
                const lines = deletedNote.text.split('\n');
                const maxLines = 1; 
                const linesToDisplay = lines.slice(0, maxLines);
                previewHTML = linesToDisplay.map(line => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join('<br>');
                if (lines.length > maxLines) previewHTML += '...';
            }
            
            card.innerHTML = `
                <div>
                    <h4 class="font-semibold" style="color: ${textColor};">${deletedNote.title || '(Untitled Note)'}</h4>
                    <p class="note-content-preview" style="color: ${textColor};">${previewHTML}</p>
                </div>
                <div class="deleted-note-info-container">
                    <span class="deleted-note-original-notebook">From: ${deletedNote.originalNotebookName || 'N/A'}</span>
                    <span class="deleted-note-timestamp">Deleted: ${formatDateFromTimestamp(deletedNote.deletedAt)}</span>
                </div>
                <div class="note-actions-container">
                    <div class="restore-note-icon" title="Restore Note"><i class="fas fa-trash-restore-alt"></i></div>
                    <div class="permanent-delete-note-icon" title="Delete Permanently"><i class="fas fa-eraser"></i></div>
                </div>
            `;

            card.querySelector('.restore-note-icon').addEventListener('click', (e) => {
                e.stopPropagation();
                handleRestoreNote(deletedNote.id);
            });
            card.querySelector('.permanent-delete-note-icon').addEventListener('click', (e) => {
                e.stopPropagation();
                openConfirmNoteActionModal('deletePermanently', deletedNote.id, null, deletedNote.title, true);
            });
            deletedNotesListContainer.appendChild(card);
        });
    }

    async function handleRestoreNote(deletedNoteId) {
        noteToRestoreWithOptions = localDeletedNotesCache.find(dn => dn.id === deletedNoteId);
        if (!noteToRestoreWithOptions) {
            alert("Error: Deleted note not found.");
            return;
        }

        const originalNotebookExists = localNotebooksCache.some(nb => nb.id === noteToRestoreWithOptions.originalNotebookId);

        if (originalNotebookExists) {
            showLoadingOverlay("Restoring note...");
            try {
                const noteDataToRestore = { ...noteToRestoreWithOptions };
                delete noteDataToRestore.id; 
                delete noteDataToRestore.deletedAt;
                delete noteDataToRestore.originalNoteId; 
                noteDataToRestore.notebookId = noteToRestoreWithOptions.originalNotebookId;
                delete noteDataToRestore.originalNotebookName;
                noteDataToRestore.modifiedAt = serverTimestamp(); 

                const batch = writeBatch(db);
                const newNoteRef = doc(collection(db, "notebooks", noteDataToRestore.notebookId, "notes"));
                batch.set(newNoteRef, noteDataToRestore);
                batch.delete(doc(db, "deleted_notes", deletedNoteId));
                
                const notebookRef = doc(db, "notebooks", noteDataToRestore.notebookId);
                const notebookSnap = await getDoc(notebookRef);
                if (notebookSnap.exists()) {
                    batch.update(notebookRef, { notesCount: (notebookSnap.data().notesCount || 0) + 1 });
                }
                await batch.commit();
                if (noteDataToRestore.tags && noteDataToRestore.tags.length > 0) {
                    const tagNames = noteDataToRestore.tags.map(t => t.name);
                    await updateGlobalTagsFromNoteInput(tagNames);
                }
            } catch (e) {
                console.error("Error restoring note:", e);
                alert("Failed to restore note.");
            } finally {
                hideLoadingOverlay();
            }
        } else {
            if (restoreNoteOptionsMessage) restoreNoteOptionsMessage.textContent = `The original notebook "${noteToRestoreWithOptions.originalNotebookName || 'Unknown'}" for this note no longer exists.`;
            if (restoreToNewNotebookBtn) restoreToNewNotebookBtn.textContent = `Create new notebook "${noteToRestoreWithOptions.originalNotebookName || 'Restored Notes'}" and restore here`;
            
            if (restoreToExistingNotebookSelector) {
                restoreToExistingNotebookSelector.innerHTML = '';
                if (localNotebooksCache.length > 0) {
                    localNotebooksCache.forEach(nb => {
                        const option = document.createElement('option');
                        option.value = nb.id;
                        option.textContent = nb.title;
                        restoreToExistingNotebookSelector.appendChild(option);
                    });
                    restoreToExistingNotebookSelector.disabled = false;
                    restoreToSelectedNotebookBtn.disabled = false;
                } else {
                    const option = document.createElement('option');
                    option.textContent = "No existing notebooks";
                    restoreToExistingNotebookSelector.appendChild(option);
                    restoreToExistingNotebookSelector.disabled = true;
                    restoreToSelectedNotebookBtn.disabled = true;
                }
            }
            if (restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'flex';
        }
    }
    
    if (closeRestoreNoteWithOptionsModalBtn) closeRestoreNoteWithOptionsModalBtn.addEventListener('click', () => { if(restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'none'; noteToRestoreWithOptions = null; });
    if (cancelRestoreWithOptionsBtn) cancelRestoreWithOptionsBtn.addEventListener('click', () => { if(restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'none'; noteToRestoreWithOptions = null; });

    if (restoreToNewNotebookBtn) {
        restoreToNewNotebookBtn.addEventListener('click', async () => {
            if (!noteToRestoreWithOptions) return;
            showLoadingOverlay("Creating notebook and restoring note...");
            try {
                const newNotebookTitle = noteToRestoreWithOptions.originalNotebookName || "Restored Notes";
                let targetNotebookId = localNotebooksCache.find(nb => nb.title === newNotebookTitle)?.id;

                if (!targetNotebookId) {
                    const newNotebookData = {
                        title: newNotebookTitle,
                        purpose: "Created for restored notes.",
                        createdAt: serverTimestamp(),
                        notesCount: 0,
                        coverColor: paletteColors.length > 0 ? paletteColors[0] : null
                    };
                    const newNotebookRef = await addDoc(collection(db, "notebooks"), newNotebookData);
                    targetNotebookId = newNotebookRef.id;
                }
                
                const noteDataToRestore = { ...noteToRestoreWithOptions };
                delete noteDataToRestore.id;
                delete noteDataToRestore.deletedAt;
                delete noteDataToRestore.originalNoteId;
                noteDataToRestore.notebookId = targetNotebookId; 
                delete noteDataToRestore.originalNotebookName;
                noteDataToRestore.modifiedAt = serverTimestamp();

                const batch = writeBatch(db);
                const newNoteRef = doc(collection(db, "notebooks", targetNotebookId, "notes"));
                batch.set(newNoteRef, noteDataToRestore);
                batch.delete(doc(db, "deleted_notes", noteToRestoreWithOptions.id));
                
                const notebookRef = doc(db, "notebooks", targetNotebookId);
                const notebookSnap = await getDoc(notebookRef);
                if (notebookSnap.exists()) {
                    batch.update(notebookRef, { notesCount: (notebookSnap.data().notesCount || 0) + 1 });
                }
                await batch.commit();
                if (noteDataToRestore.tags && noteDataToRestore.tags.length > 0) {
                    const tagNames = noteDataToRestore.tags.map(t => t.name);
                    await updateGlobalTagsFromNoteInput(tagNames);
                }
                if(restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'none';
                noteToRestoreWithOptions = null;
            } catch (e) { console.error("Error creating notebook and restoring note:", e); alert("Failed to restore note.");
            } finally { hideLoadingOverlay(); }
        });
    }

    if (restoreToSelectedNotebookBtn) {
        restoreToSelectedNotebookBtn.addEventListener('click', async () => {
            if (!noteToRestoreWithOptions || !restoreToExistingNotebookSelector.value) return;
            const targetNotebookId = restoreToExistingNotebookSelector.value;
            showLoadingOverlay("Restoring note...");
            try {
                const noteDataToRestore = { ...noteToRestoreWithOptions };
                delete noteDataToRestore.id;
                delete noteDataToRestore.deletedAt;
                delete noteDataToRestore.originalNoteId;
                noteDataToRestore.notebookId = targetNotebookId;
                delete noteDataToRestore.originalNotebookName;
                noteDataToRestore.modifiedAt = serverTimestamp();

                const batch = writeBatch(db);
                const newNoteRef = doc(collection(db, "notebooks", targetNotebookId, "notes"));
                batch.set(newNoteRef, noteDataToRestore);
                batch.delete(doc(db, "deleted_notes", noteToRestoreWithOptions.id));
                
                const notebookRef = doc(db, "notebooks", targetNotebookId);
                const notebookSnap = await getDoc(notebookRef);
                if (notebookSnap.exists()) {
                    batch.update(notebookRef, { notesCount: (notebookSnap.data().notesCount || 0) + 1 });
                }
                await batch.commit();
                 if (noteDataToRestore.tags && noteDataToRestore.tags.length > 0) {
                    const tagNames = noteDataToRestore.tags.map(t => t.name);
                    await updateGlobalTagsFromNoteInput(tagNames);
                }
                if(restoreNoteWithOptionsModal) restoreNoteWithOptionsModal.style.display = 'none';
                noteToRestoreWithOptions = null;
            } catch (e) { console.error("Error restoring note to selected notebook:", e); alert("Failed to restore note.");
            } finally { hideLoadingOverlay(); }
        });
    }
    
    if (emptyTrashBtn) {
        emptyTrashBtn.addEventListener('click', () => {
            if (localDeletedNotesCache.length > 0 && confirmEmptyTrashModal) {
                confirmEmptyTrashModal.style.display = 'flex';
            }
        });
    }
    if (closeConfirmEmptyTrashModalBtn) closeConfirmEmptyTrashModalBtn.addEventListener('click', () => { if(confirmEmptyTrashModal) confirmEmptyTrashModal.style.display = 'none';});
    if (cancelEmptyTrashBtn) cancelEmptyTrashBtn.addEventListener('click', () => { if(confirmEmptyTrashModal) confirmEmptyTrashModal.style.display = 'none';});
    if (executeEmptyTrashBtn) {
        executeEmptyTrashBtn.addEventListener('click', async () => {
            if (localDeletedNotesCache.length === 0) return;
            showLoadingOverlay("Emptying Trash...");
            try {
                const batch = writeBatch(db);
                localDeletedNotesCache.forEach(note => {
                    batch.delete(doc(db, "deleted_notes", note.id));
                });
                await batch.commit();
            } catch (e) {
                console.error("Error emptying trash:", e);
                alert("Failed to empty trash.");
            } finally {
                hideLoadingOverlay();
                if(confirmEmptyTrashModal) confirmEmptyTrashModal.style.display = 'none';
            }
        });
    }

    function populateExportNotebookSelector() {
        if (!exportNotebookSelector) return;
        exportNotebookSelector.innerHTML = ''; 
        if (localNotebooksCache.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No notebooks available to export";
            option.disabled = true;
            exportNotebookSelector.appendChild(option);
            if (exportNotebookBtn) exportNotebookBtn.disabled = true;
        } else {
            localNotebooksCache.forEach(notebook => {
                const option = document.createElement('option');
                option.value = notebook.id;
                option.textContent = notebook.title;
                exportNotebookSelector.appendChild(option);
            });
            if (exportNotebookBtn) exportNotebookBtn.disabled = false;
        }
        if (exportStatusMessage) exportStatusMessage.textContent = '';
    }

    if (exportNotebookBtn) {
        exportNotebookBtn.addEventListener('click', async () => {
            if (!exportNotebookSelector || !exportStatusMessage) return;

            const selectedNotebookId = exportNotebookSelector.value;
            if (!selectedNotebookId) {
                exportStatusMessage.textContent = "Please select a notebook to export.";
                exportStatusMessage.style.color = 'red';
                return;
            }

            exportStatusMessage.textContent = "Preparing export...";
            exportStatusMessage.style.color = 'var(--theme-bg-sidebar)';
            exportNotebookBtn.disabled = true;

            try {
                const notebookToExport = localNotebooksCache.find(nb => nb.id === selectedNotebookId);
                if (!notebookToExport) {
                    throw new Error("Selected notebook not found in local cache.");
                }

                const notesCollectionRef = collection(db, "notebooks", selectedNotebookId, "notes");
                const notesSnapshot = await getDocs(notesCollectionRef);
                const notesForExport = [];
                notesSnapshot.forEach(noteDoc => {
                    const noteData = noteDoc.data();
                    notesForExport.push({
                        noteId: noteDoc.id,
                        title: noteData.title || "",
                        text: noteData.text || "",
                        tags: noteData.tags || [], 
                        createdAt: convertTimestampToISO(noteData.createdAt),
                        modifiedAt: convertTimestampToISO(noteData.modifiedAt),
                        activity: noteData.activity || "",
                        isFavorite: noteData.isFavorite || false,
                        edits: (noteData.edits || []).map(edit => ({
                            timestamp: convertTimestampToISO(edit.timestamp),
                            description: edit.description || ""
                        }))
                    });
                });

                const exportData = {
                    notebookId: notebookToExport.id,
                    title: notebookToExport.title,
                    purpose: notebookToExport.purpose || "",
                    coverColor: notebookToExport.coverColor || null,
                    createdAt: convertTimestampToISO(notebookToExport.createdAt),
                    notes: notesForExport
                };

                const jsonString = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const filename = `${sanitizeFilename(notebookToExport.title)}_export.json`;
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                exportStatusMessage.textContent = `Exported "${notebookToExport.title}" successfully!`;
                exportStatusMessage.style.color = 'var(--theme-bg-button-primary)';

            } catch (error) {
                console.error("Error exporting notebook:", error);
                exportStatusMessage.textContent = "Error exporting notebook. Please try again.";
                exportStatusMessage.style.color = 'red';
            } finally {
                exportNotebookBtn.disabled = false;
            }
        });
    }
    
    renderTagsInSettings(); 
    clearInteractionPanel(false); 
    
});
