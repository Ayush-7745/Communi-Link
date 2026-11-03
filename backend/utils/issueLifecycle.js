export const ISSUE_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
});

export const ISSUE_TRANSITIONS = Object.freeze({
  approve: { from: ISSUE_STATUS.PENDING, to: ISSUE_STATUS.APPROVED, role: 'ngo' },
  assign: { from: ISSUE_STATUS.APPROVED, to: ISSUE_STATUS.ASSIGNED, role: 'ngo' },
  reassign: { from: ISSUE_STATUS.ASSIGNED, to: ISSUE_STATUS.ASSIGNED, role: 'ngo' },
  accept: { from: ISSUE_STATUS.APPROVED, to: ISSUE_STATUS.ASSIGNED, role: 'volunteer' },
  complete: { from: ISSUE_STATUS.ASSIGNED, to: ISSUE_STATUS.COMPLETED, role: 'volunteer' },
  verify: { from: ISSUE_STATUS.COMPLETED, to: ISSUE_STATUS.VERIFIED, role: 'ngo' },
  reject: [
    { from: ISSUE_STATUS.PENDING, to: ISSUE_STATUS.REJECTED, role: 'ngo' },
    { from: ISSUE_STATUS.COMPLETED, to: ISSUE_STATUS.ASSIGNED, role: 'ngo' },
  ],
});

export function getIssueTransition(action, status, role) {
  const transitions = Array.isArray(ISSUE_TRANSITIONS[action])
    ? ISSUE_TRANSITIONS[action]
    : [ISSUE_TRANSITIONS[action]];
  return transitions.find((transition) => transition.from === status && transition.role === role);
}

export function withApiId(value) {
  if (!value || typeof value !== 'object') return value;
  const result = { ...value };
  if (result._id != null) result.id = String(result._id);
  return result;
}
