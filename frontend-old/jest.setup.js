// jest.setup.js

// Other test setup code
import '@testing-library/jest-dom';

// Fix for "TextEncoder is not defined"
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
