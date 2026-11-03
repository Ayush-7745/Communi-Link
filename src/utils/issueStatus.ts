export const ISSUE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export type IssueStatus = (typeof ISSUE_STATUS)[keyof typeof ISSUE_STATUS];

export const ISSUE_STATUS_PRESENTATION: Record<IssueStatus, { label: string; tab: IssueStatus }> = {
  [ISSUE_STATUS.PENDING]: { label: 'Pending', tab: ISSUE_STATUS.PENDING },
  [ISSUE_STATUS.APPROVED]: { label: 'Accepted', tab: ISSUE_STATUS.APPROVED },
  [ISSUE_STATUS.ASSIGNED]: { label: 'In Progress', tab: ISSUE_STATUS.ASSIGNED },
  [ISSUE_STATUS.COMPLETED]: { label: 'Pending Verification', tab: ISSUE_STATUS.COMPLETED },
  [ISSUE_STATUS.VERIFIED]: { label: 'Resolved', tab: ISSUE_STATUS.VERIFIED },
  [ISSUE_STATUS.REJECTED]: { label: 'Rejected', tab: ISSUE_STATUS.REJECTED },
};

export function getIssueStatusPresentation(status: string) {
  return ISSUE_STATUS_PRESENTATION[status as IssueStatus] || { label: status, tab: status };
}
