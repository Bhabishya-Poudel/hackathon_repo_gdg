import type { Grant } from './grantTypes';
import { grantsPart1 } from './grants.part1';
import { grantsPart2 } from './grants.part2';

/**
 * SAMPLE DATA. Every funder and program here is fictional and exists only
 * to demonstrate the matching UI.
 */
export const grants: Grant[] = [...grantsPart1, ...grantsPart2];
