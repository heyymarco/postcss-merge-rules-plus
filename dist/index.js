"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const browserslist_1 = __importDefault(require("browserslist"));
const merge_rules_1 = require("./merge-rules");
const plugin = () => {
    const result = {};
    const resultOpts = result.opts || {};
    const browsers = (0, browserslist_1.default)(null, {
        stats: resultOpts.stats,
        path: __dirname,
        env: resultOpts.env
    });
    const compatibilityCache = {};
    return {
        postcssPlugin: 'postcss-merge-rules-plus',
        Root(root /*, postcss: Helpers*/) {
            // Transform CSS AST here
            // Callback for each rule node.
            root.walkRules((0, merge_rules_1.selectorMerger)(browsers, compatibilityCache));
        }
        /*
        Declaration (decl, postcss) {
          // The faster way to find Declaration node
        }
        */
        /*
        Declaration: {
          color: (decl, postcss) {
            // The fastest way find Declaration node if you know property name
          }
        }
        */
    };
};
plugin.postcss = true;
exports.default = plugin;
