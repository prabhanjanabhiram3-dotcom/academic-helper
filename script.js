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
let attSubjectsList = [];
let semestersList = [];
let pdfsList = [];
let notesList = [];

try {
    const savedSubjects = safeGetStorage('academicHelperSubjects');
    if (savedSubjects) subjectsList = JSON.parse(savedSubjects);

    const savedAttSubjects = safeGetStorage('academicHelperAttSubjects');
    if (savedAttSubjects) attSubjectsList = JSON.parse(savedAttSubjects);

    const savedSemesters = safeGetStorage('academicHelperSemesters');
    if (savedSemesters) semestersList = JSON.parse(savedSemesters);

    const savedPdfs = safeGetStorage('academicHelperPdfs');
    if (savedPdfs) pdfsList = JSON.parse(savedPdfs);

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
    renderAttSubjects();
    renderSemesters();
    renderPdfs();
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

    // Semester Tracker
    El.semName = document.getElementById('sem-name');
    El.semSgpa = document.getElementById('sem-sgpa');
    El.addSemBtn = document.getElementById('add-sem-btn');
    El.semListUl = document.getElementById('semester-list');
    El.semResultDisplay = document.getElementById('sem-result-display');
    El.semCgpaValue = document.getElementById('sem-cgpa-value');
    El.resetSemBtn = document.getElementById('reset-sem-btn');

    // Attendance
    El.attSubName = document.getElementById('att-sub-name');
    El.totalClasses = document.getElementById('total-classes');
    El.attendedClasses = document.getElementById('attended-classes');
    El.addAttSubjectBtn = document.getElementById('add-att-subject-btn');
    El.attSubjectListUl = document.getElementById('att-subject-list');
    El.attResultDisplay = document.getElementById('attendance-result-display');
    El.attValue = document.getElementById('attendance-value');
    El.attMessage = document.getElementById('attendance-message');
    El.resetAttBtn = document.getElementById('reset-attendance-btn');

    // PDF Manager
    El.pdfSubject = document.getElementById('pdf-subject');
    El.pdfName = document.getElementById('pdf-name');
    El.pdfLink = document.getElementById('pdf-link');
    El.addPdfBtn = document.getElementById('add-pdf-btn');
    El.pdfListContainer = document.getElementById('pdf-list-container');

    // Notes
    El.noteInput = document.getElementById('note-input');
    El.saveNoteBtn = document.getElementById('save-note-btn');
    El.notesListUl = document.getElementById('notes-list');

    // Tabs
    El.tabBtns = document.querySelectorAll('.tab-btn');
    El.tabPanes = document.querySelectorAll('.tab-pane');
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

    // Semester Tracker Listeners
    if(El.addSemBtn) El.addSemBtn.addEventListener('click', addSemester);
    if(El.resetSemBtn) El.resetSemBtn.addEventListener('click', resetSemesters);

    // Attendance Listeners
    El.addAttSubjectBtn.addEventListener('click', addAttSubject);
    if(El.resetAttBtn) El.resetAttBtn.addEventListener('click', resetAttendance);

    // PDF Manager Listeners
    if(El.addPdfBtn) El.addPdfBtn.addEventListener('click', addPdf);

    // Notes Listeners
    El.saveNoteBtn.addEventListener('click', saveNote);

    // Tab Navigation Switcher
    if (El.tabBtns) {
        El.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active classes
                El.tabBtns.forEach(b => b.classList.remove('active'));
                El.tabPanes.forEach(p => p.classList.remove('active'));

                // Add active to clicked target
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }
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
   SEMESTER TRACKER LOGIC
   ===================================== */
function addSemester() {
    const nameStr = El.semName.value.trim();
    const sgpaVal = parseFloat(El.semSgpa.value);

    if (!nameStr) {
        alert("Please enter a semester name.");
        return;
    }
    if (isNaN(sgpaVal) || sgpaVal < 0 || sgpaVal > 10) {
        alert("Please enter a valid SGPA between 0 and 10.");
        return;
    }

    const newSem = {
        id: Date.now().toString(),
        name: nameStr,
        sgpa: sgpaVal
    };

    semestersList.push(newSem);
    saveSemestersData();
    renderSemesters();

    El.semName.value = '';
    El.semSgpa.value = '';
}

function removeSemester(id) {
    semestersList = semestersList.filter(sem => sem.id !== id);
    saveSemestersData();
    renderSemesters();
}

function renderSemesters() {
    if (!El.semListUl) return;

    El.semListUl.innerHTML = '';
    
    if (semestersList.length === 0) {
        El.semResultDisplay.style.display = 'none';
        return;
    }
    
    El.semResultDisplay.style.display = 'flex';
    
    let totalSgpa = 0;

    semestersList.forEach(sem => {
        totalSgpa += sem.sgpa;

        const li = document.createElement('li');
        
        li.innerHTML = `
            <div class="subject-item-details">
                <span class="subject-name">${sem.name}</span>
                <span class="subject-info text-safe" style="font-weight:bold;">${sem.sgpa.toFixed(2)}</span>
            </div>
            <button class="delete-btn" title="Remove Semester">
                <i class="ph ph-trash"></i>
            </button>
        `;
        
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => removeSemester(sem.id));

        El.semListUl.appendChild(li);
    });

    const averageCgpa = totalSgpa / semestersList.length;
    El.semCgpaValue.textContent = averageCgpa.toFixed(2);
}

function resetSemesters() {
    semestersList = [];
    saveSemestersData();
    renderSemesters();
    
    El.semName.value = '';
    El.semSgpa.value = '';
    
    if (El.semResultDisplay) El.semResultDisplay.style.display = 'none';
}

function saveSemestersData() {
    safeSetStorage('academicHelperSemesters', JSON.stringify(semestersList));
}


/* =====================================
   ATTENDANCE CALCULATOR LOGIC
   ===================================== */
function addAttSubject() {
    const nameStr = El.attSubName.value.trim();
    const total = parseFloat(El.totalClasses.value);
    const attended = parseFloat(El.attendedClasses.value);

    if (!nameStr) {
        alert("Please enter a subject name.");
        return;
    }
    if (isNaN(total) || total <= 0) {
        alert("Please enter a valid positive number for total classes.");
        return;
    }
    if (isNaN(attended) || attended < 0) {
        alert("Please enter a valid number for attended classes.");
        return;
    }
    if (attended > total) {
        alert("Attended classes cannot exceed total classes.");
        return;
    }

    const newSub = {
        id: Date.now().toString(),
        name: nameStr,
        total: total,
        attended: attended
    };

    attSubjectsList.push(newSub);
    saveAttSubjectsData();
    renderAttSubjects();

    El.attSubName.value = '';
    El.totalClasses.value = '';
    El.attendedClasses.value = '';
}

function removeAttSubject(id) {
    attSubjectsList = attSubjectsList.filter(sub => sub.id !== id);
    saveAttSubjectsData();
    renderAttSubjects();
}

let editingAttSubjectId = null;

function renderAttSubjects() {
    El.attSubjectListUl.innerHTML = '';
    
    if (attSubjectsList.length === 0) {
        El.attResultDisplay.style.display = 'none';
        return;
    }
    
    El.attResultDisplay.style.display = 'flex';

    let overallTotal = 0;
    let overallAttended = 0;

    attSubjectsList.forEach(subject => {
        overallTotal += subject.total;
        overallAttended += subject.attended;

        const li = document.createElement('li');
        
        if (editingAttSubjectId === subject.id) {
            li.innerHTML = `
                <div class="subject-item-details" style="flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                    <span class="subject-name" style="flex-basis: 100%; margin-bottom: 0.25rem;">${subject.name}</span>
                    <input type="number" id="edit-attended-${subject.id}" value="${subject.attended}" style="width: 70px; padding: 0.25rem; font-size: 0.85rem;" min="0">
                    <span style="color: var(--text-secondary);">/</span>
                    <input type="number" id="edit-total-${subject.id}" value="${subject.total}" style="width: 70px; padding: 0.25rem; font-size: 0.85rem;" min="1">
                    <div style="display:flex; gap:0.5rem; margin-left: auto;">
                        <button class="secondary-btn save-edit-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-radius: 4px;">Save</button>
                        <button class="dark-btn cancel-edit-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-radius: 4px;">Cancel</button>
                    </div>
                </div>
            `;
            
            const saveBtn = li.querySelector('.save-edit-btn');
            saveBtn.addEventListener('click', () => {
                const newAttended = parseFloat(document.getElementById(`edit-attended-${subject.id}`).value);
                const newTotal = parseFloat(document.getElementById(`edit-total-${subject.id}`).value);
                
                if (isNaN(newTotal) || newTotal <= 0) {
                    alert('Invalid total classes.');
                    return;
                }
                if (isNaN(newAttended) || newAttended < 0 || newAttended > newTotal) {
                    alert('Invalid attended classes. Cannot exceed total classes.');
                    return;
                }
                
                subject.attended = newAttended;
                subject.total = newTotal;
                
                editingAttSubjectId = null;
                saveAttSubjectsData();
                renderAttSubjects();
            });

            const cancelBtn = li.querySelector('.cancel-edit-btn');
            cancelBtn.addEventListener('click', () => {
                editingAttSubjectId = null;
                renderAttSubjects();
            });
            
        } else {
            const percentage = ((subject.attended / subject.total) * 100).toFixed(1);
            const statusClass = percentage >= 75 ? 'text-safe' : 'text-danger';
            
            li.innerHTML = `
                <div class="subject-item-details">
                    <span class="subject-name">${subject.name}</span>
                    <span class="subject-info">${subject.attended}/${subject.total}</span>
                    <span class="subject-info ${statusClass}" style="font-weight:bold;">${percentage}%</span>
                </div>
                <div style="display: flex; gap: 0.25rem;">
                    <button class="edit-btn" title="Edit Subject">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button class="delete-btn" title="Remove Subject">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
            
            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                editingAttSubjectId = subject.id;
                renderAttSubjects();
            });

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => removeAttSubject(subject.id));
        }

        El.attSubjectListUl.appendChild(li);
    });

    updateOverallAttendance(overallTotal, overallAttended);
}

function updateOverallAttendance(total, attended) {
    if (total <= 0) return;

    const percentage = (attended / total) * 100;
    El.attValue.textContent = percentage.toFixed(1) + '%';
    
    if (percentage >= 75) {
        El.attValue.className = 'attendance-percentage text-safe';
        El.attMessage.className = 'attendance-status text-safe';
        El.attMessage.textContent = "You're safe! Keep it up.";
    } else {
        const requiredClasses = Math.ceil((0.75 * total - attended) / 0.25);
        El.attValue.className = 'attendance-percentage text-danger';
        El.attMessage.className = 'attendance-status text-danger';
        El.attMessage.textContent = `Warning! You need to attend ${requiredClasses > 0 ? requiredClasses : 'some'} more consecutive classes to reach 75%.`;
    }
}

function resetAttendance() {
    attSubjectsList = [];
    saveAttSubjectsData();
    renderAttSubjects();

    El.attSubName.value = '';
    El.totalClasses.value = '';
    El.attendedClasses.value = '';
    
    El.attResultDisplay.style.display = 'none';
}

function saveAttSubjectsData() {
    safeSetStorage('academicHelperAttSubjects', JSON.stringify(attSubjectsList));
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
    if(!El.notesListUl) return;

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


/* =====================================
   PDF MANAGER LOGIC
   ===================================== */
function addPdf() {
    let subStr = El.pdfSubject.value.trim();
    const nameStr = El.pdfName.value.trim();
    const linkStr = El.pdfLink.value.trim();

    if (!subStr || !nameStr || !linkStr) {
        alert("Please fill in all PDF fields (Subject, Name, and Link).");
        return;
    }
    
    // Normalize subject string to Title Case to treat 'physics' and 'Physics' the same
    subStr = subStr.split(' ').map(word => 
        word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''
    ).join(' ').trim();
    
    let validLink = linkStr;
    if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = 'https://' + validLink;
    }

    const newPdf = {
        id: Date.now().toString(),
        subject: subStr,
        name: nameStr,
        link: validLink
    };

    pdfsList.push(newPdf);
    savePdfData();
    renderPdfs();

    El.pdfSubject.value = '';
    El.pdfName.value = '';
    El.pdfLink.value = '';
}

function removePdf(id) {
    pdfsList = pdfsList.filter(pdf => pdf.id !== id);
    savePdfData();
    renderPdfs();
}

function renderPdfs() {
    if (!El.pdfListContainer) return;
    
    El.pdfListContainer.innerHTML = '';
    
    if (pdfsList.length === 0) return;

    // Grouping by subject
    const grouped = {};
    pdfsList.forEach(pdf => {
        if (!grouped[pdf.subject]) grouped[pdf.subject] = [];
        grouped[pdf.subject].push(pdf);
    });

    for (let sub in grouped) {
        const groupDiv = document.createElement('div');
        groupDiv.style.marginBottom = '1rem';
        
        const heading = document.createElement('h3');
        heading.textContent = sub;
        heading.style.fontSize = '0.95rem';
        heading.style.marginBottom = '0.5rem';
        heading.style.color = 'var(--text-secondary)';
        heading.style.textTransform = 'uppercase';
        heading.style.letterSpacing = '0.05em';
        groupDiv.appendChild(heading);
        
        const ul = document.createElement('ul');
        grouped[sub].forEach(pdf => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="subject-item-details" style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <span class="subject-name" style="word-break:break-all; padding-right:10px;">${pdf.name}</span>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <a href="${pdf.link}" target="_blank" class="secondary-btn" style="padding:0.25rem 0.5rem; font-size:0.8rem; border-radius:4px; text-decoration:none;">Open</a>
                        <button class="delete-btn" title="Remove PDF" style="margin:0; padding:0.25rem;">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => removePdf(pdf.id));
            
            ul.appendChild(li);
        });
        
        groupDiv.appendChild(ul);
        El.pdfListContainer.appendChild(groupDiv);
    }
}

function savePdfData() {
    safeSetStorage('academicHelperPdfs', JSON.stringify(pdfsList));
}

// Ensure the code only runs after the document is explicitly loaded!
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
