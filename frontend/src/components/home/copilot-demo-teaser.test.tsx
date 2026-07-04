/**
 * Tests para <CopilotDemoTeaser />. Verifica que al pulsar cada chip se
 * añade el mensaje de usuario + la respuesta guionizada del Copilot con
 * sus tarjetas.
 */
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopilotDemoTeaser } from './CopilotDemoTeaser';
import { DEMO_INTRO_USER, DEMO_SCRIPT } from './copilot-demo-script';

describe('<CopilotDemoTeaser>', () => {
  it('shows the intro turn on first render', () => {
    render(<CopilotDemoTeaser />);
    expect(screen.getByText(DEMO_INTRO_USER)).toBeInTheDocument();
    expect(screen.getByTestId('copilot-demo-thread')).toBeInTheDocument();
    DEMO_SCRIPT.forEach((t) => {
      expect(screen.getByTestId(`copilot-demo-chip-${t.chip_id}`)).toBeInTheDocument();
    });
  });

  it('on click of a chip renders its user message + scripted response', async () => {
    const user = userEvent.setup();
    render(<CopilotDemoTeaser />);
    const turn = DEMO_SCRIPT[0]!;
    await user.click(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`));
    const userMsgs = screen.getAllByTestId('copilot-demo-user-message');
    expect(userMsgs.some((n) => n.textContent === turn.user_message)).toBe(true);
    await waitFor(
      () => {
        const allCopilotMsgs = screen.getAllByTestId('copilot-demo-copilot-message');
        const last = allCopilotMsgs[allCopilotMsgs.length - 1]!;
        expect(last.textContent).toContain('filtrado');
      },
      { timeout: 2000 }
    );
    const last = screen.getAllByTestId('copilot-demo-cards').slice(-1)[0]!;
    expect(last.textContent).toContain('Kitchen Studio');
  });

  it('disables a chip after it is used', async () => {
    const user = userEvent.setup();
    render(<CopilotDemoTeaser />);
    const turn = DEMO_SCRIPT[1]!;
    await user.click(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`));
    await waitFor(() => {
      expect(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`)).toBeDisabled();
    });
  });

  it('reset clears chip used state and brings back intro', async () => {
    const user = userEvent.setup();
    render(<CopilotDemoTeaser />);
    const turn = DEMO_SCRIPT[0]!;
    await user.click(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`));
    await waitFor(() => {
      expect(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`)).toBeDisabled();
    });
    await user.click(screen.getByTestId('copilot-demo-reset'));
    expect(screen.getByTestId(`copilot-demo-chip-${turn.chip_id}`)).not.toBeDisabled();
    const userMsgs = screen
      .queryAllByTestId('copilot-demo-user-message')
      .map((n) => n.textContent);
    expect(userMsgs).toContain(DEMO_INTRO_USER);
    expect(userMsgs).not.toContain(turn.user_message);
  });
});
