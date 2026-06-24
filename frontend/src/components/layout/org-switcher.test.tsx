/**
 * Tests for the OrgSwitcher.
 *
 *  - 1 membership → static label, no dropdown.
 *  - 2+ memberships → dropdown that calls setActiveOrgId on click.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrgSwitcher } from './OrgSwitcher';

const setActiveMock = vi.fn();
let mockState: {
  activeOrgId: string | null;
  availableOrgs: Array<{ org_id: string; legal_name?: string }>;
} = { activeOrgId: 'org_alpha', availableOrgs: [] };

vi.mock('@/lib/workspaces/useActiveOrg', () => ({
  useActiveOrg: () => ({
    activeOrgId: mockState.activeOrgId,
    availableOrgs: mockState.availableOrgs,
    setActiveOrgId: setActiveMock,
  }),
}));

beforeEach(() => {
  setActiveMock.mockClear();
});

describe('<OrgSwitcher>', () => {
  it('returns null when there are no memberships', () => {
    mockState = { activeOrgId: null, availableOrgs: [] };
    const { container } = render(<OrgSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a static label when there is only one org', () => {
    mockState = {
      activeOrgId: 'org_alpha',
      availableOrgs: [{ org_id: 'org_alpha', legal_name: 'Alpha S.L.' }],
    };
    render(<OrgSwitcher />);
    expect(screen.getByTestId('org-switcher-static')).toHaveTextContent('Alpha S.L.');
    expect(screen.queryByTestId('org-switcher-button')).toBeNull();
  });

  it('opens dropdown and switches org on click', () => {
    mockState = {
      activeOrgId: 'org_alpha',
      availableOrgs: [
        { org_id: 'org_alpha', legal_name: 'Alpha S.L.' },
        { org_id: 'org_beta', legal_name: 'Beta S.L.' },
      ],
    };
    render(<OrgSwitcher />);
    fireEvent.click(screen.getByTestId('org-switcher-button'));
    expect(screen.getByTestId('org-switcher-menu')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('org-switcher-item-org_beta'));
    expect(setActiveMock).toHaveBeenCalledWith('org_beta');
  });
});
