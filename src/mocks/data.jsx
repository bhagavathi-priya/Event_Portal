// Mock Database State
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const initialElection = {
  id: 'election-1',
  title: '2026 Campus Student Elections',
  status: 'OPEN', // 'OPEN' or 'CLOSED'
};

export const initialCategories = [];

export const initialCandidates = [];

// In-Memory Database instances with localStorage persistence to survive page reloads

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



// Save to storage immediately so the key appears in DevTools Local Storage
if (isBrowser && !window.localStorage.getItem('voting_valid_students')) {
  saveToStorage('voting_valid_students', validStudents);
}

export const studentDobsMap = {
  "23CS001": "2005-01-01",
  "23CS002": "2005-01-02",
  "23CS003": "2005-01-03",
  "23CS004": "2005-01-04",
  "23CS005": "2005-01-05",
  "23CS006": "2005-01-06",
  "23CS007": "2005-01-07",
  "23CS008": "2005-01-08",
  "23CS009": "2005-01-09",
  "23CS010": "2005-01-10",
  "23CS011": "2005-01-11",
  "23CS012": "2005-01-12",
  "23CS013": "2005-01-13",
  "23CS014": "2005-01-14",
  "23CS015": "2005-01-15",
  "23CS016": "2005-01-16",
  "23CS017": "2005-01-17",
  "23CS018": "2005-01-18",
  "23CS019": "2005-01-19",
  "23CS020": "2005-01-20",
  "23CS021": "2005-01-21",
  "23CS022": "2005-01-22",
  "23CS023": "2005-01-23",
  "23CS024": "2005-01-24",
  "23CS025": "2005-01-25",
  "23CS026": "2005-01-26",
  "23CS027": "2005-01-27",
  "23CS028": "2005-01-28",
  "23CS029": "2005-02-01",
  "23CS030": "2005-02-02",
  "23CS031": "2005-02-03",
  "23CS032": "2005-02-04",
  "23CS033": "2005-02-05",
  "23CS034": "2005-02-06",
  "23CS035": "2005-02-07",
  "23CS036": "2005-02-08",
  "23CS037": "2005-02-09",
  "23CS038": "2005-02-10",
  "23CS039": "2005-02-11",
  "23CS040": "2005-02-12",
  "23CS041": "2005-02-13",
  "23CS042": "2005-02-14",
  "23CS043": "2005-02-15",
  "23CS044": "2005-02-16",
  "23CS045": "2005-02-17",
  "23CS046": "2005-02-18",
  "23CS047": "2005-02-19",
  "23CS048": "2005-02-20",
  "23CS049": "2005-02-21",
  "23CS050": "2005-02-22"
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
