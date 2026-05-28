import { getCleanUrl } from '@mswjs/interceptors';
const url = new URL('http://localhost:4000/v1/children');
console.log('getCleanUrl result:', getCleanUrl(url));
