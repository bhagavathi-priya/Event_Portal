import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import { useElectionQuery } from '../../hooks/queries/useElectionQuery';
import { useCandidatesQuery } from '../../hooks/queries/useCandidatesQuery';
import { 
  useCreateCandidateMutation, 
  useUpdateCandidateMutation, 
  useDeleteCandidateMutation 
} from '../../hooks/mutations/useCandidateMutation';
import { 
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '../../hooks/mutations/useCategoryMutation';
import { CandidateForm } from '../../components/manager/CandidateForm';
import { AnimatedModal } from '../../components/motion/AnimatedModal';
import { PageTransition } from '../../components/motion/PageTransition';

export const CandidateManagement = ({ module = 'club' }) => {
  const queryClient = useQueryClient();
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  
  // Club Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null); 
  const [candidateToDelete, setCandidateToDelete] = useState(null);

  // Event Management State
  const [activeDetailCategoryId, setActiveDetailCategoryId] = useState(null); // When set, enters Detail View
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // Category object currently editing
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryStatus, setCategoryStatus] = useState('ACTIVE');

  // Question Config State
  const [isManageQuestionOpen, setIsManageQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // null or { id, label, options: [{id, name}] }
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState([{ id: null, name: '' }, { id: null, name: '' }]);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Queries
  const { data: electionRes, isLoading: electionLoading, isError: electionError } = useElectionQuery(module);
  const categories = electionRes?.data?.categories || [];

  React.useEffect(() => {
    if (module === 'club') {
      if (activeDetailCategoryId) {
        const clubPositions = categories.filter(c => c.parentId === activeDetailCategoryId);
        if (clubPositions.length > 0 && (!activeCategoryId || !clubPositions.some(p => p.id === activeCategoryId))) {
          setActiveCategoryId(clubPositions[0].id);
        }
      } else {
        setActiveCategoryId(null);
      }
    } else {
      if (categories.length > 0 && !activeCategoryId) {
        setActiveCategoryId(categories[0].id);
      }
    }
  }, [categories, activeCategoryId, activeDetailCategoryId, module]);

  const { data: candidatesRes, isLoading: candidatesLoading, isError: candidatesError } = useCandidatesQuery(activeCategoryId || '');

  // Fetch all candidates (options) to count and filter
  const { data: allCandsRes } = useQuery({
    queryKey: ['candidates', 'all'],
    queryFn: () => axiosClient.get('/api/candidates'),
    refetchInterval: 3000
  });
  const allCandidates = allCandsRes?.data || [];

  // Mutations
  const createMutation = useCreateCandidateMutation();
  const updateMutation = useUpdateCandidateMutation();
  const deleteMutation = useDeleteCandidateMutation();

  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();

  const isSubmittingClub = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  if (electionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-violet-650 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-455 text-sm font-semibold">Loading data...</p>
      </div>
    );
  }

  if (electionError || !electionRes?.success) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Failed to Load Workspace</h2>
        <p className="text-slate-500 dark:text-slate-455 mt-1">Check your connection and permissions.</p>
      </div>
    );
  }

  // ==========================================
  // EVENT DECISION PORTAL WORKSPACE (module === 'event')
  // ==========================================
  if (module === 'event') {
    const parentCategories = categories.filter(c => c.id.startsWith('ev-cat-'));
    const activeDetailCategory = parentCategories.find(c => c.id === activeDetailCategoryId);

    // Categories CRUD handlers
    const handleCategorySubmit = async (e) => {
      e.preventDefault();
      if (!categoryName.trim()) return;

      try {
        if (editingCategory) {
          await updateCategoryMutation.mutateAsync({
            id: editingCategory.id,
            categoryData: {
              name: categoryName.trim(),
              description: categoryDesc.trim(),
              status: categoryStatus
            }
          });
          setEditingCategory(null);
        } else {
          await createCategoryMutation.mutateAsync({
            name: categoryName.trim(),
            description: categoryDesc.trim(),
            status: categoryStatus,
            electionId: 'election-event'
          });
        }
        setCategoryName('');
        setCategoryDesc('');
        setCategoryStatus('ACTIVE');
        setIsCreateCategoryOpen(false);
      } catch (err) {
        console.error(err);
      }
    };

    const handleStartEditCategory = (cat) => {
      setEditingCategory(cat);
      setCategoryName(cat.name);
      setCategoryDesc(cat.description || '');
      setCategoryStatus(cat.status || 'ACTIVE');
      setIsCreateCategoryOpen(true);
    };

    const handleDeleteCategory = async (catId) => {
      if (window.confirm('Are you sure you want to delete this Event Category? All questions and cast votes under this category will be deleted permanently.')) {
        try {
          await deleteCategoryMutation.mutateAsync(catId);
          if (activeDetailCategoryId === catId) {
            setActiveDetailCategoryId(null);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    // Question Config Handlers
    const handleSaveQuestion = async (e) => {
      e.preventDefault();
      if (!questionText.trim()) return;
      const cleanOptions = options.filter(opt => opt.name.trim());
      if (cleanOptions.length < 2) return;

      setSavingQuestion(true);
      try {
        if (editingQuestion) {
          // Edit existing question
          await updateCategoryMutation.mutateAsync({
            id: editingQuestion.id,
            categoryData: {
              name: questionText.trim()
            }
          });

          const originalOpts = editingQuestion.options;
          
          // Options to delete
          const toDelete = originalOpts.filter(
            orig => !cleanOptions.some(curr => curr.id === orig.id)
          );
          await Promise.all(toDelete.map(opt => deleteMutation.mutateAsync(opt.id)));

          // Options to create/update
          await Promise.all(
            cleanOptions.map(async (curr) => {
              if (curr.id) {
                const original = originalOpts.find(orig => orig.id === curr.id);
                if (original && original.name !== curr.name) {
                  await updateMutation.mutateAsync({
                    id: curr.id,
                    candidateData: {
                      name: curr.name.trim()
                    }
                  });
                }
              } else {
                await createMutation.mutateAsync({
                  categoryId: editingQuestion.id,
                  name: curr.name.trim(),
                  bio: 'Event decision option',
                  manifesto: 'Event decision option'
                });
              }
            })
          );
          setEditingQuestion(null);
        } else {
          // Create new question category
          const catResponse = await createCategoryMutation.mutateAsync({
            name: questionText.trim(),
            parentId: activeDetailCategoryId,
            electionId: 'election-event'
          });

          if (catResponse.success && catResponse.data) {
            const newCatId = catResponse.data.id;
            await Promise.all(
              cleanOptions.map(opt =>
                createMutation.mutateAsync({
                  categoryId: newCatId,
                  name: opt.name.trim(),
                  bio: 'Event decision option',
                  manifesto: 'Event decision option'
                })
              )
            );
          }
        }

        setQuestionText('');
        setOptions([{ id: null, name: '' }, { id: null, name: '' }]);
        setIsManageQuestionOpen(false);
      } catch (err) {
        console.error(err);
      } finally {
        setSavingQuestion(false);
      }
    };

    const handleStartEditQuestion = (q, qOptions) => {
      setEditingQuestion({
        id: q.id,
        label: q.name,
        options: qOptions.map(o => ({ id: o.id, name: o.name }))
      });
      setQuestionText(q.name);
      setOptions(qOptions.map(o => ({ id: o.id, name: o.name })));
      setIsManageQuestionOpen(true);
    };

    const handleDeleteQuestion = async (qId) => {
      if (window.confirm('Are you sure you want to delete this question and all its options?')) {
        try {
          await deleteCategoryMutation.mutateAsync(qId);
        } catch (err) {
          console.error(err);
        }
      }
    };

    const moveQuestion = async (qId, direction) => {
      const relatedQuestions = categories.filter(c => c.parentId === activeDetailCategoryId);
      const index = relatedQuestions.findIndex(q => q.id === qId);
      if (index === -1) return;
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= relatedQuestions.length) return;

      const fullCategories = [...categories];
      const realIdxA = fullCategories.findIndex(c => c.id === qId);
      const realIdxB = fullCategories.findIndex(c => c.id === relatedQuestions[targetIdx].id);
      
      if (realIdxA !== -1 && realIdxB !== -1) {
        const temp = fullCategories[realIdxA];
        fullCategories[realIdxA] = fullCategories[realIdxB];
        fullCategories[realIdxB] = temp;
        
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('voting_categories', JSON.stringify(fullCategories));
        }
        queryClient.invalidateQueries({ queryKey: ['election'] });
      }
    };

    return (
      <PageTransition>
        <div className="space-y-6">
          
          {/* VIEW A: EVENT CATEGORIES GRID LIST */}
          {!activeDetailCategoryId ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Manage Event Categories
                  </h1>
                  <p className="text-slate-505 dark:text-slate-455 text-sm mt-0.5">
                    Define high-level categories to display on the Student Event Decision Portal.
                  </p>
                </div>

                <button
                  id="btn-add-event-category"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName('');
                    setCategoryDesc('');
                    setCategoryStatus('ACTIVE');
                    setIsCreateCategoryOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4.5 bg-violet-650 hover:bg-violet-755 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Event Category
                </button>
              </div>

              {parentCategories.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-sm p-8 flex flex-col items-center max-w-lg mx-auto mt-8">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-3xl mb-4 border border-indigo-100 dark:border-indigo-900">
                    📅
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    Create a Category to Begin
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm">
                    Before students can vote, you must create a category card (e.g. College Symposium) to hold your decision questions.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryName('');
                      setCategoryDesc('');
                      setCategoryStatus('ACTIVE');
                      setIsCreateCategoryOpen(true);
                    }}
                    className="mt-6 py-2.5 px-5 bg-violet-650 hover:bg-violet-755 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                  >
                    Create a Category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {parentCategories.map((cat) => {
                    const qCount = categories.filter(c => c.parentId === cat.id).length;
                    const isActive = cat.status === 'ACTIVE';

                    return (
                      <div 
                        key={cat.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                                {cat.name}
                              </h3>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-normal">
                                {cat.description || 'No description provided.'}
                              </p>
                            </div>
                            
                            <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                              isActive 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
                            }`}>
                              {cat.status || 'ACTIVE'}
                            </span>
                          </div>

                          <div className="bg-indigo-50/30 dark:bg-indigo-950/20 rounded-2xl p-3.5 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs text-indigo-650 dark:text-indigo-300 shadow-sm">
                            <span className="font-semibold uppercase tracking-wider text-[10px]">Questions</span>
                            <span className="font-extrabold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-2.5 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800">
                              {qCount} {qCount === 1 ? 'Question' : 'Questions'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-105 dark:border-slate-800 flex items-center justify-between gap-3">
                          <button
                            onClick={() => setActiveDetailCategoryId(cat.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-650 hover:bg-violet-755 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-900/10 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.97] hover:-translate-y-0.5 duration-200 transition-all outline-none"
                          >
                            <span>Manage / Open</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditCategory(cat)}
                              title="Edit Category Card"
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all outline-none"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              title="Delete Category Card"
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-all outline-none"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            
            /* VIEW B: CATEGORY DETAILS PAGE (Questions CRUD) */
            <div className="space-y-6">
              
              {/* Back Navigation Bar */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setActiveDetailCategoryId(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none"
                >
                  ← Back to Categories
                </button>
                
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  Category Workspace
                </span>
              </div>

              {/* Category Details Header Card */}
              <div className="relative bg-slate-900 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-lg border border-slate-800">
                <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/6 w-64 h-64 rounded-full bg-violet-650/15 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      <h1 className="text-xl sm:text-2xl font-black">
                        {activeDetailCategory?.name}
                      </h1>
                    </div>
                    <p className="text-slate-400 text-xs max-w-xl">
                      {activeDetailCategory?.description || 'No description provided.'}
                    </p>
                  </div>

                  <button
                    id="btn-add-question-option"
                    onClick={() => {
                      setEditingQuestion(null);
                      setQuestionText('');
                      setOptions([{ id: null, name: '' }, { id: null, name: '' }]);
                      setIsManageQuestionOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4.5 bg-violet-650 hover:bg-violet-755 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-900/10 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.97] hover:-translate-y-0.5 duration-200 transition-all outline-none shrink-0"
                  >
                    Add Question and Option
                  </button>
                </div>
              </div>

              {/* List of Configured Questions inside this category */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Questions List ({categories.filter(c => c.parentId === activeDetailCategoryId).length})
                </h2>

                {categories.filter(c => c.parentId === activeDetailCategoryId).length === 0 ? (
                  <div className="text-center py-16 bg-white border border-slate-205 rounded-2xl dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                    <span className="text-slate-350 text-4xl">📝</span>
                    <p className="text-xs text-slate-500 mt-2">No questions added yet. Click "Add Question and Option" above to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories
                      .filter(c => c.parentId === activeDetailCategoryId)
                      .map((q, qIndex, arr) => {
                        const qOptions = allCandidates.filter(c => c.categoryId === q.id);

                        return (
                          <div 
                            key={q.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                                  Q{qIndex + 1}
                                </span>
                                <h3 className="text-sm font-bold text-slate-855 dark:text-slate-100">
                                  {q.name}
                                </h3>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pl-8">
                                {qOptions.map(opt => (
                                  <span 
                                    key={opt.id}
                                    className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-semibold rounded-md dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                  >
                                    {opt.name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Actions & Reordering */}
                            <div className="flex items-center gap-3 self-end md:self-center shrink-0 pl-8 md:pl-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                              
                              {/* Reordering Controls */}
                              <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3 mr-1">
                                <button
                                  disabled={qIndex === 0}
                                  onClick={() => moveQuestion(q.id, -1)}
                                  className={`p-1.5 rounded transition-colors ${
                                    qIndex === 0 
                                      ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                  title="Move Question Up"
                                >
                                  ▲
                                </button>
                                <button
                                  disabled={qIndex === arr.length - 1}
                                  onClick={() => moveQuestion(q.id, 1)}
                                  className={`p-1.5 rounded transition-colors ${
                                    qIndex === arr.length - 1 
                                      ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                  title="Move Question Down"
                                >
                                  ▼
                                </button>
                              </div>

                              <button
                                onClick={() => handleStartEditQuestion(q, qOptions)}
                                className="text-[10px] font-bold py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-755 rounded-xl dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 active:scale-[0.98] transition-colors"
                              >
                                Edit Question
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-[10px] font-bold py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 active:scale-[0.98] transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Modal: Create / Edit Category Card */}
          <AnimatedModal
            isOpen={isCreateCategoryOpen}
            onClose={() => setIsCreateCategoryOpen(false)}
            title={editingCategory ? "Edit Category Details" : "Add Event Category"}
          >
            <form onSubmit={handleCategorySubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. College Symposium – Student Preferences"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Optional Description</label>
                <textarea
                  placeholder="Summarize the categories' targets or voting guidelines..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 h-20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Status / Active State</label>
                <select
                  value={categoryStatus}
                  onChange={(e) => setCategoryStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="ACTIVE">ACTIVE (Visible to Students)</option>
                  <option value="INACTIVE">INACTIVE (Hidden from Students)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors border border-transparent hover:border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-violet-650 hover:bg-violet-750 text-white rounded-xl text-sm font-semibold shadow-lg transition-colors"
                >
                  {editingCategory ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </AnimatedModal>

          {/* Modal: Add / Edit Question & Option */}
          <AnimatedModal
            isOpen={isManageQuestionOpen}
            onClose={() => !savingQuestion && setIsManageQuestionOpen(false)}
            title={editingQuestion ? "Edit Question & Options" : "Add Question and Option"}
          >
            <form onSubmit={handleSaveQuestion} className="space-y-4 text-slate-800 dark:text-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Question Text</label>
                <input
                  type="text"
                  required
                  placeholder="Which theme do you prefer for the college symposium?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  disabled={savingQuestion}
                  className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-700 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Answer Options</label>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {options.map((opt, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder={`Option ${index + 1}`}
                        value={opt.name}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[index] = { ...newOpts[index], name: e.target.value };
                          setOptions(newOpts);
                        }}
                        disabled={savingQuestion}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-750 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = options.filter((_, i) => i !== index);
                            setOptions(newOpts);
                          }}
                          disabled={savingQuestion}
                          className="p-1 text-rose-505 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-md transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOptions([...options, { id: null, name: '' }])}
                  disabled={savingQuestion}
                  className="text-[10px] text-indigo-600 hover:text-indigo-750 font-bold flex items-center gap-1 mt-1 outline-none"
                >
                  + Add Option
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-105 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManageQuestionOpen(false)}
                  disabled={savingQuestion}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion || !questionText.trim() || options.filter(opt => opt.name.trim()).length < 2}
                  className="flex-1 py-2 bg-violet-650 hover:bg-violet-750 text-white rounded-xl text-sm font-semibold shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {savingQuestion ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Question"
                  )}
                </button>
              </div>
            </form>
          </AnimatedModal>

        </div>
      </PageTransition>
    );
  }

  // ==========================================
  // DYNAMIC CLUB PORTAL WORKSPACE (module === 'club')
  // ==========================================
  const parentClubs = categories.filter(c => c.id.startsWith('club-cat-'));
  const activeClub = parentClubs.find(c => c.id === activeDetailCategoryId);
  const clubPositions = activeClub ? categories.filter(c => c.parentId === activeClub.id) : [];

  const candidatesList = candidatesRes?.data || [];

  // Club CRUD handlers
  const handleClubSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          categoryData: {
            name: categoryName.trim(),
            description: categoryDesc.trim(),
            status: categoryStatus
          }
        });
        setEditingCategory(null);
      } else {
        await createCategoryMutation.mutateAsync({
          name: categoryName.trim(),
          description: categoryDesc.trim(),
          status: categoryStatus,
          electionId: 'election-1'
        });
      }
      setCategoryName('');
      setCategoryDesc('');
      setCategoryStatus('ACTIVE');
      setIsCreateCategoryOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditClub = (club) => {
    setEditingCategory(club);
    setCategoryName(club.name);
    setCategoryDesc(club.description || '');
    setCategoryStatus(club.status || 'ACTIVE');
    setIsCreateCategoryOpen(true);
  };

  const handleDeleteClub = async (clubId) => {
    if (window.confirm('Are you sure you want to delete this Club? All contested positions, registered candidates, and cast votes will be deleted permanently.')) {
      try {
        await deleteCategoryMutation.mutateAsync(clubId);
        if (activeDetailCategoryId === clubId) {
          setActiveDetailCategoryId(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenAddForm = () => {
    setSelectedCandidate(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (candidate) => {
    setSelectedCandidate(candidate);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedCandidate) {
        // Edit flow
        const response = await updateMutation.mutateAsync({
          id: selectedCandidate.id,
          candidateData: formData
        });
        if (response.success) {
          setIsFormOpen(false);
        }
      } else {
        // Add flow
        const response = await createMutation.mutateAsync(formData);
        if (response.success) {
          setIsFormOpen(false);
          setActiveCategoryId(formData.categoryId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!candidateToDelete) return;
    try {
      const response = await deleteMutation.mutateAsync(candidateToDelete.id);
      if (response.success) {
        setCandidateToDelete(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. CLUBS GRID CARDS VIEW
  if (!activeDetailCategoryId) {
    return (
      <PageTransition>
        <div className="space-y-6">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Present Active Clubs
              </h1>
              <p className="text-slate-505 dark:text-slate-455 text-sm mt-0.5">
                Create and manage college clubs and their contested positions.
              </p>
            </div>

            <button
              id="btn-add-club"
              onClick={() => {
                setEditingCategory(null);
                setCategoryName('');
                setCategoryDesc('');
                setCategoryStatus('ACTIVE');
                setIsCreateCategoryOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-violet-650 hover:bg-violet-755 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/25 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create a Club
            </button>
          </div>

          {/* Clubs Grid Card display */}
          {parentClubs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-205 rounded-3xl dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <span className="text-slate-450 text-5xl">🏛️</span>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mt-3">
                No Clubs Configured
              </h3>
              <p className="text-xs text-slate-505 mt-1 max-w-sm mx-auto">
                No active clubs have been registered yet. Click Create a Club above to establish a new club.
              </p>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryName('');
                  setCategoryDesc('');
                  setCategoryStatus('ACTIVE');
                  setIsCreateCategoryOpen(true);
                }}
                className="mt-6 py-2.5 px-5 bg-violet-650 hover:bg-violet-755 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
              >
                Create a Club
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parentClubs.map((club) => {
                const positions = categories.filter(c => c.parentId === club.id);
                const posIds = positions.map(p => p.id);
                const candCount = allCandidates.filter(c => posIds.includes(c.categoryId)).length;
                const isActive = club.status === 'ACTIVE';

                return (
                  <div 
                    key={club.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                            {club.name}
                          </h3>
                          <p className="text-xs text-slate-505 line-clamp-2 mt-1 leading-normal">
                            {club.description || 'No description provided.'}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border shrink-0 ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-955/20 dark:text-emerald-455 dark:border-emerald-900' 
                            : 'bg-rose-50 text-rose-700 border-rose-150 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900'
                        }`}>
                          {club.status}
                        </span>
                      </div>

                      {/* Info badges */}
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-850 px-2.5 py-1 rounded-xl border border-slate-105">
                          <span>Positions:</span>
                          <span className="font-bold text-slate-850 dark:text-white">
                            {positions.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-800 px-2.5 py-1 rounded-xl border border-slate-105">
                          <span>Candidates:</span>
                          <span className="font-bold text-slate-850 dark:text-white">
                            {candCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-105 dark:border-slate-850 flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          setActiveDetailCategoryId(club.id);
                          if (positions.length > 0) {
                            setActiveCategoryId(positions[0].id);
                          }
                        }}
                        className="py-2 px-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/10 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.97] hover:-translate-y-0.5 duration-200 outline-none"
                      >
                        Manage Candidates
                      </button>

                      {/* Card editing utilities */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditClub(club)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all outline-none"
                          title="Edit Club Details"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClub(club.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-all outline-none"
                          title="Delete Club"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Club Form Modal */}
          <AnimatedModal
            isOpen={isCreateCategoryOpen}
            onClose={() => setIsCreateCategoryOpen(false)}
            title={editingCategory ? "Edit Club Details" : "Create New Club"}
          >
            <form onSubmit={handleClubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2">Club Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Coding Club"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-205 focus:border-indigo-500 rounded-xl text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  placeholder="Brief description of the club..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-205 focus:border-indigo-500 rounded-xl text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 outline-none h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <select 
                  value={categoryStatus}
                  onChange={(e) => setCategoryStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-205 focus:border-indigo-500 rounded-xl text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Visible on Dashboard)</option>
                  <option value="INACTIVE">INACTIVE (Hidden)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryOpen(false)}
                  disabled={isSubmittingClub}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-xl font-bold shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClub}
                  className={`flex-1 py-2.5 bg-violet-650 hover:bg-violet-755 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2 outline-none ${
                    isSubmittingClub ? 'animate-pulse cursor-not-allowed opacity-80' : ''
                  }`}
                >
                  {isSubmittingClub ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingCategory ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingCategory ? "Update Club" : "Create Club"
                  )}
                </button>
              </div>
            </form>
          </AnimatedModal>
        </div>
      </PageTransition>
    );
  }

  // 2. CLUB POSITIONS DETAIL WORKSPACE VIEW
  return (
    <PageTransition>
      <div className="space-y-6">
        
        {/* Back navigation control */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setActiveDetailCategoryId(null);
              setActiveCategoryId(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none"
          >
            ← Back to Clubs List
          </button>
        </div>

        {/* Club Details Header Banner */}
        <div className="relative bg-gradient-to-r from-violet-900 to-indigo-905 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-lg border border-violet-850">
          <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/6 w-64 h-64 rounded-full bg-violet-500/10 blur-2xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-300 bg-violet-955/65 border border-violet-850 px-2.5 py-0.5 rounded-full">
                  Club Workspace
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeClub?.status === 'ACTIVE' 
                    ? 'bg-emerald-950/60 border border-emerald-900 text-emerald-400' 
                    : 'bg-rose-955/60 border border-rose-900 text-rose-400'
                }`}>
                  {activeClub?.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {activeClub?.name}
              </h1>
              <p className="text-slate-305 text-sm max-w-xl leading-relaxed">
                {activeClub?.description || "Configure positions and candidates contesting for leadership roles under this club."}
              </p>
            </div>
          </div>
        </div>

        {/* Header section with Candidate add button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Manage Candidates
            </h2>
            <p className="text-slate-505 dark:text-slate-455 text-sm mt-0.5">
              Add candidates separately for each contested position.
            </p>
          </div>

          <button
            id="btn-add-candidate"
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-violet-650 hover:bg-violet-755 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/25 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Candidate
          </button>
        </div>

        {/* Categories Tab selector (Positions) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
          {clubPositions.map((pos) => (
            <button
              key={pos.id}
              onClick={() => setActiveCategoryId(pos.id)}
              className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors outline-none focus-visible:text-indigo-650 ${
                activeCategoryId === pos.id
                  ? 'border-indigo-600 text-indigo-655 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-455 dark:hover:text-white'
              }`}
            >
              {pos.name}
            </button>
          ))}
        </div>

        {/* Candidates View List */}
        {candidatesLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-violet-650 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-slate-455">Fetching candidates...</span>
          </div>
        ) : candidatesError ? (
          <div className="text-center py-12">
            <span className="text-rose-500 text-4xl">⚠️</span>
            <p className="text-slate-550 text-sm mt-2">Failed to load candidates for this position.</p>
          </div>
        ) : candidatesList.length > 0 ? (
          <div className="bg-white border border-slate-205 dark:bg-slate-900 dark:border-slate-805 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-105 text-xs font-bold text-slate-500 dark:bg-slate-900/60 dark:border-slate-800 uppercase tracking-wider select-none">
                    <th className="py-3.5 px-6">Candidate</th>
                    <th className="py-3.5 px-6 hidden md:table-cell">Biography</th>
                    <th className="py-3.5 px-6 hidden sm:table-cell">Current Votes</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-105 text-sm dark:divide-slate-800">
                  {candidatesList.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img
                          src={cand.imageUrl}
                          alt={cand.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-750"
                          onError={(e) => {
                            const isFemale = (cand.gender === 'female' || cand.imageUrl?.includes('/female/'));
                            const gender = isFemale ? 'women' : 'men';
                            const match = (cand.imageUrl || '').match(/\/(\d+)\.jpg$/);
                            const index = match ? match[1] : Math.floor(Math.random() * 50) + 1;
                            e.target.src = `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
                            e.target.onerror = null;
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">{cand.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400 font-mono">ID: {cand.id}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 hidden md:table-cell max-w-sm">
                        <p className="text-slate-550 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">
                          {cand.bio}
                        </p>
                      </td>

                      <td className="py-4 px-6 hidden sm:table-cell">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                          {cand.votesCount || 0}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenEditForm(cand)}
                            className="btn-edit-candidate p-1.5 text-slate-505 hover:text-indigo-650 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                            title="Edit Candidate Details"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setCandidateToDelete(cand)}
                            className="btn-delete-candidate p-1.5 text-slate-550 hover:text-rose-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                            title="Delete Candidate"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-205 rounded-2xl dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            <span className="text-slate-400 text-5xl">👤</span>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mt-3">
              No Candidates Registered
            </h3>
            <p className="text-xs text-slate-550 mt-1">
              No candidates have been registered for this position yet. Click Add New Candidate above to begin.
            </p>
          </div>
        )}

        {/* Add/Edit Candidate Form Modal */}
        <AnimatedModal
          isOpen={isFormOpen}
          onClose={() => !(createMutation.isPending || updateMutation.isPending) && setIsFormOpen(false)}
          title={selectedCandidate ? 'Edit Candidate Details' : 'Add New Candidate'}
        >
          <CandidateForm
            key={selectedCandidate?.id || 'new'}
            categories={categories}
            initialValues={selectedCandidate}
            defaultCategoryId={activeCategoryId}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            module={module}
          />
        </AnimatedModal>

        {/* Delete Confirmation Modal */}
        <AnimatedModal
          isOpen={!!candidateToDelete}
          onClose={() => !deleteMutation.isPending && setCandidateToDelete(null)}
          title="Confirm Candidate Deletion"
        >
          <div className="space-y-4 text-sm text-slate-650 dark:text-slate-350">
            <p>
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{candidateToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900 p-3 rounded-xl leading-normal">
              WARNING: This action is permanent. All recorded stats for this candidate entry will be wiped immediately.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-805 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl font-semibold shadow-lg shadow-rose-900/20 transition-all flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete Candidate'
                )}
              </button>
            </div>
          </div>
        </AnimatedModal>
      </div>
    </PageTransition>
  );
};

export default CandidateManagement;
