import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 7);


export const generateParcelId = () => `P-IDX${nanoid()}`;