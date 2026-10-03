import { getPublic } from './client';

export const getWorkshops = (options) => getPublic('workshops', options);
