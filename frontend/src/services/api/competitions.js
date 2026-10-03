import { getPublic } from './client';

export const getCompetitions = (options) => getPublic('competitions', options);
