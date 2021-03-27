import browserslist          from 'browserslist';
import postcss               from 'postcss';
// import vendors              from 'vendors';
// @ts-ignore
import cssnanoUtilSameParent from 'cssnano-util-same-parent';
import ensureCompatibility   from './ensureCompatibility';



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
function isMsInputPlaceholder(selector: string): boolean {
    return (/-ms-input-placeholder/i).test(selector);
}
function filterPrefixes(selector: string): string[] {
    return intersect(prefixes, selector);
}
function sameVendor(selectorsA: string[], selectorsB: string[]): boolean {
    const same         = (selectors: string[]) => selectors.map(filterPrefixes).join();
    const findMsVendor = (selectors: string[]) => selectors.find(isMsInputPlaceholder);

    return (
        same(selectorsA) === same(selectorsB)
        &&
        !(findMsVendor(selectorsA) && findMsVendor(selectorsB))
    );
}
function noVendor(selector: string): boolean {
    return !filterPrefixes(selector).length;
}

function canMerge(ruleA: postcss.Rule, ruleB: postcss.Rule, browsers: string[], compatibilityCache: any) {
    const selectorsA  = ruleA.selectors!;
    const selectorsB  = ruleB.selectors!;
    const selectorsAB = selectorsA.concat(selectorsB);

    
    if (!ensureCompatibility(selectorsAB, browsers, compatibilityCache)) return false;


    const parent = cssnanoUtilSameParent(ruleA, ruleB);
    // @ts-ignore
    const { name } = ruleA.parent;
    
    
    if (parent && name && name.includes('keyframes')) return false;

    return parent && (selectorsAB.every(noVendor) || sameVendor(selectorsA, selectorsB));
}


function intersect(selectorsA: string[], selectorB: string, not: boolean = false): string[] {
    return selectorsA.filter(selectorA => {
        const result = selectorB.includes(selectorA);
        return not ? !result : result;
    });
}



function propEquals(a: postcss.Declaration, b: postcss.Declaration, withValue = true) {
    return (a.prop === b.prop) && (!withValue || (a.value === b.value))
}
function selectorMerger(browsers: string[], compatibilityCache: any) {
    // const debug = (msg) => {
    //     // console.log(msg);
    // }

    const caches: postcss.Rule[] = []; // contains the collection of the intersected rule cache and the origin rule (the first merged rule)
    return function (currentRule: postcss.Rule) {
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
            const isFullyIntersect =
                (currentRule.selectors!.length == cacheRule.selectors!.length)
                &&
                currentRule.selectors!.every(s => cacheRule.selectors!.includes(s));
            if (isFullyIntersect) {
                // debug(`    merge union: ${currentRule.selectors.join(', ')} : ${ currentRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);


                // copy all props into cacheRule
                Array.from(currentRule.nodes as postcss.Declaration[]).forEach(n1 => {
                    const found = (cacheRule.nodes as postcss.Declaration[]).find(n2 => propEquals(n1, n2, false));
                    if (found) {
                        if ((!found.important) || n1.important) {
                            found.replaceWith(n1);
                        }
                    } else {
                        cacheRule.append(n1);
                    }
                });


                currentRule.remove();
                return; // currentRule has been deleted => case closed => stop performing next caching
            }


            // Partial merge: check if the rule contains a subset of the last; if
            // so create a joined selector with the subset, if smaller.
            const intersectedNodes = (cacheRule.nodes as postcss.Declaration[]).filter(n1 => {
                const found = (currentRule.nodes as postcss.Declaration[]).find(n2 => propEquals(n1, n2));
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
                intersectedRule.selectors = [...cacheRule.selectors!, ...currentRule.selectors!];
                // intersectedRule.nodes = intersectedNodes;
                intersectedRule.removeAll();
                intersectedRule.append(intersectedNodes);

                // debug(`    add mergedRule ${intersectedRule.selector} : ${ intersectedRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);

                caches.push(intersectedRule); // register intersectedRule as a new cache
            }


            // remove blank rules (if any)
            if (!cacheRule.nodes!.length) {
                cacheRule.remove();

                caches.splice(cIndex, 1); // remove deleted cacheRule
                cIndex--; // walk backward 1 step, because current cache was removed/deleted, thus next cache's index become current index

                // debug(`    del cacheRule ${cacheRule.selector}`);
            } else {
                // debug(`    lft cacheRule ${cacheRule.selector} : ${ cacheRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);
            }

            if (!currentRule.nodes!.length) {
                currentRule.remove();
                //  not needed for deletion, currentRule was not registered

                // debug(`    del rule ${currentRule.selector}`);

                return; // currentRule has been deleted => case closed => stop performing next caching
            } else {
                // debug(`    lft currentRule ${currentRule.selector} : ${ currentRule.nodes.map(node => `${node.prop}=${node.value}`).join("; ") }`);

                // caches.push(currentRule);
            }
        } // for cacheRule....caches


        // now currentRule become a new cache
        caches.push(currentRule);
    } // function (currentRule)
}

export default postcss.plugin('postcss-merge-rule-plus', () =>
    (css: postcss.Root) => {

        const result: any = {};

        const resultOpts = result.opts || {};
        const browsers = browserslist(null, {
            stats : resultOpts.stats,
            path  : __dirname,
            env   : resultOpts.env
        });
        const compatibilityCache: any = {};
  
        
        // Callback for each rule node.
        css.walkRules(selectorMerger(browsers, compatibilityCache));
    }
);