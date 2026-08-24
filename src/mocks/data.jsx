// Mock Database State

export const initialElection = {
  id: 'election-1',
  title: '2026 Campus Student Elections',
  status: 'OPEN', // 'OPEN' or 'CLOSED'
};

export const initialCategories = [
  { id: 'cat-1', name: 'Student Body President', electionId: 'election-1' },
  { id: 'cat-2', name: 'Vice President of Activities', electionId: 'election-1' },
  { id: 'cat-3', name: 'Treasurer', electionId: 'election-1' },
  { id: 'cult-cat-1', name: 'Cultural Club President', electionId: 'election-1' },
  { id: 'cult-cat-2', name: 'Cultural Club Vice President', electionId: 'election-1' },
  { id: 'cult-cat-3', name: 'Cultural Club Treasurer', electionId: 'election-1' },

  // Event Categories
  { id: 'ev-symp-theme', name: 'College Symposium - Preferred Event Theme', electionId: 'election-event' },
  { id: 'ev-symp-domain', name: 'College Symposium - Best Technical Domain', electionId: 'election-event' },
  { id: 'ev-symp-topic', name: 'College Symposium - Guest Speaker Topic', electionId: 'election-event' },
  { id: 'ev-fest-theme', name: 'Cultural Fest - Preferred Theme Name', electionId: 'election-event' },
  { id: 'ev-fest-activity', name: 'Cultural Fest - Preferred Main Activity', electionId: 'election-event' },
  { id: 'ev-work-topic', name: 'Technical Workshop - Preferred Workshop Topic', electionId: 'election-event' },
  { id: 'ev-work-session', name: 'Technical Workshop - Hands-on Session Type', electionId: 'election-event' },
];

export const initialCandidates = [
  // Symposium Theme
  { id: 'cand-symp-theme-1', name:'🤖 AI & Future Technologies', categoryId: 'ev-symp-theme', imageUrl: '/images/events/theme.jpg', gender: 'male', bio: 'AI theme option', manifesto: 'Vote for AI' },
  { id: 'cand-symp-theme-2', name: '🌐 Digital Innovation & Smart Future', categoryId: 'ev-symp-theme', imageUrl: '/images/events/theme.jpg', gender: 'male', bio: 'Security theme option', manifesto: 'Vote for Security' },
  { id: 'cand-symp-theme-3', name: '🚀 Technology Beyond Boundaries', categoryId: 'ev-symp-theme', imageUrl: '/images/events/theme.jpg', gender: 'male', bio: 'Quantum theme option', manifesto: 'Vote for Quantum' },
  
  // Symposium Domain
  { id: 'cand-symp-dom-1', name: '🤖 Artificial Intelligence & Machine Learning', categoryId: 'ev-symp-domain', imageUrl: '/images/events/domain.jpg', gender: 'male', bio: 'Fullstack focus', manifesto: 'Vote for Fullstack' },
  { id: 'cand-symp-dom-2', name: '🔐 Cybersecurity & Ethical Hacking', categoryId: 'ev-symp-domain', imageUrl: '/images/events/domain.jpg', gender: 'male', bio: 'Web3 focus', manifesto: 'Vote for Web3' },
  { id: 'cand-symp-dom-3', name: '☁️ Cloud Computing & DevOps', categoryId: 'ev-symp-domain', imageUrl: '/images/events/domain.jpg', gender: 'male', bio: 'AI focus', manifesto: 'Vote for AI' },

  // Symposium Topic
  { id: 'cand-symp-top-1', name: 'How AI is Transforming the Future of Technology', categoryId: 'ev-symp-topic', imageUrl: '/images/events/topic.jpg', gender: 'male', bio: 'Careers talk', manifesto: 'Vote for Careers' },
  { id: 'cand-symp-top-2', name: 'Career Opportunities in Software Development', categoryId: 'ev-symp-topic', imageUrl: '/images/events/topic.jpg', gender: 'male', bio: 'Open source talk', manifesto: 'Vote for Open Source' },
  { id: 'cand-symp-top-3', name: 'Cybersecurity in the Modern Digital World', categoryId: 'ev-symp-topic', imageUrl: '/images/events/topic.jpg', gender: 'male', bio: 'Scaling talk', manifesto: 'Vote for Scaling' },

  // Cultural Fest Theme
  { id: 'cand-fest-theme-1', name: '🎉 Carnival of Creativity', categoryId: 'ev-fest-theme', imageUrl: '/images/events/theme.jpg', gender: 'male', bio: 'Spectrum theme', manifesto: 'Vote for Spectrum' },
  { id: 'cand-fest-theme-2', name: '✨ Rhythm of Youth', categoryId: 'ev-fest-theme', imageUrl: '/images/events/theme.jpg', gender: 'male', bio: 'Aura theme', manifesto: 'Vote for Aura' },
  { id: 'cand-fest-theme-3', name: '🚀 Beyond the Ordinary', categoryId: 'ev-fest-theme', imageUrl: '/images/events/theme.jpg', gender: 'male', bio: 'Cosmic theme', manifesto: 'Vote for Cosmic' },

  // Cultural Fest Activity
  { id: 'cand-fest-act-1', name: '🎤 Singing Competition', categoryId: 'ev-fest-activity', imageUrl: '/images/events/activity.jpg', gender: 'male', bio: 'Bands activity', manifesto: 'Vote for Bands' },
  { id: 'cand-fest-act-2', name: '🎭 Drama & Theatre', categoryId: 'ev-fest-activity', imageUrl: '/images/events/activity.jpg', gender: 'male', bio: 'Dance activity', manifesto: 'Vote for Dance' },
  { id: 'cand-fest-act-3', name: '👗 Fashion Show', categoryId: 'ev-fest-activity', imageUrl: '/images/events/activity.jpg', gender: 'male', bio: 'Drama activity', manifesto: 'Vote for Drama' },

  // Workshop Topic
  { id: 'cand-work-top-1', name: '🌐 Full Stack Web Development', categoryId: 'ev-work-topic', imageUrl: '/images/events/topic.jpg', gender: 'male', bio: 'React Native', manifesto: 'Vote for React Native' },
  { id: 'cand-work-top-2', name: '🔐 Cybersecurity & Ethical Hacking', categoryId: 'ev-work-topic', imageUrl: '/images/events/topic.jpg', gender: 'male', bio: 'Rust', manifesto: 'Vote for Rust' },
  { id: 'cand-work-top-3', name: '☁️ Cloud Computing & DevOps', categoryId: 'ev-work-topic', imageUrl: '/images/events/topic.jpg', gender: 'male', bio: 'Docker', manifesto: 'Vote for Docker' },

  // Workshop Session
  { id: 'cand-work-ses-1', name: '💻 Build a Real-Time Web Application', categoryId: 'ev-work-session', imageUrl: '/images/events/session.jpg', gender: 'male', bio: 'Project build', manifesto: 'Vote for Project build' },
  { id: 'cand-work-ses-2', name: '🔐 Cybersecurity Challenge and Capture-the-Flag', categoryId: 'ev-work-session', imageUrl: '/images/events/session.jpg', gender: 'male', bio: 'CTF challenge', manifesto: 'Vote for CTF' },
  { id: 'cand-work-ses-3', name: '🤖 Develop a Simple AI/ML Project', categoryId: 'ev-work-session', imageUrl: '/images/events/session.jpg', gender: 'male', bio: 'Optimization session', manifesto: 'Vote for Optimization' }
];

// In-Memory Database instances with localStorage persistence to survive page reloads
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const loadFromStorage = (key, defaultValue) => {
  if (!isBrowser) return defaultValue;
  const data = window.localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = (key, value) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const initialValidStudents = Array.from(
  { length: 50 },
  (_, i) => `23CS${String(i + 1).padStart(3, '0')}`
);

export const initialManagers = [
  { username: 'admin', email: 'admin123@gmail.com', password: 'admin123', name: 'Election Manager' }
];

export let election = loadFromStorage('voting_election', { ...initialElection });
export let eventElection = loadFromStorage('voting_event_election', {
  id: 'election-event',
  title: '2026 Campus Event Decisions',
  status: 'OPEN',
});
export let categories = loadFromStorage('voting_categories', [...initialCategories]);
export let candidates = loadFromStorage('voting_candidates', [...initialCandidates]);
export let votes = loadFromStorage('voting_votes', []);
export let receipts = loadFromStorage('voting_receipts', []);
export let managers = loadFromStorage('voting_managers', [...initialManagers]);
export let validStudents = loadFromStorage('voting_valid_students', [...initialValidStudents]);

// Migration: upgrade 3-category database to include cultural club and event categories
if (isBrowser && (categories.length === 3 || categories.length === 6)) {
  categories = [...initialCategories];
  saveToStorage('voting_categories', categories);
}

// Migration: ensure event candidates are seeded if missing
const hasEventCandidates = candidates.some(c => c.categoryId.startsWith('ev-'));
if (isBrowser && !hasEventCandidates) {
  candidates = [...candidates, ...initialCandidates.filter(c => c.categoryId.startsWith('ev-'))];
  saveToStorage('voting_candidates', candidates);
}

// Migration: update existing candidate names if they match old default event candidate names
if (isBrowser) {
  const oldToNewNameMap = {
    'AI Revolution & Cognitive Agents': '🤖 AI & Future Technologies',
    'Cybersecurity & Zero Trust Architecture': '🌐 Digital Innovation & Smart Future',
    'Quantum Computing Frontiers': '🚀 Technology Beyond Boundaries',
    'Full Stack Development': '🤖 Artificial Intelligence & Machine Learning',
    'Web3 & Blockchain Technology': '🔐 Cybersecurity & Ethical Hacking',
    'Artificial Intelligence & Machine Learning': '☁️ Cloud Computing & DevOps',
    'Careers in AI': 'How AI is Transforming the Future of Technology',
    'Future of Open Source': 'Career Opportunities in Software Development',
    'Scaling Systems': 'Cybersecurity in the Modern Digital World',
    'Spectrum 2026': '🎉 Carnival of Creativity',
    'Aura Music Fest': '✨ Rhythm of Youth',
    'Cosmic Beats & Retro Waves': '🚀 Beyond the Ordinary',
    'Battle of the Bands': '🎤 Singing Competition',
    'Street Dancing Tournament': '🎭 Drama & Theatre',
    'Dramatics & Theatrics Showcase': '👗 Fashion Show',
    'Cross-Platform Apps with React Native': '🌐 Full Stack Web Development',
    'Memory-Safe Systems Programming in Rust': '🔐 Cybersecurity & Ethical Hacking',
    'Cloud Operations with Docker & Kubernetes': '☁️ Cloud Computing & DevOps',
    'End-to-End Project Construction': '💻 Build a Real-Time Web Application',
    'Capture the Flag (CTF) Security Games': '🔐 Cybersecurity Challenge and Capture-the-Flag',
    'Code Refactoring & Performance Challenge': '🤖 Develop a Simple AI/ML Project'
  };

  let candidatesUpdated = false;
  candidates = candidates.map(c => {
    if (oldToNewNameMap[c.name]) {
      candidatesUpdated = true;
      return { ...c, name: oldToNewNameMap[c.name] };
    }
    return c;
  });

  if (candidatesUpdated) {
    saveToStorage('voting_candidates', candidates);
  }
}

// Save to storage immediately so the key appears in DevTools Local Storage
if (isBrowser && !window.localStorage.getItem('voting_valid_students')) {
  saveToStorage('voting_valid_students', validStudents);
}

// Database schema migration: ensure manager has correct email and password
if (managers.length > 0 && (!managers[0].hasOwnProperty('email') || managers[0].password !== initialManagers[0].password)) {
  managers = [...initialManagers];
  saveToStorage('voting_managers', managers);
}

// Reset database functions for testing/visual integrity
export const resetDb = () => {
  election = { ...initialElection };
  eventElection = {
    id: 'election-event',
    title: '2026 Campus Event Decisions',
    status: 'OPEN',
  };
  categories = [...initialCategories];
  candidates = [...initialCandidates];
  votes = [];
  receipts = [];
  managers = [...initialManagers];
  validStudents = [...initialValidStudents];
  
  if (isBrowser) {
    window.localStorage.removeItem('voting_election');
    window.localStorage.removeItem('voting_event_election');
    window.localStorage.removeItem('voting_categories');
    window.localStorage.removeItem('voting_candidates');
    window.localStorage.removeItem('voting_votes');
    window.localStorage.removeItem('voting_receipts');
    window.localStorage.removeItem('voting_managers');
    window.localStorage.removeItem('voting_valid_students');
  }
};

export const setElectionStatus = (status, module = 'club') => {
  if (module === 'event') {
    eventElection.status = status;
    saveToStorage('voting_event_election', eventElection);
  } else {
    election.status = status;
    saveToStorage('voting_election', election);
  }
};

export const addCandidate = (cand) => {
  const newCand = {
    ...cand,
    id: `cand-${Date.now()}`,
    votesCount: 0
  };
  candidates.push(newCand);
  saveToStorage('voting_candidates', candidates);
  return newCand;
};

export const updateCandidate = (id, fields) => {
  const idx = candidates.findIndex(c => c.id === id);
  if (idx !== -1) {
    candidates[idx] = { ...candidates[idx], ...fields };
    saveToStorage('voting_candidates', candidates);
    return candidates[idx];
  }
  return null;
};

export const deleteCandidate = (id) => {
  const idx = candidates.findIndex(c => c.id === id);
  if (idx !== -1) {
    const deleted = candidates[idx];
    candidates.splice(idx, 1);
    saveToStorage('voting_candidates', candidates);
    return deleted;
  }
  return null;
};

export const castVote = (studentId, categoryId, candidateId) => {
  const voteId = `vote-${Date.now()}`;
  const receiptId = `receipt-${Date.now()}`;
  
  const vote = {
    id: voteId,
    studentId,
    categoryId,
    candidateId,
    createdAt: new Date().toISOString(),
  };
  votes.push(vote);
  saveToStorage('voting_votes', votes);

  // Increment candidate's vote count
  const cand = candidates.find(c => c.id === candidateId);
  if (cand) {
    cand.votesCount = (cand.votesCount || 0) + 1;
    saveToStorage('voting_candidates', candidates);
  }

  const receipt = {
    id: receiptId,
    voteId,
    studentId,
    categoryId,
    candidateId,
    issuedAt: new Date().toISOString(),
  };
  receipts.push(receipt);
  saveToStorage('voting_receipts', receipts);

  return receipt;
};
