/**
 * Academic Helper - Core Application Logic
 * Implements basic calculators and persistent note-taking functionality.
 * Includes graceful fallback for restrictive environments (like file:// protocol).
 */

/* =====================================
   SAFE STORAGE HELPERS
   ===================================== */
// Some browsers block localStorage on file:// URLs. We add a try-catch so the app doesn't crash!
function safeGetStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn('Local storage is blocked (likely due to running as a local file). Data will not be saved after you close the tab.');
        return null;
    }
}

function safeSetStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn('Could not save data to local storage.');
    }
}

/* =====================================
   GLOBAL STATE & INITIALIZATION
   ===================================== */
let subjectsList = [];
let notesList = [];

try {
    const savedSubjects = safeGetStorage('academicHelperSubjects');
    if (savedSubjects) subjectsList = JSON.parse(savedSubjects);

    const savedNotes = safeGetStorage('academicHelperNotes');
    if (savedNotes) notesList = JSON.parse(savedNotes);
} catch (e) {
    console.error("Error parsing saved data:", e);
}

// Constants for DOM Elements
const El = {}; // We will populate this after DOM loads to be 100% safe

// Initialize App: Setup Listeners and Render Stored Data
function init() {
    populateElements();
    setupEventListeners();
    renderSubjects();
    renderNotes();
}

function populateElements() {
    // SGPA
    El.subName = document.getElementById('sub-name');
    El.subCredits = document.getElementById('sub-credits');
    El.subGrade = document.getElementById('sub-grade');
    El.addSubjectBtn = document.getElementById('add-subject-btn');
    El.subjectListUl = document.getElementById('subject-list');
    El.calcSgpaBtn = document.getElementById('calc-sgpa-btn');
    El.resetSgpaBtn = document.getElementById('reset-sgpa-btn');
    El.sgpaActions = document.getElementById('sgpa-actions');
    El.sgpaResultDisplay = document.getElementById('sgpa-result-display');
    El.sgpaValue = document.getElementById('sgpa-value');

    // CGPA
    El.prevCgpa = document.getElementById('prev-cgpa');
    El.prevCredits = document.getElementById('prev-credits');
    El.currSgpa = document.getElementById('curr-sgpa');
    El.currCredits = document.getElementById('curr-credits');
    El.calcCgpaBtn = document.getElementById('calc-cgpa-btn');
    El.resetCgpaBtn = document.getElementById('reset-cgpa-btn');
    El.cgpaResultDisplay = document.getElementById('cgpa-result-display');
    El.cgpaValue = document.getElementById('cgpa-value');

    // Attendance
    El.totalClasses = document.getElementById('total-classes');
    El.attendedClasses = document.getElementById('attended-classes');
    El.attResultDisplay = document.getElementById('attendance-result-display');
    El.attValue = document.getElementById('attendance-value');
    El.attMessage = document.getElementById('attendance-message');
    El.resetAttBtn = document.getElementById('reset-attendance-btn');

    // Notes
    El.noteInput = document.getElementById('note-input');
    El.saveNoteBtn = document.getElementById('save-note-btn');
    El.notesListUl = document.getElementById('notes-list');
}

// Attach all event handlers to buttons and inputs
function setupEventListeners() {
    // SGPA Listeners
    El.addSubjectBtn.addEventListener('click', addSubject);
    El.calcSgpaBtn.addEventListener('click', calculateSGPA);
    if(El.resetSgpaBtn) El.resetSgpaBtn.addEventListener('click', resetSGPA);

    // CGPA Listeners
    El.calcCgpaBtn.addEventListener('click', calculateCGPA);
    El.resetCgpaBtn.addEventListener('click', resetCGPA);

    // Attendance Listeners (Real-time calculation on typing)
    El.totalClasses.addEventListener('input', calculateAttendance);
    El.attendedClasses.addEventListener('input', calculateAttendance);
    if(El.resetAttBtn) El.resetAttBtn.addEventListener('click', resetAttendance);

    // Notes Listeners
    El.saveNoteBtn.addEventListener('click', saveNote);
}

/* =====================================
   SGPA CALCULATOR LOGIC
   ===================================== */
function addSubject() {
    const nameStr = El.subName.value.trim();
    const creditsInt = parseInt(El.subCredits.value);
    const gradePointsInt = parseInt(El.subGrade.value);

    // Basic Validation
    if (!nameStr) {
        alert("Please enter a subject name.");
        return;
    }
    if (isNaN(creditsInt) || creditsInt <= 0) {
        alert("Please enter a valid positive number for credits.");
        return;
    }
    if (isNaN(gradePointsInt)) {
        alert("Please select a valid grade from the dropdown.");
        return;
    }

    const gradeText = El.subGrade.options[El.subGrade.selectedIndex].text;

    const newSubject = {
        id: Date.now().toString(),
        name: nameStr,
        credits: creditsInt,
        gradeValue: gradePointsInt,
        gradeText: gradeText
    };

    subjectsList.push(newSubject);
    saveSubjectsData();
    renderSubjects();

    // Clear Inputs for next entry
    El.subName.value = '';
    El.subCredits.value = '';
    El.subGrade.selectedIndex = 0;
}

function removeSubject(id) {
    subjectsList = subjectsList.filter(sub => sub.id !== id);
    saveSubjectsData();
    renderSubjects();
}

function renderSubjects() {
    El.subjectListUl.innerHTML = '';
    
    if (subjectsList.length === 0) {
        if(El.sgpaActions) El.sgpaActions.style.display = 'none';
        El.sgpaResultDisplay.classList.add('hidden');
        return;
    }

    if(El.sgpaActions) El.sgpaActions.style.display = 'flex';

    subjectsList.forEach(subject => {
        const li = document.createElement('li');
        
        li.innerHTML = `
            <div class="subject-item-details">
                <span class="subject-name">${subject.name}</span>
                <span class="subject-info">Cr: ${subject.credits}</span>
                <span class="subject-info">${subject.gradeText}</span>
            </div>
            <button class="delete-btn" title="Remove Subject">
                <i class="ph ph-trash"></i>
            </button>
        `;
        
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => removeSubject(subject.id));

        El.subjectListUl.appendChild(li);
    });
}

function calculateSGPA() {
    if (subjectsList.length === 0) return;

    let totalPoints = 0;
    let totalCredits = 0;

    subjectsList.forEach(sub => {
        totalPoints += (sub.credits * sub.gradeValue);
        totalCredits += sub.credits;
    });

    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    
    El.sgpaValue.textContent = sgpa.toFixed(2);
    El.sgpaResultDisplay.classList.remove('hidden');
}

function resetSGPA() {
    // Clear list of subjects entirely and save empty state to local storage
    subjectsList = [];
    saveSubjectsData();
    
    // Clear Inputs
    El.subName.value = '';
    El.subCredits.value = '';
    El.subGrade.selectedIndex = 0;
    
    // Re-render
    renderSubjects();
    El.sgpaResultDisplay.classList.add('hidden');
}

function saveSubjectsData() {
    safeSetStorage('academicHelperSubjects', JSON.stringify(subjectsList));
}


/* =====================================
   CGPA CALCULATOR LOGIC
   ===================================== */
function calculateCGPA() {
    const prevCgpa = parseFloat(El.prevCgpa.value);
    const prevCredits = parseFloat(El.prevCredits.value);
    const currSgpa = parseFloat(El.currSgpa.value);
    const currCredits = parseFloat(El.currCredits.value);

    if (isNaN(prevCgpa) || isNaN(prevCredits) || isNaN(currSgpa) || isNaN(currCredits)) {
        alert('Please fill in all 4 required fields with valid numbers to calculate CGPA.');
        return;
    }

    const totalPrevPoints = prevCgpa * prevCredits;
    const totalCurrPoints = currSgpa * currCredits;
    const totalCreditsOverall = prevCredits + currCredits;

    const finalCgpa = (totalPrevPoints + totalCurrPoints) / totalCreditsOverall;

    El.cgpaValue.textContent = finalCgpa.toFixed(2);
    El.cgpaResultDisplay.classList.remove('hidden');
}

function resetCGPA() {
    El.prevCgpa.value = '';
    El.prevCredits.value = '';
    El.currSgpa.value = '';
    El.currCredits.value = '';
    El.cgpaResultDisplay.classList.add('hidden');
}


/* =====================================
   ATTENDANCE CALCULATOR LOGIC
   ===================================== */
function calculateAttendance() {
    const total = parseFloat(El.totalClasses.value);
    const attended = parseFloat(El.attendedClasses.value);

    if (isNaN(total) || isNaN(attended) || total <= 0) {
        El.attValue.textContent = '0%';
        El.attMessage.textContent = 'Enter valid classes below';
        El.attValue.className = 'attendance-percentage';
        El.attMessage.className = 'attendance-status';
        return;
    }

    if (attended > total) {
        El.attValue.textContent = 'Err';
        El.attMessage.textContent = 'Attended cannot exceed Total';
        El.attValue.className = 'attendance-percentage text-danger';
        El.attMessage.className = 'attendance-status text-danger';
        return;
    }

    const percentage = (attended / total) * 100;
    El.attValue.textContent = percentage.toFixed(1) + '%';
    
    if (percentage >= 75) {
        El.attValue.className = 'attendance-percentage text-safe';
        El.attMessage.className = 'attendance-status text-safe';
        El.attMessage.textContent = "You're safe! Keep it up.";
    } else {
        El.attValue.className = 'attendance-percentage text-danger';
        El.attMessage.className = 'attendance-status text-danger';
        El.attMessage.textContent = `Warning! You need to attend ${requiredClasses} more consecutive classes to reach 75%.`;
    }
}

function resetAttendance() {
    El.totalClasses.value = '';
    El.attendedClasses.value = '';
    El.attValue.textContent = '0%';
    El.attMessage.textContent = 'Enter valid classes below';
    El.attValue.className = 'attendance-percentage';
    El.attMessage.className = 'attendance-status';
}


/* =====================================
   DAILY LEARNING NOTES LOGIC
   ===================================== */
function saveNote() {
    const noteTextVal = El.noteInput.value.trim();

    if (!noteTextVal) {
        alert('Note cannot be empty.');
        return;
    }

    const newNote = {
        id: Date.now().toString(),
        text: noteTextVal,
        dateString: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })
    };

    notesList.unshift(newNote);
    saveNotesData();
    renderNotes();

    El.noteInput.value = '';
}

function removeNote(id) {
    notesList = notesList.filter(note => note.id !== id);
    saveNotesData();
    renderNotes();
}

function renderNotes() {
    El.notesListUl.innerHTML = '';

    notesList.forEach(note => {
        const li = document.createElement('li');
        
        li.innerHTML = `
            <div style="flex:1;">
                <div class="note-item-text">${note.text}</div>
                <div class="note-item-date">${note.dateString}</div>
            </div>
            <button class="delete-btn" title="Delete Note">
                <i class="ph ph-trash"></i>
            </button>
        `;

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => removeNote(note.id));

        El.notesListUl.appendChild(li);
    });
}

function saveNotesData() {
    safeSetStorage('academicHelperNotes', JSON.stringify(notesList));
}

// Ensure the code only runs after the document is explicitly loaded!
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
