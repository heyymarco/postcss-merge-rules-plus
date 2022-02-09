import type { Rule } from 'postcss';
export declare function selectorMerger(browsers: string[], compatibilityCache: any): (currentRule: Rule) => void;
