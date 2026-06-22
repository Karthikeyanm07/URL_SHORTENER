import {AlertCircle} from 'lucide-react';

interface ErrorMessageProps {
	message: string;
}

export default function ErrorMessage({message}: ErrorMessageProps) {
	return (
		<div
			role="alert"
			className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
		>
			<AlertCircle className="h-4 w-4 mt-0.5 shrink-0"/>
			<p>{message}</p>
		</div>
	);
}