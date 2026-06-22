import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {vi} from 'vitest';
import CopyButton from '@/components/shared/CopyButton';

// Mock Radix Tooltip entirely — we're testing CopyButton logic, not Radix
vi.mock('@/components/ui/tooltip', () => ({
	Tooltip: ({children}: { children: React.ReactNode }) => <>{children}</>,
	TooltipTrigger: ({children, asChild}: { children: React.ReactNode; asChild?: boolean }) =>
		asChild ? <>{children}</> : <span>{children}</span>,
	TooltipContent: () => null, // Don't render tooltip content in tests
	TooltipProvider: ({children}: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe('CopyButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset clipboard mock before each test
		vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
	});

	it('renders with correct aria-label', () => {
		render(<CopyButton text="https://example.com"/>);
		expect(
			screen.getByRole('button', {name: 'Copy to clipboard'})
		).toBeInTheDocument();
	});

	it('calls clipboard.writeText with the correct text on click', async () => {
		render(<CopyButton text="http://localhost:5000/abc1234"/>);
		await userEvent.click(screen.getByRole('button'));
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			'http://localhost:5000/abc1234'
		);
	});

	it('shows success toast after copying', async () => {
		const {toast} = await import('sonner');
		render(<CopyButton text="https://example.com"/>);
		await userEvent.click(screen.getByRole('button'));
		expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard');
	});

	it('changes aria-label to Copied after click', async () => {
		render(<CopyButton text="https://example.com"/>);
		await userEvent.click(screen.getByRole('button'));
		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Copied'})).toBeInTheDocument();
		});
	});

	it('resets aria-label back to Copy to clipboard after 2 seconds', async () => {
		vi.useFakeTimers({shouldAdvanceTime: true});

		render(<CopyButton text="https://example.com"/>);
		const button = screen.getByRole('button', {name: 'Copy to clipboard'});

		// Click using real async handling before fake timers take over
		await act(async () => {
			await userEvent.click(button);
		});

		// Confirm it switched to Copied
		expect(screen.getByRole('button', {name: 'Copied'})).toBeInTheDocument();

		// Advance time past the 2-second reset
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});

		await waitFor(() => {
			expect(
				screen.getByRole('button', {name: 'Copy to clipboard'})
			).toBeInTheDocument();
		});

		vi.useRealTimers();
	});
});