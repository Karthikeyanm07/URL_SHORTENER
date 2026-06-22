import {useState} from 'react';
import {Check, Copy} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';
import {toast} from 'sonner';

interface CopyButtonProps {
	text: string;
	className?: string;
}

export default function CopyButton({text, className}: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		toast.success('Link copied to clipboard');
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleCopy}
					className={`h-8 w-8 transition-all hover:bg-secondary ${className ?? ''}`}
					aria-label={copied ? 'Copied' : 'Copy to clipboard'}
				>
					{copied ? (
						<Check className="h-3.5 w-3.5 text-green-600"/>
					) : (
						<Copy className="h-3.5 w-3.5 text-muted-foreground"/>
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{copied ? 'Copied!' : 'Copy link'}</p>
			</TooltipContent>
		</Tooltip>
	);
}