// SHA-256 hash for IP addresses.
import {createHash} from 'crypto';

export const hashIp = (ip: string): string => {
	return createHash('sha256').update(ip).digest('hex');
};