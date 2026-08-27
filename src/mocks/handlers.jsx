import { http, HttpResponse } from 'msw';
import { 
  election, 
  eventElection,
  categories, 
  candidates, 
  votes, 
  receipts, 
  castVote, 
  addCandidate, 
  updateCandidate, 
  deleteCandidate,
  setElectionStatus,
  resetDb,
  managers,
  validStudents
} from './data';
import { ROLES, hasPermission, PERMISSIONS } from '../utils/permissions';

// Helper to dynamically calculate and return candidates with updated vote counts for events
const getUpdatedCandidates = () => {
  let storedEventVotes = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem('voting_event_votes');
      if (raw) {
        storedEventVotes = JSON.parse(raw);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return candidates.map(c => {
    if (c.categoryId.startsWith('ev-')) {
      let count = 0;
      storedEventVotes.forEach(v => {
        if (v.selections) {
          Object.values(v.selections).forEach(val => {
            if (val === c.name) {
              count++;
            }
          });
        }
      });
      return { ...c, votesCount: count };
    }
    return c;
  });
};

// Helper to check role permission from request headers
const checkHeaderPermission = (request, permission) => {
  const role = request.headers.get('x-user-role');
  return hasPermission(role, permission);
};

export const handlers = [
  // POST student login authentication
  http.post('/api/auth/student-login', async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const { studentId, dob } = body;
    if (!studentId || !studentId.trim()) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Student ID is required.' } },
        { status: 400 }
      );
    }

    if (!dob || !dob.trim()) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Date of Birth (DOB) is required.' } },
        { status: 400 }
      );
    }

    const cleanId = studentId.trim();
    const cleanDob = dob.trim();

    // Look up matching student in validStudents (dynamically load from local storage to handle manual changes)
    let freshValidStudents = [...validStudents];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('voting_valid_students');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            freshValidStudents = parsed;
          }
        }
      } catch (e) {
        console.error('Error fetching dynamic validStudents:', e);
      }
    }

    const foundStudent = freshValidStudents.find(s => {
      if (s && typeof s === 'object') {
        return (s.studentId === cleanId || s.id === cleanId);
      }
      return s === cleanId;
    });

    if (!foundStudent) {
      return HttpResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Invalid Student ID. Only registered students (23CS001 to 23CS050) are authorized to vote.' 
          } 
        },
        { status: 401 }
      );
    }

    // Determine stored DOB from mock database
    let storedDob = null;
    if (foundStudent && typeof foundStudent === 'object') {
      storedDob = foundStudent.dob || foundStudent.dateOfBirth || null;
    }

    // Fallback: Check secondary mapping in case it's stored separately in localStorage
    if (!storedDob && typeof window !== 'undefined' && window.localStorage) {
      try {
        const rawDobs = window.localStorage.getItem('voting_student_dobs');
        if (rawDobs) {
          const parsed = JSON.parse(rawDobs);
          storedDob = parsed[cleanId] || null;
        }
      } catch (e) {
        console.error('Error reading secondary voting_student_dobs:', e);
      }
    }

    // Check if the entered DOB matches the stored DOB
    if (!storedDob || cleanDob !== storedDob) {
      return HttpResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication failed: Incorrect Date of Birth.' 
          } 
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        role: ROLES.STUDENT,
        studentId: cleanId,
        name: `Student (${cleanId})`,
      }
    });
  }),

  // POST manager login authentication
  http.post('/api/auth/manager-login', async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const { username, password } = body;
    if (!username || !password) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Username and password are required fields.' } },
        { status: 400 }
      );
    }

    const matchedManager = managers.find(
      (m) => (m.username === username.trim() || m.email === username.trim()) && m.password === password
    );

    if (!matchedManager) {
      return HttpResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid username or password.' } },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        role: ROLES.MANAGER,
        username: matchedManager.username,
        name: matchedManager.name,
      }
    });
  }),

  // GET election metadata
  http.get('/api/elections/:id', ({ params, request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module') || 'club';
    
    const currentElection = module === 'event' ? eventElection : election;
    const filteredCategories = categories.filter(c => {
      if (module === 'event') {
        return c.id.startsWith('ev-');
      } else {
        return !c.id.startsWith('ev-');
      }
    });

    return HttpResponse.json({
      success: true,
      data: {
        election: currentElection,
        categories: filteredCategories
      }
    });
  }),

  // GET candidates for a category
  http.get('/api/categories/:categoryId/candidates', ({ params }) => {
    const catExists = categories.some(c => c.id === params.categoryId);
    if (!catExists) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }
    const filteredCandidates = getUpdatedCandidates().filter(c => c.categoryId === params.categoryId);
    return HttpResponse.json({
      success: true,
      data: filteredCandidates
    });
  }),

  // GET all candidates
  http.get('/api/candidates', () => {
    return HttpResponse.json({
      success: true,
      data: getUpdatedCandidates()
    });
  }),

  // GET candidate profile
  http.get('/api/candidates/:id', ({ params }) => {
    const candidate = getUpdatedCandidates().find(c => c.id === params.id);
    if (!candidate) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: candidate
    });
  }),

  // POST cast vote (Student only)
  http.post('/api/votes', async ({ request }) => {
    const role = request.headers.get('x-user-role');
    const studentId = request.headers.get('x-student-id');

    // 1. Role-Based Check
    if (role !== ROLES.STUDENT || !studentId) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Student Voters are authorized to cast votes.' } },
        { status: 403 }
      );
    }

    // 2. Election Status Check
    if (election.status !== 'OPEN') {
      return HttpResponse.json(
        { success: false, error: { code: 'ELECTION_CLOSED', message: 'Voting is currently closed for this election.' } },
        { status: 409 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const { categoryId, candidateId } = body;

    // 3. Validation Check
    if (!categoryId || !candidateId) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Category ID and Candidate ID are required.' } },
        { status: 400 }
      );
    }

    const categoryExists = categories.some(c => c.id === categoryId);
    const candidateExists = candidates.some(c => c.id === candidateId && c.categoryId === categoryId);

    if (!categoryExists || !candidateExists) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Selected Category or Candidate not found.' } },
        { status: 404 }
      );
    }

    // 4. Duplicate Vote Check: unique(studentId, categoryId)
    const hasAlreadyVoted = votes.some(v => v.studentId === studentId && v.categoryId === categoryId);
    if (hasAlreadyVoted) {
      return HttpResponse.json(
        { success: false, error: { code: 'ALREADY_VOTED', message: 'You have already cast a vote in this category.' } },
        { status: 409 }
      );
    }

    // Cast vote and generate receipt
    const receipt = castVote(studentId, categoryId, candidateId);

    return HttpResponse.json({
      success: true,
      data: receipt
    });
  }),

  // GET vote receipt (Student only / Auditing)
  http.get('/api/receipts/:id', ({ params, request }) => {
    const role = request.headers.get('x-user-role');
    const studentId = request.headers.get('x-student-id');

    if (!role) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access Denied: Authenticated role required.' } },
        { status: 403 }
      );
    }

    const receipt = receipts.find(r => r.id === params.id);
    if (!receipt) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Receipt not found.' } },
        { status: 404 }
      );
    }

    // If student, they can only view their own receipt
    if (role === ROLES.STUDENT && receipt.studentId !== studentId) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access Denied: You can only view your own receipt.' } },
        { status: 403 }
      );
    }

    // Find candidate and category info to display on receipt
    const cand = candidates.find(c => c.id === receipt.candidateId);
    const cat = categories.find(c => c.id === receipt.categoryId);

    return HttpResponse.json({
      success: true,
      data: {
        ...receipt,
        candidateName: cand ? cand.name : 'Unknown Candidate',
        categoryName: cat ? cat.name : 'Unknown Category',
        parentId: cat ? cat.parentId : null
      }
    });
  }),

  // GET voter status (categories where this student has already voted)
  http.get('/api/voter/status', ({ request }) => {
    const role = request.headers.get('x-user-role');
    const studentId = request.headers.get('x-student-id');

    if (role !== ROLES.STUDENT || !studentId) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Student Voters have voting status.' } },
        { status: 403 }
      );
    }

    const studentVotes = votes.filter(v => v.studentId === studentId);
    const votedCategoryIds = studentVotes.reduce((acc, v) => {
      acc[v.categoryId] = {
        candidateId: v.candidateId,
        voteId: v.id,
        receiptId: receipts.find(r => r.voteId === v.id)?.id || null
      };
      return acc;
    }, {});

    return HttpResponse.json({
      success: true,
      data: {
        votedCategoryIds,
        hasVotedAny: studentVotes.length > 0
      }
    });
  }),

  // ==========================================
  // MANAGER ENDPOINTS
  // ==========================================

  // POST create candidate (Manager only)
  http.post('/api/manager/candidates', async ({ request }) => {
    if (!checkHeaderPermission(request, PERMISSIONS.ADD_CANDIDATE)) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access Denied: Election Manager permission required.' } },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const { categoryId, name, bio, manifesto, imageUrl, gender } = body;

    if (!categoryId || !name || !bio || !manifesto) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Category ID, name, bio, and manifesto are required fields.' } },
        { status: 400 }
      );
    }

    const categoryExists = categories.some(c => c.id === categoryId);
    if (!categoryExists) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Associated Category not found.' } },
        { status: 404 }
      );
    }

    const cleanGender = (gender || 'male').toLowerCase() === 'female' ? 'female' : 'male';
    const randomIndex = Math.floor(Math.random() * 50) + 1;
    
    // Assign custom image URL if provided; otherwise, auto-assign based on gender
    const finalImageUrl = (imageUrl && imageUrl.trim() !== '') 
      ? imageUrl.trim() 
      : `/images/candidates/${cleanGender}/${randomIndex}.jpg`;

    const newCandidate = addCandidate({
      categoryId,
      name,
      bio,
      manifesto,
      gender: cleanGender,
      imageUrl: finalImageUrl
    });

    return HttpResponse.json({
      success: true,
      data: newCandidate
    });
  }),

  // PATCH edit candidate (Manager only)
  http.patch('/api/manager/candidates/:id', async ({ params, request }) => {
    if (!checkHeaderPermission(request, PERMISSIONS.EDIT_CANDIDATE)) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access Denied: Election Manager permission required.' } },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const { gender, imageUrl } = body;
    const existingCandidate = candidates.find(c => c.id === params.id);
    const currentImageUrl = (imageUrl !== undefined ? imageUrl : existingCandidate?.imageUrl) || '';
    const cleanGender = (gender || existingCandidate?.gender || 'male').toLowerCase() === 'female' ? 'female' : 'male';

    if (gender) {
      body.gender = cleanGender;
    }

    const isDefaultMalePhoto = (url) => {
      return !url || 
        url.includes('photo-1535713875002-d1d0cf377fde') || 
        url.includes('/images/candidates/male/');
    };
    
    const isDefaultFemalePhoto = (url) => {
      return url.includes('/images/candidates/female/');
    };

    const needsFemalePhoto = cleanGender === 'female' && isDefaultMalePhoto(currentImageUrl);
    const needsMalePhoto = cleanGender === 'male' && isDefaultFemalePhoto(currentImageUrl);

    // If image URL is explicitly cleared, is empty, or is a default placeholder that mismatches the gender, auto-assign
    if (imageUrl === '' || !currentImageUrl.trim() || needsFemalePhoto || needsMalePhoto) {
      const randomIndex = Math.floor(Math.random() * 50) + 1;
      body.imageUrl = `/images/candidates/${cleanGender}/${randomIndex}.jpg`;
    }

    console.log('PATCH BODY:', body);
    const updated = updateCandidate(params.id, body);
    console.log('UPDATED CANDIDATE:', updated);
    if (!updated) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found.' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: updated
    });
  }),

  // DELETE candidate (Manager only)
  http.delete('/api/manager/candidates/:id', ({ params, request }) => {
    if (!checkHeaderPermission(request, PERMISSIONS.EDIT_CANDIDATE)) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access Denied: Election Manager permission required.' } },
        { status: 403 }
      );
    }

    const deleted = deleteCandidate(params.id);
    if (!deleted) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found.' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: deleted
    });
  }),

  // PATCH toggle voting status (Manager only)
  http.patch('/api/manager/elections/:id/status', async ({ params, request }) => {
    if (!checkHeaderPermission(request, PERMISSIONS.TOGGLE_VOTING)) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access Denied: Election Manager permission required.' } },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const module = url.searchParams.get('module') || 'club';

    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const { status } = body;
    if (status !== 'OPEN' && status !== 'CLOSED') {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Status must be either OPEN or CLOSED.' } },
        { status: 400 }
      );
    }

    setElectionStatus(status, module);

    const currentElection = module === 'event' ? eventElection : election;

    return HttpResponse.json({
      success: true,
      data: currentElection
    });
  }),

  // GET live tally (Manager only, but check role)
  http.get('/api/manager/elections/:id/tally', ({ params, request }) => {
    if (!checkHeaderPermission(request, PERMISSIONS.VIEW_TALLY)) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access Denied: Election Manager permission required.' } },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const module = url.searchParams.get('module') || 'club';

    const currentElection = module === 'event' ? eventElection : election;
    const filteredCategories = categories.filter(c => {
      if (module === 'event') {
        return c.id.startsWith('ev-');
      } else {
        return !c.id.startsWith('ev-');
      }
    });

    // If event module, dynamically count votes from localStorage 'voting_event_votes'
    let storedEventVotes = [];
    if (module === 'event' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('voting_event_votes');
        if (raw) {
          storedEventVotes = JSON.parse(raw);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Aggregate tally results
    const categoryTallies = filteredCategories.map(cat => {
      const catCandidates = candidates.filter(c => c.categoryId === cat.id);
      
      const items = catCandidates.map(c => {
        let votesCount = c.votesCount || 0;
        if (module === 'event') {
          // Count occurrences of this option text in local storage event votes
          votesCount = 0;
          storedEventVotes.forEach(v => {
            if (v.selections) {
              Object.values(v.selections).forEach(val => {
                if (val === c.name) {
                  votesCount++;
                }
              });
            }
          });
        }
        
        return {
          candidateId: c.id,
          candidateName: c.name,
          imageUrl: c.imageUrl,
          gender: c.gender || 'male',
          votes: votesCount,
          percentage: 0 // Will compute below
        };
      });

      const totalCatVotes = items.reduce((sum, item) => sum + item.votes, 0);
      items.forEach(item => {
        item.percentage = totalCatVotes > 0 ? Math.round((item.votes / totalCatVotes) * 100) : 0;
      });

      // Sort candidates by votes descending
      items.sort((a, b) => b.votes - a.votes);

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        totalVotes: totalCatVotes,
        candidates: items
      };
    });

    const totalVotesVolume = module === 'event' 
      ? storedEventVotes.length 
      : votes.length;

    return HttpResponse.json({
      success: true,
      data: {
        electionId: currentElection.id,
        electionTitle: currentElection.title,
        status: currentElection.status,
        totalVotesCast: totalVotesVolume,
        tallies: categoryTallies
      }
    });
  }),

  // GET all votes history (Manager only)
  http.get('/api/manager/votes', ({ request }) => {
    if (!checkHeaderPermission(request, PERMISSIONS.VIEW_TALLY)) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access Denied: Election Manager permission required.' } },
        { status: 403 }
      );
    }

    const votesList = votes.map(v => {
      const cand = candidates.find(c => c.id === v.candidateId);
      const cat = categories.find(c => c.id === v.categoryId);
      return {
        id: v.id,
        studentId: v.studentId,
        candidateName: cand ? cand.name : 'Unknown Candidate',
        categoryName: cat ? cat.name : 'Unknown Category',
        createdAt: v.createdAt
      };
    });

    // Sort newest votes first
    votesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return HttpResponse.json({
      success: true,
      data: votesList
    });
  }),

  // POST create category
  http.post('/api/categories', async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const { name, description, status, parentId, electionId } = body;
    if (!name) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Category name is required.' } },
        { status: 400 }
      );
    }

    let prefix = 'ev-cat-';
    if (electionId === 'election-1') {
      prefix = parentId ? 'club-pos-' : 'club-cat-';
    } else {
      prefix = parentId ? 'ev-q-' : 'ev-cat-';
    }

    const timestamp = Date.now();
    const newCategory = {
      id: `${prefix}${timestamp}`,
      name: name.trim(),
      description: description || '',
      status: status || 'ACTIVE',
      parentId: parentId || null,
      electionId: electionId || 'election-event'
    };

    categories.push(newCategory);

    // If creating a club parent card (no parentId and electionId === 'election-1')
    // auto-create the three default positions: President, Vice President, Treasurer
    if (electionId === 'election-1' && !parentId) {
      const defaultPositions = [
        { id: `club-pos-${timestamp}-pres`, name: 'President', parentId: newCategory.id, electionId: 'election-1' },
        { id: `club-pos-${timestamp}-vp`, name: 'Vice President', parentId: newCategory.id, electionId: 'election-1' },
        { id: `club-pos-${timestamp}-tr`, name: 'Treasurer', parentId: newCategory.id, electionId: 'election-1' }
      ];
      defaultPositions.forEach(pos => categories.push(pos));
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('voting_categories', JSON.stringify(categories));
    }

    return HttpResponse.json({
      success: true,
      data: newCategory
    });
  }),

  // PUT update category
  http.put('/api/categories/:id', async ({ params, request }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const idx = categories.findIndex(c => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found.' } },
        { status: 404 }
      );
    }

    categories[idx] = {
      ...categories[idx],
      ...body,
      id: params.id // lock ID
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('voting_categories', JSON.stringify(categories));
    }

    return HttpResponse.json({
      success: true,
      data: categories[idx]
    });
  }),

  // DELETE category
  http.delete('/api/categories/:id', ({ params }) => {
    const idx = categories.findIndex(c => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found.' } },
        { status: 404 }
      );
    }

    const deleted = categories[idx];
    categories.splice(idx, 1);
    
    // Also delete any child questions/positions if this was a club/event category
    if (deleted.id.startsWith('ev-cat-') || deleted.id.startsWith('club-cat-')) {
      const childQuestions = categories.filter(c => c.parentId === deleted.id);
      childQuestions.forEach(q => {
        const qIdx = categories.findIndex(c => c.id === q.id);
        if (qIdx !== -1) categories.splice(qIdx, 1);
        // Also delete options/candidates under those child categories
        const opts = candidates.filter(cand => cand.categoryId === q.id);
        opts.forEach(opt => {
          const optIdx = candidates.findIndex(cand => cand.id === opt.id);
          if (optIdx !== -1) candidates.splice(optIdx, 1);
        });
      });
    } else if (deleted.id.startsWith('ev-q-') || deleted.id.startsWith('club-pos-')) {
      // If this was a question/position, delete its options
      const opts = candidates.filter(cand => cand.categoryId === deleted.id);
      opts.forEach(opt => {
        const optIdx = candidates.findIndex(cand => cand.id === opt.id);
        if (optIdx !== -1) candidates.splice(optIdx, 1);
      });
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('voting_categories', JSON.stringify(categories));
      window.localStorage.setItem('voting_candidates', JSON.stringify(candidates));
    }

    return HttpResponse.json({
      success: true,
      data: deleted
    });
  }),

  // Helper endpoint for E2E testing to reset the state
  http.post('/api/debug/reset', () => {
    resetDb();
    return HttpResponse.json({ success: true, message: 'Database reset successfully' });
  })
];
