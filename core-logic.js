// core-logic.js (v6.0.4 - Cleaned Exports)

// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { 
    getFirestore, collection, collectionGroup, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, setDoc,
    query, where, onSnapshot, orderBy, serverTimestamp, Timestamp, writeBatch, runTransaction, limit, startAfter 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"; 

// ==========================================================================================
// Firebase configuration
// ==========================================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAY7KNDAumnpPEFQXAJuYeu2Kpw1tkDC30", // Replace with your actual API key
    authDomain: "ac-notebook-test.firebaseapp.com",
    projectId: "ac-notebook-test",
    storageBucket: "ac-notebook-test.appspot.com", 
    messagingSenderId: "665546838164",
    appId: "1:665546838164:web:5be5cb5f7ae60dc8d3e481",
    measurementId: "G-KB3MYMNTQC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Constants ---
const PLACEHOLDER_USER_ID = "Admintesting";
const APP_DATA_COLLECTION_NAME = "app_data";
const MEMOIR_DOCUMENT_NAME = "Memoir";
const userAppMemoirDocPath = `users/${PLACEHOLDER_USER_ID}/${APP_DATA_COLLECTION_NAME}/${MEMOIR_DOCUMENT_NAME}`;

// --- Data Storage & State Variables ---
let localNotebooksCache = []; 
let localNotesCache = []; 
let localTagsCache = []; 
let localDeletedNotesCache = [];

const initialDefaultThemeColors = [ "#047857", "#10b981", "#34d399", "#f0fdfa" ];
const initialThemeSettings = { 
    themeSidebarBg: initialDefaultThemeColors[0],
    themeButtonPrimary: initialDefaultThemeColors[1],
    themeBorderAccent: initialDefaultThemeColors[2],
    appDefaultBackgroundColor: initialDefaultThemeColors[3],
    defaultHomepage: "notebooks",
    viewMode: "compact" 
};
const initialPaletteColors = ["#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#fde047", "#facc15", "#eab308", "#f3f4f6"]; 

let themeSettings = { ...initialThemeSettings }; 
let paletteColors = [...initialPaletteColors]; 
let defaultThemeColorsFromDB = [...initialDefaultThemeColors];
let DEFAULT_TAG_COLOR = themeSettings.appDefaultBackgroundColor; 

let currentOpenNotebookIdForPanel = null; 
let currentInteractingNoteIdInPanel = null; 
let currentInteractingNoteOriginalNotebookId = null; 
let isNewNoteSessionInPanel = false; 
let activelyCreatingNoteId = null; 
let currentEditSessionOpenTimePanel = null; 
let currentEditSessionEntryId = null; 
let currentlyViewedNotebookId = null; 
let currentFilterTag = null; 
let tagToDeleteGlobally = { id: null, name: null }; 
let notebookToDeleteGlobally = { id: null, name: null }; 
let noteActionContext = { type: null, id: null, notebookId: null, title: null, isDeletedNote: false }; 
let noteToRestoreWithOptions = null; 
let isFavoritesViewActive = false; 
const PALETTE_BASE_LIMIT = 15;
let initialViewDetermined = false; 

let lastSavedNoteTextInPanel = "";
let lastSavedNoteTitleInPanel = "";
let lastSavedNoteTagsInPanel = ""; 
let lastSavedNoteActivityInPanel = "";
let currentNoteTagsArrayInPanel = []; 

// Lazy Loading State
let lastFetchedNoteDoc = null; 
let isLoadingMoreNotes = false;
let noMoreNotesToLoad = false;
const NOTES_BATCH_SIZE = 15; 
let currentNotesQueryBase = null; 
let currentNotesQueryConstraints = []; 
let unsubscribeCurrentNotesListener = null; 
let currentSearchTerm = '';

// Unsubscribe functions for listeners
let unsubscribeAppSettings = null;
let unsubscribeNotebooks = null;
let unsubscribeTags = null;
let unsubscribeDeletedNotes = null;

// --- UI Callback Object ---
// This object will be populated by ui-handlers.js
const uiRefreshCallbacks = {
    renderAllNotesPreviews: () => console.warn("CB: renderAllNotesPreviews not set"),
    renderNotebooksOnPage: () => console.warn("CB: renderNotebooksOnPage not set"),
    renderTagsInSettings: () => console.warn("CB: renderTagsInSettings not set"),
    renderDeletedNotesList: () => console.warn("CB: renderDeletedNotesList not set"),
    updatePanelNotebookSelector: () => console.warn("CB: updatePanelNotebookSelector not set"),
    displayNotebookHeader: (id) => console.warn("CB: displayNotebookHeader not set for ID:", id),
    applyThemeSettings: () => console.warn("CB: applyThemeSettings not set"),
    renderPaletteColors: () => console.warn("CB: renderPaletteColors not set"),
    updatePaletteLimitMessage: () => console.warn("CB: updatePaletteLimitMessage not set"),
    updateNoteInfoPanel: (note) => console.warn("CB: updateNoteInfoPanel not set for note:", note),
    renderTagPillsInPanel: () => console.warn("CB: renderTagPillsInPanel not set"),
    switchToMainView: (view, context) => console.warn("CB: switchToMainView not set for:", view, context),
    clearInteractionPanel: (processEdits) => console.warn("CB: clearInteractionPanel not set, processEdits:", processEdits),
    populateExportNotebookSelector: () => console.warn("CB: populateExportNotebookSelector not set"),
    hideLoadingOverlay: () => console.warn("CB: hideLoadingOverlay not set"),
    showLoadingOverlay: (msg) => console.warn("CB: showLoadingOverlay not set for msg:", msg),
    updateViewModeRadios: () => console.warn("CB: updateViewModeRadios not set"),
    updateAutosaveStatus: (status, message) => console.warn("CB: updateAutosaveStatus not set for:", status, message),
};

// Function for ui-handlers.js to register its callback implementations
function setUIRefreshCallbacks(callbacks) {
    Object.assign(uiRefreshCallbacks, callbacks);
    console.log("UI Refresh Callbacks Registered in Core Logic:", uiRefreshCallbacks);
}


// --- Helper Functions (Data-related) ---
function convertTimestampToISO(timestamp) {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) return timestamp.toDate().toISOString();
    if (timestamp instanceof Date) return timestamp.toISOString();
    const date = new Date(timestamp); 
    return isNaN(date.getTime()) ? null : date.toISOString();
}
function debounce(func, delay) { let t;return(...e)=>{clearTimeout(t),t=setTimeout(()=>func.apply(this,e),delay)}}


// --- Firestore Data Listeners & Lazy Loading ---
function setupNotesListenerAndLoadInitialBatch() {
    localNotesCache = []; 
    lastFetchedNoteDoc = null;
    noMoreNotesToLoad = false;
    isLoadingMoreNotes = false; 

    if (unsubscribeCurrentNotesListener) {
        unsubscribeCurrentNotesListener(); 
        unsubscribeCurrentNotesListener = null;
    }

    const userAppDocRef = doc(db, userAppMemoirDocPath);
    currentNotesQueryConstraints = []; 

    if (currentlyViewedNotebookId) {
        currentNotesQueryBase = collection(userAppDocRef, "notebooks", currentlyViewedNotebookId, "notes");
    } else {
        currentNotesQueryBase = collectionGroup(db, "notes");
        currentNotesQueryConstraints.push(where("userId", "==", PLACEHOLDER_USER_ID));
        if (isFavoritesViewActive) {
            currentNotesQueryConstraints.push(where("isFavorite", "==", true));
        } else if (currentFilterTag) {
            currentNotesQueryConstraints.push(where("tags", "array-contains", { name: currentFilterTag }));
        }
    }
    
    const initialQuery = query(
        currentNotesQueryBase, 
        ...currentNotesQueryConstraints, 
        orderBy("modifiedAt", "desc"), 
        limit(NOTES_BATCH_SIZE)
    );

    unsubscribeCurrentNotesListener = onSnapshot(initialQuery, (querySnapshot) => {
        const newNotesBatch = [];
        querySnapshot.forEach((noteDoc) => {
            const data = noteDoc.data();
            newNotesBatch.push({ 
                id: noteDoc.id, ...data, userId: data.userId || PLACEHOLDER_USER_ID, 
                notebookId: data.notebookId || noteDoc.ref.parent.parent.id, 
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
                modifiedAt: data.modifiedAt?.toDate ? data.modifiedAt.toDate() : (data.modifiedAt ? new Date(data.modifiedAt) : new Date()),
                edits: (data.edits || []).map(edit => ({ 
                    ...edit, 
                    id: edit.id || doc(collection(db, '_placeholder')).id, 
                    timestamp: edit.timestamp?.toDate ? edit.timestamp.toDate() : (edit.timestamp ? new Date(edit.timestamp) : new Date()) 
                }))
            });
        });
        localNotesCache = newNotesBatch; 
        if (querySnapshot.docs.length > 0) lastFetchedNoteDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        else lastFetchedNoteDoc = null;
        noMoreNotesToLoad = querySnapshot.docs.length < NOTES_BATCH_SIZE;
        
        uiRefreshCallbacks.renderAllNotesPreviews(); 
        const currentNoteInBatch = localNotesCache.find(n => n.id === currentInteractingNoteIdInPanel);
        if (currentNoteInBatch) {
            uiRefreshCallbacks.updateNoteInfoPanel(currentNoteInBatch);
        }
        isLoadingMoreNotes = false; 
        uiRefreshCallbacks.hideLoadingOverlay();
    }, (error) => {
        console.error("Error fetching initial notes batch: ", error);
        isLoadingMoreNotes = false; uiRefreshCallbacks.hideLoadingOverlay();
    });
}

async function fetchMoreNotes() {
    if (isLoadingMoreNotes || noMoreNotesToLoad || !lastFetchedNoteDoc || !currentNotesQueryBase) return;
    isLoadingMoreNotes = true;
    const nextQuery = query(
        currentNotesQueryBase, ...currentNotesQueryConstraints,
        orderBy("modifiedAt", "desc"), startAfter(lastFetchedNoteDoc), limit(NOTES_BATCH_SIZE)
    );
    try {
        const querySnapshot = await getDocs(nextQuery);
        const newNotesBatch = [];
        querySnapshot.forEach((noteDoc) => { 
            const data = noteDoc.data();
            newNotesBatch.push({ 
                id: noteDoc.id, ...data, userId: data.userId || PLACEHOLDER_USER_ID,
                notebookId: data.notebookId || noteDoc.ref.parent.parent.id, 
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
                modifiedAt: data.modifiedAt?.toDate ? data.modifiedAt.toDate() : (data.modifiedAt ? new Date(data.modifiedAt) : new Date()),
                edits: (data.edits || []).map(edit => ({ 
                    ...edit, 
                    id: edit.id || doc(collection(db, '_placeholder')).id,
                    timestamp: edit.timestamp?.toDate ? edit.timestamp.toDate() : (edit.timestamp ? new Date(edit.timestamp) : new Date()) 
                }))
            });
        });
        if (newNotesBatch.length > 0) {
            localNotesCache = [...localNotesCache, ...newNotesBatch]; 
            lastFetchedNoteDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        }
        noMoreNotesToLoad = newNotesBatch.length < NOTES_BATCH_SIZE;
        uiRefreshCallbacks.renderAllNotesPreviews(); 
    } catch (error) { console.error("Error fetching more notes:", error);
    } finally { isLoadingMoreNotes = false; }
}

async function initializeDataListeners() {
    uiRefreshCallbacks.showLoadingOverlay("Loading App Data...");
    try {
        const appSettingsPath = `${userAppMemoirDocPath}/app_settings/user_specific_settings`;
        const appSettingsRef = doc(db, appSettingsPath);
        unsubscribeAppSettings = onSnapshot(appSettingsRef, async (docSnap) => {
            if (docSnap.exists()) {
                const settingsData = docSnap.data();
                Object.assign(themeSettings, settingsData); 
                paletteColors = settingsData.paletteColors || [...initialPaletteColors]; 
                defaultThemeColorsFromDB = settingsData.defaultThemeColors || [...initialDefaultThemeColors]; 
            } else { 
                themeSettings = { ...initialThemeSettings }; paletteColors = [...initialPaletteColors]; defaultThemeColorsFromDB = [...initialDefaultThemeColors];
                try { 
                    const memoirAppDocRef = doc(db, userAppMemoirDocPath);
                    await setDoc(memoirAppDocRef, { initializedAt: serverTimestamp(), appName: "Memoir Notes" }, {merge: true}); 
                    await setDoc(appSettingsRef, { ...initialThemeSettings, paletteColors: [...initialPaletteColors], defaultThemeColors: [...initialDefaultThemeColors] }); 
                } catch (e) { console.error("Error creating default user app settings:", e); }
            }
            DEFAULT_TAG_COLOR = themeSettings.appDefaultBackgroundColor; 
            uiRefreshCallbacks.applyThemeSettings(); uiRefreshCallbacks.renderPaletteColors(); 
            uiRefreshCallbacks.updatePaletteLimitMessage(); uiRefreshCallbacks.updateViewModeRadios();
            if (!initialViewDetermined && db) {
                uiRefreshCallbacks.switchToMainView(themeSettings.defaultHomepage);
                if (themeSettings.defaultHomepage === 'notes' || themeSettings.defaultHomepage === 'favorites') {
                    isFavoritesViewActive = themeSettings.defaultHomepage === 'favorites';
                    currentlyViewedNotebookId = null; currentFilterTag = null;
                    setupNotesListenerAndLoadInitialBatch(); 
                } else if (themeSettings.defaultHomepage === 'trash') uiRefreshCallbacks.renderDeletedNotesList(); 
                initialViewDetermined = true;
            } else if (document.getElementById('notes-content')?.classList.contains('main-view-content-active')) {
                 setupNotesListenerAndLoadInitialBatch(); 
            }
            uiRefreshCallbacks.hideLoadingOverlay();
        }, (error) => { 
            console.error("Error fetching app settings:", error);
            themeSettings = { ...initialThemeSettings }; paletteColors = [...initialPaletteColors]; defaultThemeColorsFromDB = [...initialDefaultThemeColors];
            uiRefreshCallbacks.applyThemeSettings(); uiRefreshCallbacks.renderPaletteColors(); uiRefreshCallbacks.updatePaletteLimitMessage();
            if (!initialViewDetermined && db) { uiRefreshCallbacks.switchToMainView(themeSettings.defaultHomepage); initialViewDetermined = true; }
            uiRefreshCallbacks.hideLoadingOverlay();
        });

        const notebooksCollectionPath = `${userAppMemoirDocPath}/notebooks`;
        unsubscribeNotebooks = onSnapshot(query(collection(db, notebooksCollectionPath), orderBy("createdAt", "desc")), (querySnapshot) => {
            localNotebooksCache = querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt) }));
            uiRefreshCallbacks.renderNotebooksOnPage(); uiRefreshCallbacks.updatePanelNotebookSelector(); 
            if (currentlyViewedNotebookId) uiRefreshCallbacks.displayNotebookHeader(currentlyViewedNotebookId);
            uiRefreshCallbacks.updatePaletteLimitMessage(); uiRefreshCallbacks.populateExportNotebookSelector(); 
            if (localNotebooksCache.length === 0 && !querySnapshot.metadata.hasPendingWrites) initializeDefaultNotebookFirestore(); 
        }, (error) => { console.error("Error fetching notebooks: ", error); alert("Error loading notebooks."); });
        
        const tagsCollectionPath = `${userAppMemoirDocPath}/tags`;
        unsubscribeTags = onSnapshot(query(collection(db, tagsCollectionPath), orderBy("name")), (querySnapshot) => {
            const tagMap = new Map(); 
            querySnapshot.forEach(d => { const td = { id: d.id, ...d.data() }; if (td.name) { td.name = td.name.toLowerCase(); if (!tagMap.has(td.name)) tagMap.set(td.name, td); }});
            localTagsCache = Array.from(tagMap.values()); 
            uiRefreshCallbacks.renderTagsInSettings(); 
            if (currentInteractingNoteIdInPanel) uiRefreshCallbacks.renderTagPillsInPanel(); 
        }, (error) => { console.error("Error fetching tags: ", error); alert("Error loading tags."); });

        const deletedNotesCollectionPath = `${userAppMemoirDocPath}/deleted_notes`;
        unsubscribeDeletedNotes = onSnapshot(query(collection(db, deletedNotesCollectionPath), orderBy("deletedAt", "desc")), (querySnapshot) => {
            localDeletedNotesCache = querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), 
                deletedAt: d.data().deletedAt?.toDate ? d.data().deletedAt.toDate() : new Date(),
                createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt),
                modifiedAt: d.data().modifiedAt?.toDate ? d.data().modifiedAt.toDate() : new Date(d.data().modifiedAt),
            }));
            if (document.getElementById('trash-content')?.classList.contains('main-view-content-active')) uiRefreshCallbacks.renderDeletedNotesList();
        }, (error) => { console.error("Error fetching deleted notes: ", error); alert("Error loading deleted notes."); });
    } catch (caughtError) { console.error("FATAL Error during initial listener setup phase:", caughtError); alert("A critical error occurred."); uiRefreshCallbacks.hideLoadingOverlay(); }
}

// --- Data Manipulation Functions ---
async function saveAppSettings(settingsToSave) { 
    try {
        const appSettingsPath = `${userAppMemoirDocPath}/app_settings/user_specific_settings`;
        await setDoc(doc(db, appSettingsPath), settingsToSave, { merge: true });
    } catch (e) { console.error("Error saving app settings:", e); alert("Failed to save settings."); }
}
async function createNotebook(newNotebookData) { 
    try { 
        const notebooksCollectionPath = `${userAppMemoirDocPath}/notebooks`;
        await addDoc(collection(db, notebooksCollectionPath), newNotebookData); 
    } catch (e) { console.error("Error adding notebook: ", e); alert("Failed to create notebook."); } 
}
async function updateNotebook(notebookId, updates) { 
    try {
        const notebookDocPath = `${userAppMemoirDocPath}/notebooks/${notebookId}`;
        await updateDoc(doc(db, notebookDocPath), updates);
    } catch (e) { console.error("Error updating notebook: ", e); alert("Failed to update notebook."); }
}
async function performActualNotebookDeletion(notebookId, notebookName) { 
    uiRefreshCallbacks.showLoadingOverlay(`Moving notes from "${notebookName}" to Trash...`);
    try {
        const batch = writeBatch(db);
        const notesInNotebookRef = collection(db, `${userAppMemoirDocPath}/notebooks/${notebookId}/notes`);
        const notesSnapshot = await getDocs(notesInNotebookRef);
        const notesToMoveIds = []; let tagsFromMovedNotes = new Set();
        notesSnapshot.forEach(noteDoc => { 
            const noteData = noteDoc.data();
            const deletedNoteData = { ...noteData, originalNoteId: noteDoc.id, originalNotebookId: notebookId, originalNotebookName: notebookName, deletedAt: serverTimestamp() };
            const deletedNotesCollectionPath = `${userAppMemoirDocPath}/deleted_notes`;
            batch.set(doc(collection(db, deletedNotesCollectionPath)), deletedNoteData);
            batch.delete(noteDoc.ref); 
            notesToMoveIds.push(noteDoc.id);
            if (noteData.tags) noteData.tags.forEach(tag => tagsFromMovedNotes.add(tag.name.toLowerCase()));
        });
        batch.delete(doc(db, `${userAppMemoirDocPath}/notebooks/${notebookId}`)); 
        await batch.commit();
        if (currentlyViewedNotebookId === notebookId) {
            currentlyViewedNotebookId = null; 
            uiRefreshCallbacks.switchToMainView(themeSettings.defaultHomepage || "notebooks");
            if ((themeSettings.defaultHomepage || "notebooks") === 'notes' || (themeSettings.defaultHomepage || "notebooks") === 'favorites') {
                isFavoritesViewActive = (themeSettings.defaultHomepage || "notebooks") === 'favorites'; currentFilterTag = null;
                setupNotesListenerAndLoadInitialBatch();
            }
            uiRefreshCallbacks.clearInteractionPanel(false);
        }
        if (currentInteractingNoteIdInPanel && notesToMoveIds.includes(currentInteractingNoteIdInPanel)) uiRefreshCallbacks.clearInteractionPanel(false); 
        if (tagsFromMovedNotes.size > 0) for (const tagName of tagsFromMovedNotes) await checkAndCleanupOrphanedTag(tagName);
        setTimeout(async () => { if (localNotebooksCache.length === 0) await initializeDefaultNotebookFirestore(); }, 500);
    } catch (e) { console.error(`Error deleting notebook: `, e); alert(`Failed to delete notebook. Error: ${e.message}`);
    } finally { uiRefreshCallbacks.hideLoadingOverlay(); }
}
async function performActualNoteAction() { 
    if (!noteActionContext.id || noteActionContext.type !== 'deletePermanently') return;
    uiRefreshCallbacks.showLoadingOverlay("Deleting Permanently...");
    if (noteActionContext.isDeletedNote) { 
        const deletedNoteDocPath = `${userAppMemoirDocPath}/deleted_notes/${noteActionContext.id}`;
        try { await deleteDoc(doc(db, deletedNoteDocPath)); } 
        catch (e) { console.error("Error deleting note permanently:", e); alert("Failed to delete note."); }
    }
    uiRefreshCallbacks.hideLoadingOverlay();
}
async function moveNoteToTrashImmediately(noteId, notebookId, noteTitle) { 
    if (!noteId || !notebookId) { console.error("IDs missing for move to trash."); return; }
    uiRefreshCallbacks.showLoadingOverlay("Moving to Trash...");
    try {
        const noteDocPath = `${userAppMemoirDocPath}/notebooks/${notebookId}/notes/${noteId}`;
        const noteRef = doc(db, noteDocPath);
        const noteSnap = await getDoc(noteRef);
        if (noteSnap.exists()) {
            const noteData = noteSnap.data();
            const originalNotebook = localNotebooksCache.find(nb => nb.id === notebookId);
            const deletedNoteData = { ...noteData, originalNoteId: noteId, originalNotebookId: notebookId, originalNotebookName: originalNotebook ? originalNotebook.title : "Unknown", deletedAt: serverTimestamp() };
            const batch = writeBatch(db);
            batch.set(doc(collection(db, `${userAppMemoirDocPath}/deleted_notes`)), deletedNoteData);
            batch.delete(noteRef);
            const parentNotebookRef = doc(db, `${userAppMemoirDocPath}/notebooks/${notebookId}`);
            const parentNotebookSnap = await getDoc(parentNotebookRef);
            if (parentNotebookSnap.exists()) batch.update(parentNotebookRef, { notesCount: Math.max(0, (parentNotebookSnap.data().notesCount || 0) - 1) });
            await batch.commit();
            if (currentInteractingNoteIdInPanel === noteId) uiRefreshCallbacks.clearInteractionPanel(false);
            if (noteData.tags) for (const tag of noteData.tags) await checkAndCleanupOrphanedTag(tag.name);
        }
    } catch (e) { console.error("Error moving note to trash:", e); alert("Failed to move note."); 
    } finally { uiRefreshCallbacks.hideLoadingOverlay(); }
}
async function saveTagChanges(tagId, originalName, newName, newColor, newPurpose) { 
    const tagDocPath = `${userAppMemoirDocPath}/tags/${tagId}`;
    try { 
        await updateDoc(doc(db, tagDocPath), { name: newName, color: newColor, purpose: newPurpose, userId: PLACEHOLDER_USER_ID }); 
        if (originalName !== newName) { 
            const batch = writeBatch(db);
            const notesToUpdateQuery = query(collectionGroup(db, "notes"), where("userId", "==", PLACEHOLDER_USER_ID), where("tags", "array-contains", { name: originalName }));
            const notesSnapshot = await getDocs(notesToUpdateQuery); 
            notesSnapshot.forEach(noteDoc => { 
                const updatedTags = noteDoc.data().tags.map(t => t.name === originalName ? { ...t, name: newName } : t); 
                batch.update(noteDoc.ref, { tags: updatedTags }); 
            }); 
            await batch.commit(); 
        } 
    } catch (e) { console.error("Error updating tag:", e); alert("Failed to update tag."); } 
}
async function performActualTagDeletion(tagId, tagName) { 
    if (!tagId || !tagName) return; 
    uiRefreshCallbacks.showLoadingOverlay("Deleting tag..."); 
    const tagNameLower = tagName.toLowerCase();
    try { 
        const batch = writeBatch(db); 
        batch.delete(doc(db, `${userAppMemoirDocPath}/tags/${tagId}`)); 
        const notesWithTagQuery = query(collectionGroup(db, "notes"), where("userId", "==", PLACEHOLDER_USER_ID), where("tags", "array-contains", { name: tagNameLower })); 
        const notesSnapshot = await getDocs(notesWithTagQuery); 
        notesSnapshot.forEach(noteDoc => { 
            const updatedTags = noteDoc.data().tags.filter(t => t.name !== tagNameLower); 
            batch.update(noteDoc.ref, { tags: updatedTags }); 
        }); 
        await batch.commit(); 
    } catch (e) { console.error("Error deleting tag: ", e); alert("Failed to delete tag."); 
    } finally { uiRefreshCallbacks.hideLoadingOverlay(); tagToDeleteGlobally = { id: null, name: null }; } 
}
async function checkAndCleanupOrphanedTag(tagName) { 
    if (!tagName) return; const tagNameLower = tagName.toLowerCase();
    const notesWithTagQuery = query(collectionGroup(db, "notes"), where("userId", "==", PLACEHOLDER_USER_ID), where("tags", "array-contains", { name: tagNameLower }), limit(1));
    try {
        const notesSnapshot = await getDocs(notesWithTagQuery);
        if (notesSnapshot.empty) { 
            const tagsQueryToDelete = query(collection(db, `${userAppMemoirDocPath}/tags`), where("name", "==", tagNameLower));
            const tagDocsSnapshot = await getDocs(tagsQueryToDelete);
            if (!tagDocsSnapshot.empty) await deleteDoc(doc(db, `${userAppMemoirDocPath}/tags`, tagDocsSnapshot.docs[0].id));
        }
    } catch (e) { console.error(`Error cleaning orphaned tag "${tagNameLower}":`, e); }
}
async function saveCurrentEditDescription() { 
    if (!currentInteractingNoteIdInPanel || isNewNoteSessionInPanel || !currentInteractingNoteOriginalNotebookId) return;
    if (!currentEditSessionOpenTimePanel) { console.warn("saveCurrentEditDescription: currentEditSessionOpenTimePanel is null."); return; }
    uiRefreshCallbacks.updateAutosaveStatus('saving', 'Saving edit details...');
    const editsDescription = document.getElementById('interactionPanelEditsMadeInputField')?.value.trim() || "";
    const noteRef = doc(db, `${userAppMemoirDocPath}/notebooks/${currentInteractingNoteOriginalNotebookId}/notes/${currentInteractingNoteIdInPanel}`);
    let updatedNoteForUIRefresh = null;
    try {
        await runTransaction(db, async (transaction) => {
            const noteSnap = await transaction.get(noteRef); if (!noteSnap.exists()) throw "Note does not exist!";
            let noteData = noteSnap.data(); let existingEdits = noteData.edits || []; let entryModified = false;
            if (editsDescription === "") { 
                if (currentEditSessionEntryId) { existingEdits = existingEdits.filter(e => e.id !== currentEditSessionEntryId); currentEditSessionEntryId = null; entryModified = true; }
            } else { 
                if (currentEditSessionEntryId) { 
                    let entryFound = false;
                    existingEdits = existingEdits.map(e => { if (e.id === currentEditSessionEntryId) { entryFound = true; return { ...e, description: editsDescription, timestamp: Timestamp.fromDate(new Date(currentEditSessionOpenTimePanel)) }; } return e; });
                    if (!entryFound) { currentEditSessionEntryId = doc(collection(db, '_placeholder')).id; existingEdits.push({ id: currentEditSessionEntryId, timestamp: Timestamp.fromDate(new Date(currentEditSessionOpenTimePanel)), description: editsDescription });}
                    entryModified = true;
                } else { currentEditSessionEntryId = doc(collection(db, '_placeholder')).id; existingEdits.push({ id: currentEditSessionEntryId, timestamp: Timestamp.fromDate(new Date(currentEditSessionOpenTimePanel)), description: editsDescription }); entryModified = true; }
            }
            if (entryModified) {
                const newModifiedAtServer = serverTimestamp(); 
                transaction.update(noteRef, { edits: existingEdits, modifiedAt: newModifiedAtServer });
                updatedNoteForUIRefresh = { ...noteData, id: currentInteractingNoteIdInPanel, notebookId: currentInteractingNoteOriginalNotebookId, edits: existingEdits, modifiedAt: new Date() }; 
            } else {
                const cachedNote = localNotesCache.find(n => n.id === currentInteractingNoteIdInPanel);
                if (cachedNote) updatedNoteForUIRefresh = { ...cachedNote }; // No change, but ensure we have data for UI
            }
        });
        if (updatedNoteForUIRefresh) {
            const noteIndex = localNotesCache.findIndex(n => n.id === currentInteractingNoteIdInPanel);
            if (noteIndex > -1) localNotesCache[noteIndex] = { ...localNotesCache[noteIndex], ...updatedNoteForUIRefresh };
            else localNotesCache.unshift(updatedNoteForUIRefresh);
            uiRefreshCallbacks.updateNoteInfoPanel(localNotesCache.find(n => n.id === currentInteractingNoteIdInPanel) || updatedNoteForUIRefresh);
        }
        uiRefreshCallbacks.updateAutosaveStatus('saved', 'Edit details saved');
    } catch (e) { 
        console.error("Error in saveCurrentEditDescription transaction:", e); 
        uiRefreshCallbacks.updateAutosaveStatus('error', 'Edit details save failed');
    }
}
const debouncedSaveEditDescription = debounce(saveCurrentEditDescription, 2500);
async function updateGlobalTagsFromNoteInput(tagNamesArray) { 
    if (!tagNamesArray || tagNamesArray.length === 0) return []; const newTagObjectsForNote = [];
    const tagsCollectionPath = `${userAppMemoirDocPath}/tags`;
    for (const rawTagName of tagNamesArray) {
        const tagName = rawTagName.toLowerCase().trim(); if (!tagName) continue;
        let existingTag = localTagsCache.find(t => t.name === tagName); 
        if (!existingTag) { 
            const qSnap = await getDocs(query(collection(db, tagsCollectionPath), where("name", "==", tagName), limit(1)));
            if (!qSnap.empty) { existingTag = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() }; if (!localTagsCache.some(t=>t.id === existingTag.id)) localTagsCache.push(existingTag); }
        }
        if (!existingTag) { 
            try {
                const newTagData = { name: tagName, color: DEFAULT_TAG_COLOR, purpose: '', userId: PLACEHOLDER_USER_ID }; 
                const docRef = await addDoc(collection(db, tagsCollectionPath), newTagData);
                existingTag = { id: docRef.id, ...newTagData }; localTagsCache.push(existingTag); 
            } catch (e) { console.error("Error creating new tag:", e); continue; }
        }
        newTagObjectsForNote.push({ name: existingTag.name }); 
    } 
    return newTagObjectsForNote; 
}
async function handleNoteInputChange() { 
    uiRefreshCallbacks.updateAutosaveStatus('saving'); 
    const title = document.getElementById('noteTitleInputField_panel')?.value.trim() || "";
    const text = document.getElementById('noteTextInputField_panel')?.value || "";
    const activityValue = document.getElementById('interactionPanelActivityInputField')?.value.trim() || null;
    const existingNoteData = (currentInteractingNoteIdInPanel && !isNewNoteSessionInPanel ) ? localNotesCache.find(n => n.id === currentInteractingNoteIdInPanel) : null;
    const processedTagsForNote = currentNoteTagsArrayInPanel.map(name => ({ name }));
    let noteForInfoPanelUpdate = null;

    if (isNewNoteSessionInPanel && !currentInteractingNoteIdInPanel) { 
        if (title === "" && text.trim() === "" && (!activityValue || activityValue === "") && currentNoteTagsArrayInPanel.length === 0) {
            uiRefreshCallbacks.updateAutosaveStatus('initial'); return; 
        }
        try {
            const newNoteData = { userId: PLACEHOLDER_USER_ID, notebookId: currentOpenNotebookIdForPanel, title: title || "Untitled Note", text, tags: processedTagsForNote, createdAt: serverTimestamp(), modifiedAt: serverTimestamp(), activity: activityValue || "", edits: [], isFavorite: false };
            const docRef = await addDoc(collection(db, `${userAppMemoirDocPath}/notebooks/${currentOpenNotebookIdForPanel}/notes`), newNoteData);
            currentInteractingNoteIdInPanel = docRef.id; activelyCreatingNoteId = docRef.id; currentInteractingNoteOriginalNotebookId = currentOpenNotebookIdForPanel; isNewNoteSessionInPanel = false; 
            lastSavedNoteTitleInPanel = newNoteData.title; lastSavedNoteTextInPanel = newNoteData.text; lastSavedNoteTagsInPanel = currentNoteTagsArrayInPanel.slice().sort().join(','); lastSavedNoteActivityInPanel = newNoteData.activity || '';
            const parentNotebookRef = doc(db, `${userAppMemoirDocPath}/notebooks/${currentOpenNotebookIdForPanel}`);
            const parentNotebookSnap = await getDoc(parentNotebookRef);
            if (parentNotebookSnap.exists()) await updateDoc(parentNotebookRef, { notesCount: (parentNotebookSnap.data().notesCount || 0) + 1 });
            noteForInfoPanelUpdate = { ...newNoteData, id: docRef.id, createdAt: new Date(), modifiedAt: new Date() }; 
            const noteIndex = localNotesCache.findIndex(n => n.id === docRef.id); 
            if(noteIndex > -1) localNotesCache[noteIndex] = noteForInfoPanelUpdate; else localNotesCache.unshift(noteForInfoPanelUpdate);
            uiRefreshCallbacks.updateAutosaveStatus('saved');
        } catch (e) { console.error("Error creating new note:", e); alert("Failed to save new note."); uiRefreshCallbacks.updateAutosaveStatus('error', 'Failed to create note');}
    } else if (currentInteractingNoteIdInPanel && existingNoteData) { 
        const selectedNotebookIdInPanel = document.getElementById('panelNotebookSelector')?.value; 
        const originalNotebookIdOfNote = currentInteractingNoteOriginalNotebookId; 
        if (selectedNotebookIdInPanel && originalNotebookIdOfNote && selectedNotebookIdInPanel !== originalNotebookIdOfNote) {
            uiRefreshCallbacks.updateAutosaveStatus('saving', 'Moving note...');
            try {
                const noteToMoveRef = doc(db, `${userAppMemoirDocPath}/notebooks/${originalNotebookIdOfNote}/notes/${currentInteractingNoteIdInPanel}`);
                const noteSnap = await getDoc(noteToMoveRef); if (!noteSnap.exists()) throw new Error("Note to move not found.");
                const noteDataToMove = noteSnap.data(); const wasThisTheActivelyCreatedNote = (activelyCreatingNoteId === currentInteractingNoteIdInPanel);
                const batch = writeBatch(db);
                const newNoteRefAfterMove = doc(collection(db, `${userAppMemoirDocPath}/notebooks/${selectedNotebookIdInPanel}/notes`)); 
                const movedNoteData = { ...noteDataToMove, userId: PLACEHOLDER_USER_ID, notebookId: selectedNotebookIdInPanel, title: title || noteDataToMove.title, text, tags: processedTagsForNote, modifiedAt: serverTimestamp() };
                batch.set(newNoteRefAfterMove, movedNoteData); batch.delete(noteToMoveRef);
                const oldNotebookRef = doc(db, `${userAppMemoirDocPath}/notebooks/${originalNotebookIdOfNote}`);
                const oldNotebookSnap = await getDoc(oldNotebookRef); if(oldNotebookSnap.exists()) batch.update(oldNotebookRef, { notesCount: Math.max(0, (oldNotebookSnap.data().notesCount || 0) - 1) });
                const newNotebookRefDoc = doc(db, `${userAppMemoirDocPath}/notebooks/${selectedNotebookIdInPanel}`); 
                const newNotebookSnap = await getDoc(newNotebookRefDoc); if(newNotebookSnap.exists()) batch.update(newNotebookRefDoc, { notesCount: (newNotebookSnap.data().notesCount || 0) + 1 });
                await batch.commit();
                currentInteractingNoteIdInPanel = newNoteRefAfterMove.id; currentInteractingNoteOriginalNotebookId = selectedNotebookIdInPanel; currentOpenNotebookIdForPanel = selectedNotebookIdInPanel;
                if (wasThisTheActivelyCreatedNote) activelyCreatingNoteId = newNoteRefAfterMove.id; else activelyCreatingNoteId = null; 
                isNewNoteSessionInPanel = false; 
                noteForInfoPanelUpdate = { ...movedNoteData, id: newNoteRefAfterMove.id, modifiedAt: new Date() }; 
                uiRefreshCallbacks.updateAutosaveStatus('saved', 'Note moved');
            } catch (e) { console.error("Error moving note:", e); alert("Failed to move note."); uiRefreshCallbacks.updateAutosaveStatus('error', 'Failed to move note'); }
        } else { 
            const updates = {}; let contentActuallyChanged = false;
            if (title !== lastSavedNoteTitleInPanel) { updates.title = title; contentActuallyChanged = true; }
            if (text !== lastSavedNoteTextInPanel) { updates.text = text; contentActuallyChanged = true; }
            const currentTagsString = currentNoteTagsArrayInPanel.slice().sort().join(',');
            if (currentTagsString !== lastSavedNoteTagsInPanel) { updates.tags = processedTagsForNote; contentActuallyChanged = true; }
            const isAdminMode = document.getElementById('adminModeToggle')?.checked;
            const activityInputField = document.getElementById('interactionPanelActivityInputField');
            const creationDateInput = document.getElementById('interactionPanelCreationDateInputField');
            const creationTimeInput = document.getElementById('interactionPanelCreationTimeInputField_time');
            if (isAdminMode) {
                if (activityInputField && activityInputField.style.display === 'block') { const newActivity = activityInputField.value.trim(); if (newActivity !== lastSavedNoteActivityInPanel) { updates.activity = newActivity; contentActuallyChanged = true; }}
                if (creationDateInput && creationTimeInput && creationDateInput.parentElement.style.display === 'flex') {
                    const dateStr = creationDateInput.value; const timeStr = creationTimeInput.value;
                    if (dateStr && timeStr) {
                        const newCreationDate = new Date(`${dateStr}T${timeStr}`);
                        if (!isNaN(newCreationDate.getTime())) {
                            const newTimestamp = Timestamp.fromDate(newCreationDate);
                            if (!existingNoteData.createdAt || newTimestamp.toMillis() !== existingNoteData.createdAt.toMillis()) { updates.createdAt = newTimestamp; contentActuallyChanged = true; }
                        }
                    }
                }
            } else if (isNewNoteSessionInPanel || activelyCreatingNoteId === currentInteractingNoteIdInPanel) { 
                if (activityInputField && activityInputField.style.display === 'block') { const newActivity = activityInputField.value.trim(); if (newActivity !== lastSavedNoteActivityInPanel) { updates.activity = newActivity; contentActuallyChanged = true; }}
            }
            if (contentActuallyChanged) {
                updates.modifiedAt = serverTimestamp();
                try {
                    await updateDoc(doc(db, `${userAppMemoirDocPath}/notebooks/${originalNotebookIdOfNote}/notes/${currentInteractingNoteIdInPanel}`), updates);
                    if (updates.title !== undefined) lastSavedNoteTitleInPanel = updates.title;
                    if (updates.text !== undefined) lastSavedNoteTextInPanel = updates.text;
                    if (updates.tags !== undefined) lastSavedNoteTagsInPanel = currentTagsString;
                    if (updates.activity !== undefined) lastSavedNoteActivityInPanel = updates.activity;
                    noteForInfoPanelUpdate = { ...existingNoteData, ...updates, modifiedAt: new Date() }; 
                    uiRefreshCallbacks.updateAutosaveStatus('saved');
                } catch (e) { console.error("Error updating note:", e); alert("Failed to save changes."); uiRefreshCallbacks.updateAutosaveStatus('error', 'Failed to save');}
            } else {
                uiRefreshCallbacks.updateAutosaveStatus('saved', 'No changes'); 
                noteForInfoPanelUpdate = { ...existingNoteData }; 
            }
        }
    }
    const oldTagNamesSet = new Set(lastSavedNoteTagsInPanel ? lastSavedNoteTagsInPanel.split(',') : []);
    const currentTagNamesSet = new Set(currentNoteTagsArrayInPanel);
    const tagsToCheckForOrphan = [...oldTagNamesSet].filter(name => !currentTagNamesSet.has(name));
    if (tagsToCheckForOrphan.length > 0) for (const tagName of tagsToCheckForOrphan) await checkAndCleanupOrphanedTag(tagName);

    if (noteForInfoPanelUpdate && currentInteractingNoteIdInPanel === noteForInfoPanelUpdate.id) {
        const noteIndex = localNotesCache.findIndex(n => n.id === currentInteractingNoteIdInPanel);
        if (noteIndex > -1) {
            localNotesCache[noteIndex] = { ...localNotesCache[noteIndex], ...noteForInfoPanelUpdate };
             uiRefreshCallbacks.updateNoteInfoPanel(localNotesCache[noteIndex]);
        } else if (isNewNoteSessionInPanel === false && activelyCreatingNoteId === currentInteractingNoteIdInPanel) { 
            localNotesCache.unshift(noteForInfoPanelUpdate); 
            uiRefreshCallbacks.updateNoteInfoPanel(noteForInfoPanelUpdate);
        }
    }
}
const debouncedHandleInteractionPanelInputChange = debounce(handleNoteInputChange, 1200); 

async function initializeDefaultNotebookFirestore() { 
    const defaultNotebookName = "My Notes 😏";
    const memoirAppDocRef = doc(db, userAppMemoirDocPath);
    try { await setDoc(memoirAppDocRef, { userId: PLACEHOLDER_USER_ID, appName: "Memoir Notes", initializedAt: serverTimestamp() }, { merge: true }); } 
    catch (e) { console.error(`Error ensuring main app document:`, e); return; }
    const notebooksCollectionPath = `${userAppMemoirDocPath}/notebooks`;
    const qSnap = await getDocs(query(collection(db, notebooksCollectionPath), where("title", "==", defaultNotebookName), where("userId", "==", PLACEHOLDER_USER_ID))); 
    if (qSnap.empty) { 
        try { await addDoc(collection(db, notebooksCollectionPath), { userId: PLACEHOLDER_USER_ID, title: defaultNotebookName, purpose: "Default notebook.", createdAt: serverTimestamp(), notesCount: 0, coverColor: paletteColors.length > 0 ? paletteColors[0] : null }); } 
        catch (e) { console.error(`Error creating default notebook:`, e); } 
    } 
}
async function handleRestoreNote(deletedNoteId, targetNotebookId = null, newNotebookTitle = null) { 
    const noteToRestore = localDeletedNotesCache.find(dn => dn.id === deletedNoteId);
    if (!noteToRestore) { alert("Error: Deleted note not found."); return; }
    uiRefreshCallbacks.showLoadingOverlay("Restoring note...");
    try {
        let finalTargetNotebookId = targetNotebookId;
        if (!finalTargetNotebookId && newNotebookTitle) {
            const newNbRef = await addDoc(collection(db, `${userAppMemoirDocPath}/notebooks`), { userId: PLACEHOLDER_USER_ID, title: newNotebookTitle, purpose: "For restored notes.", createdAt: serverTimestamp(), notesCount: 0, coverColor: paletteColors.length > 0 ? paletteColors[0] : null });
            finalTargetNotebookId = newNbRef.id;
        } else if (!finalTargetNotebookId) {
            const originalNbExists = localNotebooksCache.some(nb => nb.id === noteToRestore.originalNotebookId);
            if (originalNbExists) finalTargetNotebookId = noteToRestore.originalNotebookId;
            else { alert("Original notebook not found. Cannot restore."); uiRefreshCallbacks.hideLoadingOverlay(); return; }
        }
        const noteDataToRestore = { ...noteToRestore }; delete noteDataToRestore.id; delete noteDataToRestore.deletedAt; delete noteDataToRestore.originalNoteId; 
        noteDataToRestore.notebookId = finalTargetNotebookId; noteDataToRestore.userId = PLACEHOLDER_USER_ID; delete noteDataToRestore.originalNotebookName; noteDataToRestore.modifiedAt = serverTimestamp(); 
        const batch = writeBatch(db);
        batch.set(doc(collection(db, `${userAppMemoirDocPath}/notebooks/${finalTargetNotebookId}/notes`)), noteDataToRestore);
        batch.delete(doc(db, `${userAppMemoirDocPath}/deleted_notes/${deletedNoteId}`));
        const notebookRef = doc(db, `${userAppMemoirDocPath}/notebooks/${finalTargetNotebookId}`);
        const notebookSnap = await getDoc(notebookRef);
        if (notebookSnap.exists()) batch.update(notebookRef, { notesCount: (notebookSnap.data().notesCount || 0) + 1 });
        await batch.commit();
        if (noteDataToRestore.tags) await updateGlobalTagsFromNoteInput(noteDataToRestore.tags.map(t => t.name));
    } catch (e) { console.error("Error restoring note:", e); alert("Failed to restore.");
    } finally { uiRefreshCallbacks.hideLoadingOverlay(); }
}
async function performEmptyTrash() { 
    if (localDeletedNotesCache.length === 0) return; uiRefreshCallbacks.showLoadingOverlay("Emptying Trash...");
    try {
        const batch = writeBatch(db);
        localDeletedNotesCache.forEach(note => batch.delete(doc(db, `${userAppMemoirDocPath}/deleted_notes`, note.id)));
        await batch.commit();
    } catch (e) { console.error("Error emptying trash:", e); alert("Failed to empty trash.");
    } finally { uiRefreshCallbacks.hideLoadingOverlay(); }
}
async function getExportData(notebookId) { 
    const notebookToExport = localNotebooksCache.find(nb => nb.id === notebookId);
    if (!notebookToExport) throw new Error("Notebook not found for export.");
    const notesSnapshot = await getDocs(collection(db, `${userAppMemoirDocPath}/notebooks/${notebookId}/notes`));
    const notesForExport = notesSnapshot.docs.map(noteDoc => {
        const noteData = noteDoc.data();
        return { noteId: noteDoc.id, title: noteData.title || "", text: noteData.text || "", tags: noteData.tags || [], createdAt: convertTimestampToISO(noteData.createdAt), modifiedAt: convertTimestampToISO(noteData.modifiedAt), activity: noteData.activity || "", isFavorite: noteData.isFavorite || false, edits: (noteData.edits || []).map(e => ({ id: e.id || null, timestamp: convertTimestampToISO(e.timestamp), description: e.description || "" })) };
    });
    return { notebookId: notebookToExport.id, title: notebookToExport.title, purpose: notebookToExport.purpose || "", coverColor: notebookToExport.coverColor || null, createdAt: convertTimestampToISO(notebookToExport.createdAt), notes: notesForExport, userId: PLACEHOLDER_USER_ID };
}

// --- Define Setter functions ---
const setCurrentlyViewedNotebookId = (id) => { currentlyViewedNotebookId = id; };
const setCurrentFilterTag = (tag) => { currentFilterTag = tag; };
const setIsFavoritesViewActive = (active) => { isFavoritesViewActive = active; };
const setCurrentSearchTerm = (term) => { currentSearchTerm = term.toLowerCase(); };
const setCurrentInteractingNoteIdInPanel = (id) => { currentInteractingNoteIdInPanel = id; };
const setIsNewNoteSessionInPanel = (isNew) => { isNewNoteSessionInPanel = isNew; };
const setActivelyCreatingNoteId = (id) => { activelyCreatingNoteId = id; };
const setCurrentOpenNotebookIdForPanel = (id) => { currentOpenNotebookIdForPanel = id; };
const setCurrentInteractingNoteOriginalNotebookId = (id) => { currentInteractingNoteOriginalNotebookId = id; };
const setCurrentEditSessionOpenTimePanel = (time) => { currentEditSessionOpenTimePanel = time; };
const setCurrentEditSessionEntryId = (id) => { currentEditSessionEntryId = id; };
const setLastSavedNoteTextInPanel = (text) => { lastSavedNoteTextInPanel = text; };
const setLastSavedNoteTitleInPanel = (title) => { lastSavedNoteTitleInPanel = title; };
const setLastSavedNoteTagsInPanel = (tags) => { lastSavedNoteTagsInPanel = tags; };
const setLastSavedNoteActivityInPanel = (activity) => { lastSavedNoteActivityInPanel = activity; };
const setCurrentNoteTagsArrayInPanel = (tagsArray) => { currentNoteTagsArrayInPanel = tagsArray; };
const setNoteActionContext = (context) => { noteActionContext = context; };
const setNoteToRestoreWithOptions = (note) => { noteToRestoreWithOptions = note; };
const setTagToDeleteGlobally = (tag) => { tagToDeleteGlobally = tag; };
const setNotebookToDeleteGlobally = (notebook) => { notebookToDeleteGlobally = notebook; };
const setInitialViewDetermined = (val) => { initialViewDetermined = val; };


// --- Exports for ui-handlers.js ---
export {
    db, PLACEHOLDER_USER_ID, APP_DATA_COLLECTION_NAME, MEMOIR_DOCUMENT_NAME, userAppMemoirDocPath,
    localNotebooksCache, localNotesCache, localTagsCache, localDeletedNotesCache,
    themeSettings, paletteColors, defaultThemeColorsFromDB, DEFAULT_TAG_COLOR,
    currentOpenNotebookIdForPanel, currentInteractingNoteIdInPanel, currentInteractingNoteOriginalNotebookId,
    isNewNoteSessionInPanel, activelyCreatingNoteId, currentEditSessionOpenTimePanel, currentEditSessionEntryId,
    currentlyViewedNotebookId, currentFilterTag, tagToDeleteGlobally, notebookToDeleteGlobally,
    noteActionContext, noteToRestoreWithOptions, isFavoritesViewActive, PALETTE_BASE_LIMIT, initialViewDetermined,
    lastSavedNoteTextInPanel, lastSavedNoteTitleInPanel, lastSavedNoteTagsInPanel, lastSavedNoteActivityInPanel,
    currentNoteTagsArrayInPanel, lastFetchedNoteDoc, isLoadingMoreNotes, noMoreNotesToLoad, currentSearchTerm,
    Timestamp, serverTimestamp,
    setUIRefreshCallbacks, initializeDataListeners, setupNotesListenerAndLoadInitialBatch, fetchMoreNotes,
    saveAppSettings, createNotebook, updateNotebook, performActualNotebookDeletion, performActualNoteAction,
    moveNoteToTrashImmediately, saveTagChanges, performActualTagDeletion, checkAndCleanupOrphanedTag,
    saveCurrentEditDescription, debouncedSaveEditDescription, updateGlobalTagsFromNoteInput,
    handleNoteInputChange, debouncedHandleInteractionPanelInputChange, initializeDefaultNotebookFirestore,
    handleRestoreNote, performEmptyTrash, getExportData, convertTimestampToISO, debounce,
    setCurrentlyViewedNotebookId, setCurrentFilterTag, setIsFavoritesViewActive, setCurrentSearchTerm,
    setCurrentInteractingNoteIdInPanel, setIsNewNoteSessionInPanel, setActivelyCreatingNoteId,
    setCurrentOpenNotebookIdForPanel, setCurrentInteractingNoteOriginalNotebookId,
    setCurrentEditSessionOpenTimePanel, setCurrentEditSessionEntryId, setLastSavedNoteTextInPanel,
    setLastSavedNoteTitleInPanel, setLastSavedNoteTagsInPanel, setLastSavedNoteActivityInPanel,
    setCurrentNoteTagsArrayInPanel, setNoteActionContext, setNoteToRestoreWithOptions,
    setTagToDeleteGlobally, setNotebookToDeleteGlobally, setInitialViewDetermined,
    doc, collection, getDoc, updateDoc, deleteDoc, addDoc, writeBatch, runTransaction, query, where, getDocs, limit, startAfter, orderBy, onSnapshot
};
