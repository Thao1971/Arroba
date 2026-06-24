/**
 * Tests for <CopilotDemoMock />. Verifies that clicking each suggestion chip
 * pushes the user message + the scripted Copilot response with its cards.
 */
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopilotDemoMock } from './CopilotDemoMock';
import { DEMO_INTRO_USER, DEMO_SCRIPT } from './copilot-demo-script';

describe('<CopilotDemoMock>', () => {
  it('shows the intro turn on first render', () => {
    render(<CopilotDemoMock />);
    expect(screen.getByText(DEMO_INTRO_USER)).toBeInTheDocument();
    expect(screen.getByTestId('copilot-demo-thread')).toBeInTheDocument();
    // 4 chips render
    DEMO_SCRIPT.forEach((t) => {
      expect(screen.getByTestId(`copilot-demo-chip-${t.chip_id}`)).toBeInTheDocument();
    });
  });

  it('on click of a chip renders its user message + scripted response', async () => {
    const user = userEvent.setup();
    render(<CopilotDemoMock />);
    const turn = DEMO_SCRIPT[0]!;
    await user.click(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`));
    // The same text appears on the chip too; check at least one user message has it.
    const userMsgs = screen.getAllByTestId('copilot-demo-user-message');
    expect(userMsgs.some((n) => n.textContent === turn.user_message)).toBe(true);
    await waitFor(
      () => {
        // The bold-rendered response contains the verb "He filtrado"
        const allCopilotMsgs = screen.getAllByTestId('copilot-demo-copilot-message');
        const last = allCopilotMsgs[allCopilotMsgs.length - 1]!;
        expect(last.textContent).toContain('filtrado');
      },
      { timeout: 2000 }
    );
    // Cards rendered
    const last = screen.getAllByTestId('copilot-demo-cards').slice(-1)[0]!;
    expect(last.textContent).toContain('Kitchen Studio');
  });

  it('disables a chip after it is used', async () => {
    const user = userEvent.setup();
    render(<CopilotDemoMock />);
    const turn = DEMO_SCRIPT[1]!;
    await user.click(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`));
    await waitFor(() => {
      expect(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`)).toBeDisabled();
    });
  });

  it('reset clears chip used state and brings back intro', async () => {
    const user = userEvent.setup();
    render(<CopilotDemoMock />);
    const turn = DEMO_SCRIPT[0]!;
    await user.click(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`));
    await waitFor(() => {
      expect(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`)).toBeDisabled();
    });
    await user.click(screen.getByTestId('copilot-demo-reset'));
    expect(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`)).not.toBeDisabled();
    // The script's first user_message is GONE from the DOM
    const userMsgs = screen.queryAllByTestId('copilot-demo-user-message').map((n) => n.textContent);
    expect(userMsgs).toContain(DEMO_INTRO_USER); // intro still there
    expect(userMsgs).not.toContain(turn.user_message);
  });
});
