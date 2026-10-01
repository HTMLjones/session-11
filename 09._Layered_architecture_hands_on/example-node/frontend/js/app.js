/**
 * Notes API Frontend - JavaScript
 * Connects to the Node.js backend API endpoints:
 * - GET /notes - Fetch all notes
 * - POST /notes - Create a new note
 * - GET /notes/:id - Fetch a single note by ID
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000';

// DOM Elements
const createNoteForm = document.getElementById('createNoteForm');
const noteTitleInput = document.getElementById('noteTitle');
const noteBodyInput = document.getElementById('noteBody');
const notesContainer = document.getElementById('notesContainer');
const refreshNotesBtn = document.getElementById('refreshNotesBtn');
const viewNoteModal = new bootstrap.Modal(document.getElementById('viewNoteModal'));
const modalNoteContent = document.getElementById('modalNoteContent');
const toastNotification = document.getElementById('toastNotification');

// State
let notes = [];

/**
 * Show toast notification
 * @param {string} message - Notification message
 * @param {string} type - Bootstrap alert type (success, error, info, warning)
 */
function showToast(message, type = 'info') {
    const toast = new bootstrap.Toast(toastNotification);
    const toastBody = toastNotification.querySelector('.toast-body');
    const toastHeader = toastNotification.querySelector('.toast-header strong');
    
    toastBody.textContent = message;
    toastHeader.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Set toast header color based on type
    const toastHeaderEl = toastNotification.querySelector('.toast-header');
    toastHeaderEl.className = `toast-header text-white bg-${type}`;
    
    toast.show();
}

/**
 * Fetch all notes from the API
 */
async function fetchAllNotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        notes = await response.json();
        renderNotesList();
        showToast(`Loaded ${notes.length} note(s)`, 'success');
    } catch (error) {
        console.error('Error fetching notes:', error);
        showToast(`Failed to load notes: ${error.message}`, 'error');
    }
}

/**
 * Fetch a single note by ID
 * @param {number} id - Note ID
 */
async function fetchNoteById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showToast('Note not found', 'warning');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const note = await response.json();
        displayNoteInModal(note);
    } catch (error) {
        console.error('Error fetching note:', error);
        showToast(`Failed to load note: ${error.message}`, 'error');
    }
}

/**
 * Create a new note
 * @param {string} title - Note title
 * @param {string} body - Note body
 */
async function createNote(title, body) {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                body: body
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const newNote = await response.json();
        showToast('Note created successfully!', 'success');
        
        // Clear form and refresh notes
        noteTitleInput.value = '';
        noteBodyInput.value = '';
        fetchAllNotes();
        
        return newNote;
    } catch (error) {
        console.error('Error creating note:', error);
        showToast(`Failed to create note: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Render notes list in the container
 */
function renderNotesList() {
    if (notes.length === 0) {
        notesContainer.innerHTML = `
            <div class="list-group-item empty-state">
                <i class="bi bi-journal-x" style="font-size: 4rem;"></i>
                <p class="mt-3 mb-0">No notes found</p>
                <small class="text-muted">Create your first note using the form</small>
            </div>
        `;
        return;
    }
    
    notesContainer.innerHTML = notes.map(note => `
        <div class="list-group-item" data-note-id="${note.id}">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="note-title">${escapeHtml(note.title)}</div>
                    <div class="note-body">${escapeHtml(truncateText(note.body, 100))}</div>
                    <div class="note-meta">
                        <span class="note-id">ID: ${note.id}</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-primary view-btn">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Add click handlers for view buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = parseInt(button.closest('[data-note-id]').dataset.noteId);
            fetchNoteById(noteId);
        });
    });
    
    // Add click handler for entire note item
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => {
            const noteId = parseInt(item.dataset.noteId);
            fetchNoteById(noteId);
        });
    });
}

/**
 * Display note in modal
 * @param {Object} note - Note object
 */
function displayNoteInModal(note) {
    modalNoteContent.innerHTML = `
        <h3 class="modal-title">${escapeHtml(note.title)}</h3>
        <div class="modal-body-text">${escapeHtml(note.body)}</div>
        <hr>
        <div class="text-muted">
            <small><i class="bi bi-tag me-1"></i>ID: ${note.id}</small>
        </div>
    `;
    viewNoteModal.show();
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Event Listeners

// Create note form submission
createNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = noteTitleInput.value.trim();
    const body = noteBodyInput.value.trim();
    
    if (!title || !body) {
        showToast('Please fill in both title and content', 'warning');
        return;
    }
    
    try {
        await createNote(title, body);
    } catch (error) {
        // Error handling is done in createNote function
    }
});

// Refresh notes button
refreshNotesBtn.addEventListener('click', () => {
    fetchAllNotes();
});

// Auto-refresh on page load
fetchAllNotes();

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') {
        if (document.activeElement === noteTitleInput || document.activeElement === noteBodyInput) {
            createNoteForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape' && viewNoteModal._isShown) {
        viewNoteModal.hide();
    }
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchAllNotes,
        fetchNoteById,
        createNote,
        escapeHtml,
        truncateText
    };
}
