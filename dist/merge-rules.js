"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectorMerger = void 0;
// import vendors              from 'vendors';
// @ts-ignore
const cssnano_util_same_parent_1 = __importDefault(require("cssnano-util-same-parent"));
const ensureCompatibility_1 = __importDefault(require("./ensureCompatibility"));
const vendors = [
    "ah",
    "apple",
    "atsc",
    "epub",
    "hp",
    "khtml",
    "moz",
    "ms",
    "o",
    "rim",
    "ro",
    "tc",
    "wap",
    "webkit",
    "xv"
];
const prefixes = vendors.map(vendor => `-${vendor}-`);
function isMsInputPlaceholder(selector) {
    return (/-ms-input-placeholder/i).test(selector);
}
function filterPrefixes(selector) {
    return intersect(prefixes, selector);
}
function sameVendor(selectorsA, selectorsB) {
    const same = (selectors) => selectors.map(filterPrefixes).join();
    const findMsVendor = (selectors) => selectors.find(isMsInputPlaceholder);
    return (same(selectorsA) === same(selectorsB)
        &&
            !(findMsVendor(selectorsA) && findMsVendor(selectorsB)));
}
function noVendor(selector) {
    return !filterPrefixes(selector).length;
}
function canMerge(ruleA, ruleB, browsers, compatibilityCache) {
    const selectorsA = ruleA.selectors;
    const selectorsB = ruleB.selectors;
    const selectorsAB = selectorsA.concat(selectorsB);
    if (!(0, ensureCompatibility_1.default)(selectorsAB, browsers, compatibilityCache))
        return false;
    const parent = (0, cssnano_util_same_parent_1.default)(ruleA, ruleB);
    // @ts-ignore
    const { name } = ruleA.parent;
    if (parent && name && name.includes('keyframes'))
        return false;
    return parent && (selectorsAB.every(noVendor) || sameVendor(selectorsA, selectorsB));
}
function intersect(selectorsA, selectorB, not = false) {
    return selectorsA.filter(selectorA => {
        const result = selectorB.includes(selectorA);
        return not ? !result : result;
    });
}
function propEquals(a, b, withValue = true) {
    return (a.prop === b.prop) && (!withValue || (a.value === b.value));
}
function selectorMerger(browsers, compatibilityCache) {
    // const debug = (msg) => {
    //     // console.log(msg);
    // }
    const caches = []; // contains the collection of the intersected rule cache and the origin rule (the first merged rule)
    return function (currentRule) {
        // debug(`> ${currentRule.selector.replace(/\r?\n/, '')}`);
        // debug(`caches: ${caches.length} ${caches.map(c => c.selector.replace(/\r?\n/, '')).join(" | ")}`);
        // debug(`rule: ${currentRule.selector} : ${ currentRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);
        // if (!caches.length) {
        //     // if no cache yet, register currentRule as an initial cache
        //     caches.push(currentRule);
        //     return;
        // }
        for (let cIndex = 0; cIndex < caches.length; cIndex++) {
            const cacheRule = caches[cIndex];
            // debug(`  cacheRule(${cIndex}/${caches.length - 1}): ${cacheRule.selector} : ${ cacheRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);
            // ensure that it is safe to merge both declarations before continuing
            if (!canMerge(currentRule, cacheRule, browsers, compatibilityCache)) {
                // debug('    unmergeable, skipped');
                continue; // unmergeable => skip
            }
            // Ensure that we don't deduplicate the same rule; this is sometimes
            // caused by a partial merge
            if (cacheRule === currentRule) {
                // debug('    already cached, skipped');
                continue; // merged (with self) => skip
            }
            // Merge when current selector(s) are the same in cached selector(s)
            // e.g. :
            //
            // a,b { display: block; }
            // b,a { opacity: 0.5 }
            // can merged be:
            // a,b { display: block; opacity: 0.5 }
            //
            // a,b { display: block; }
            // b   { opacity: 0.5 }
            // cannot merge, a not { opacity: 0.5 }
            //
            // a,b   { display: block; }
            // b,a,c { opacity: 0.5 }
            // cannot merge, c not { display: block; }
            const isFullyIntersect = (currentRule.selectors.length == cacheRule.selectors.length)
                &&
                    currentRule.selectors.every(s => cacheRule.selectors.includes(s));
            if (isFullyIntersect) {
                // debug(`    merge union: ${currentRule.selectors.join(', ')} : ${ currentRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);
                // copy all props into cacheRule
                Array.from(currentRule.nodes).forEach(n1 => {
                    const found = cacheRule.nodes.find(n2 => propEquals(n1, n2, false));
                    if (found) {
                        if ((!found.important) || n1.important) {
                            found.replaceWith(n1);
                        }
                    }
                    else {
                        cacheRule.append(n1);
                    }
                });
                currentRule.remove();
                return; // currentRule has been deleted => case closed => stop performing next caching
            }
            // Partial merge: check if the rule contains a subset of the last; if
            // so create a joined selector with the subset, if smaller.
            const intersectedNodes = cacheRule.nodes.filter(n1 => {
                const found = currentRule.nodes.find(n2 => propEquals(n1, n2));
                if (found) {
                    // n1.remove();    // no not modify collectin while filtering => causing iteration stopped
                    found.remove(); // remove prop from currentRule
                }
                return !!found;
            });
            Array.from(intersectedNodes).forEach(n1 => n1.remove()); // remove prop from cacheRule
            if (intersectedNodes.length) { // if cacheRule & currentRule has intersection
                // create a new intersected rule instance
                const intersectedRule = cacheRule.cloneBefore();
                intersectedRule.selectors = [...cacheRule.selectors, ...currentRule.selectors];
                // intersectedRule.nodes = intersectedNodes;
                intersectedRule.removeAll();
                intersectedRule.append(intersectedNodes);
                // debug(`    add mergedRule ${intersectedRule.selector} : ${ intersectedRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);
                caches.push(intersectedRule); // register intersectedRule as a new cache
            }
            // remove blank rules (if any)
            if (!cacheRule.nodes.length) {
                cacheRule.remove();
                caches.splice(cIndex, 1); // remove deleted cacheRule
                cIndex--; // walk backward 1 step, because current cache was removed/deleted, thus next cache's index become current index
                // debug(`    del cacheRule ${cacheRule.selector}`);
            }
            else {
                // debug(`    lft cacheRule ${cacheRule.selector} : ${ cacheRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);
            }
            if (!currentRule.nodes.length) {
                currentRule.remove();
                //  not needed for deletion, currentRule was not registered
                // debug(`    del rule ${currentRule.selector}`);
                return; // currentRule has been deleted => case closed => stop performing next caching
            }
            else {
                // debug(`    lft currentRule ${currentRule.selector} : ${ currentRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);
                // caches.push(currentRule);
            }
        } // for cacheRule....caches
        // now currentRule become a new cache
        caches.push(currentRule);
    }; // function (currentRule)
}
exports.selectorMerger = selectorMerger;
