import { http, HttpResponse } from 'msw';
import { 
  election, 
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

    const { studentId } = body;
    if (!studentId || !studentId.trim()) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Student ID is required.' } },
        { status: 400 }
      );
    }

    const cleanId = studentId.trim();
    const isValid = validStudents.includes(cleanId);

    if (!isValid) {
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
  http.get('/api/elections/:id', ({ params }) => {
    if (election.id !== params.id) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Election not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        election,
        categories: categories.filter(c => c.electionId === params.id)
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
    const filteredCandidates = candidates.filter(c => c.categoryId === params.categoryId);
    return HttpResponse.json({
      success: true,
      data: filteredCandidates
    });
  }),

  // GET candidate profile
  http.get('/api/candidates/:id', ({ params }) => {
    const candidate = candidates.find(c => c.id === params.id);
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
        categoryName: cat ? cat.name : 'Unknown Category'
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

    const { categoryId, name, bio, manifesto, imageUrl } = body;

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

    const newCandidate = addCandidate({
      categoryId,
      name,
      bio,
      manifesto,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80'
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

    const updated = updateCandidate(params.id, body);
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

    if (election.id !== params.id) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Election not found.' } },
        { status: 404 }
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

    const { status } = body;
    if (status !== 'OPEN' && status !== 'CLOSED') {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Status must be either OPEN or CLOSED.' } },
        { status: 400 }
      );
    }

    setElectionStatus(status);

    return HttpResponse.json({
      success: true,
      data: election
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

    if (election.id !== params.id) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Election not found.' } },
        { status: 404 }
      );
    }

    // Aggregate tally results
    // Return candidates grouped by category, with total votes and percentage
    const categoryTallies = categories.map(cat => {
      const catCandidates = candidates.filter(c => c.categoryId === cat.id);
      const totalCatVotes = catCandidates.reduce((sum, c) => sum + (c.votesCount || 0), 0);

      const items = catCandidates.map(c => ({
        candidateId: c.id,
        candidateName: c.name,
        imageUrl: c.imageUrl,
        votes: c.votesCount || 0,
        percentage: totalCatVotes > 0 ? Math.round(((c.votesCount || 0) / totalCatVotes) * 100) : 0
      }));

      // Sort candidates by votes descending
      items.sort((a, b) => b.votes - a.votes);

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        totalVotes: totalCatVotes,
        candidates: items
      };
    });

    return HttpResponse.json({
      success: true,
      data: {
        electionId: election.id,
        electionTitle: election.title,
        status: election.status,
        totalVotesCast: votes.length,
        tallies: categoryTallies
      }
    });
  }),

  // Helper endpoint for E2E testing to reset the state
  http.post('/api/debug/reset', () => {
    resetDb();
    return HttpResponse.json({ success: true, message: 'Database reset successfully' });
  })
];
