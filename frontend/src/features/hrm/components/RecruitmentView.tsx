'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  UserPlus,
  CalendarClock,
  MapPin,
  Users,
  Video,
  X,
} from 'lucide-react';
import {
  CandidateStage,
  Interview,
  InterviewStatus,
  JobPosting,
  JobPostingStatus,
  useGetJobPostingsQuery,
  useGetCandidatesQuery,
  useGetInterviewsQuery,
  useUpdateCandidateStageMutation,
  useDeleteCandidateMutation,
  useUpdateInterviewMutation,
  useUpdateJobPostingMutation,
} from '../api/hrmApi';
import { JobPostingFormModal } from './JobPostingFormModal';
import { CandidateFormModal } from './CandidateFormModal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

type Section = 'postings' | 'candidates' | 'interviews';

const STAGE_BADGE: Record<CandidateStage, string> = {
  APPLIED: 'bg-slate-100 text-slate-700 border-slate-200',
  SCREENING: 'bg-sky-50 text-sky-700 border-sky-200',
  INTERVIEW: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  OFFER: 'bg-amber-50 text-amber-700 border-amber-200',
  HIRED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};
const STAGES: CandidateStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

const JOB_STATUS_BADGE: Record<JobPostingStatus, string> = {
  OPEN: 'bg-emerald-100 text-emerald-800',
  ON_HOLD: 'bg-amber-100 text-amber-800',
  CLOSED: 'bg-slate-200 text-slate-700',
};
const JOB_STATUSES: JobPostingStatus[] = ['OPEN', 'ON_HOLD', 'CLOSED'];

const INTERVIEW_STATUS_BADGE: Record<InterviewStatus, string> = {
  SCHEDULED: 'bg-sky-100 text-sky-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
};

export function RecruitmentView() {
  const [section, setSection] = useState<Section>('postings');

  const { data: jobPostings = [], isLoading: loadingPostings } = useGetJobPostingsQuery();
  const { data: candidates = [], isLoading: loadingCandidates } = useGetCandidatesQuery();
  const { data: interviews = [], isLoading: loadingInterviews } = useGetInterviewsQuery();

  const [updateCandidateStage] = useUpdateCandidateStageMutation();
  const [deleteCandidate] = useDeleteCandidateMutation();
  const [updateInterview] = useUpdateInterviewMutation();
  const [updateJobPosting] = useUpdateJobPostingMutation();

  const [jobPostingForm, setJobPostingForm] = useState<{ open: boolean; jobPosting: JobPosting | null }>({ open: false, jobPosting: null });
  const [candidateFormOpen, setCandidateFormOpen] = useState(false);
  const [interviewFormOpen, setInterviewFormOpen] = useState(false);

  const handleStageChange = async (candidateId: string, stage: CandidateStage) => {
    try {
      await updateCandidateStage({ id: candidateId, stage }).unwrap();
      toast.success('Candidate stage updated.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update stage.');
    }
  };

  const handleDeleteCandidate = async (candidateId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the pipeline?`)) return;
    try {
      await deleteCandidate(candidateId).unwrap();
      toast.success('Candidate removed.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove candidate.');
    }
  };

  const handleCancelInterview = async (interview: Interview) => {
    try {
      await updateInterview({ id: interview.id, status: 'CANCELLED' }).unwrap();
      toast.success('Interview cancelled.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel interview.');
    }
  };

  const handleCompleteInterview = async (interview: Interview) => {
    try {
      await updateInterview({ id: interview.id, status: 'COMPLETED' }).unwrap();
      toast.success('Interview marked completed.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update interview.');
    }
  };

  const handleInterviewStatusChange = (interview: Interview, next: InterviewStatus) => {
    if (next === interview.status) return;
    if (next === 'COMPLETED') handleCompleteInterview(interview);
    else if (next === 'CANCELLED') handleCancelInterview(interview);
  };

  const handleJobStatusChange = async (jobPosting: JobPosting, next: JobPostingStatus) => {
    if (next === jobPosting.status) return;
    try {
      await updateJobPosting({ id: jobPosting.id, status: next }).unwrap();
      toast.success('Job posting status updated.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update job posting status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recruitment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Job postings, candidate pipeline, and interview scheduling</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {section === 'postings' && (
            <button
              onClick={() => setJobPostingForm({ open: true, jobPosting: null })}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Briefcase className="w-4 h-4" />
              New Job Posting
            </button>
          )}
          {section === 'candidates' && (
            <button
              onClick={() => setCandidateFormOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <UserPlus className="w-4 h-4" />
              Add Candidate
            </button>
          )}
          {section === 'interviews' && (
            <button
              onClick={() => setInterviewFormOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <CalendarClock className="w-4 h-4" />
              Schedule Interview
            </button>
          )}
        </div>
      </div>

      {/* Section switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        {([
          { id: 'postings', label: `Job Postings (${jobPostings.length})` },
          { id: 'candidates', label: `Candidates (${candidates.length})` },
          { id: 'interviews', label: `Interviews (${interviews.length})` },
        ] as { id: Section; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              section === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Job Postings */}
      {section === 'postings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loadingPostings ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />)
          ) : jobPostings.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No job postings yet.</p>
            </div>
          ) : (
            jobPostings.map((jp) => (
              <div
                key={jp.id}
                role="button"
                tabIndex={0}
                onClick={() => setJobPostingForm({ open: true, jobPosting: jp })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setJobPostingForm({ open: true, jobPosting: jp });
                }}
                className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition p-5 flex flex-col gap-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 leading-tight">{jp.title}</h3>
                  <select
                    value={jp.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleJobStatusChange(jp, e.target.value as JobPostingStatus)}
                    className={`appearance-none cursor-pointer shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${JOB_STATUS_BADGE[jp.status]}`}
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {jp.department?.name && <span>{jp.department.name}</span>}
                  {jp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {jp.location}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  {candidates.filter((c) => c.jobPostingId === jp.id).length} candidate(s) · {jp.openings} opening(s)
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Candidates */}
      {section === 'candidates' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Job Posting</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loadingCandidates ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <UserPlus className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No candidates yet.</p>
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{c.fullName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{c.email || c.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{c.jobPosting?.title || '—'}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{c.source || '—'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={c.stage}
                          onChange={(e) => handleStageChange(c.id, e.target.value as CandidateStage)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border focus:outline-none ${STAGE_BADGE[c.stage]}`}
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0) + s.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteCandidate(c.id, c.fullName)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove candidate"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interviews */}
      {section === 'interviews' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4">Interviewer(s)</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loadingInterviews ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : interviews.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      <CalendarClock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No interviews scheduled.</p>
                    </td>
                  </tr>
                ) : (
                  interviews.map((interview) => (
                    <tr key={interview.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{interview.candidate?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{interview.candidate?.jobPosting?.title}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMinutes}m
                        {interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Video className="w-3.5 h-3.5" /> Join
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{interview.interviewerNames || '—'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={interview.status}
                          disabled={interview.status !== 'SCHEDULED'}
                          onChange={(e) => handleInterviewStatusChange(interview, e.target.value as InterviewStatus)}
                          className={`appearance-none cursor-pointer px-2.5 py-0.5 rounded-full text-[11px] font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-80 ${INTERVIEW_STATUS_BADGE[interview.status]}`}
                        >
                          {interview.status === 'SCHEDULED' ? (
                            <>
                              <option value="SCHEDULED">Scheduled</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </>
                          ) : (
                            <option value={interview.status}>{interview.status}</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <JobPostingFormModal
        isOpen={jobPostingForm.open}
        jobPosting={jobPostingForm.jobPosting}
        onClose={() => setJobPostingForm({ open: false, jobPosting: null })}
      />
      <CandidateFormModal isOpen={candidateFormOpen} onClose={() => setCandidateFormOpen(false)} />
      <ScheduleInterviewModal isOpen={interviewFormOpen} onClose={() => setInterviewFormOpen(false)} />
    </div>
  );
}
