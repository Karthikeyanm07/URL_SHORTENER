import {render, screen} from '@testing-library/react';
import ErrorMessage from '@/components/shared/ErrorMessage';

describe('ErrorMessage', () => {
	it('renders the error message text', () => {
		render(<ErrorMessage message="Something went wrong"/>);
		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
	});

	it('has role="alert" for screen readers', () => {
		render(<ErrorMessage message="Error occurred"/>);
		expect(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('renders different messages correctly', () => {
		const {rerender} = render(<ErrorMessage message="First error"/>);
		expect(screen.getByText('First error')).toBeInTheDocument();

		rerender(<ErrorMessage message="Second error"/>);
		expect(screen.getByText('Second error')).toBeInTheDocument();
		expect(screen.queryByText('First error')).not.toBeInTheDocument();
	});
});