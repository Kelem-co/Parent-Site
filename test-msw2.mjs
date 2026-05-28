import pkg from 'path-to-regexp';
const { match } = pkg;

// Test: does '/v1/children' match 'http://localhost:4000/v1/children'?
const result1 = match('/v1/children', { decode: decodeURIComponent })('http://localhost:4000/v1/children');
console.log('relative path vs full URL:', result1);

// Test: does '/v1/children' match '/v1/children'?
const result2 = match('/v1/children', { decode: decodeURIComponent })('/v1/children');
console.log('relative path vs relative URL:', result2);

// Test: does 'http://localhost:4000/v1/children' match 'http://localhost:4000/v1/children'?
const result3 = match('http\\://localhost\\:4000/v1/children', { decode: decodeURIComponent })('http://localhost:4000/v1/children');
console.log('full URL vs full URL:', result3);
