import type {
  Plugin,
  PluginCreator,
  Root,
  // Helpers,
}                            from 'postcss';
import browserslist          from 'browserslist';
import { selectorMerger }    from './merge-rules';



export interface PluginOptions {
  // no option yet
}
const plugin : PluginCreator<PluginOptions> = () => {
  const result: any = {};

  const resultOpts = result.opts || {};
  const browsers = browserslist(null, {
      stats : resultOpts.stats,
      path  : __dirname,
      env   : resultOpts.env
  });
  const compatibilityCache: any = {};

  
  
  return {
    postcssPlugin: 'postcss-merge-rules-plus',
    
    Root (root: Root/*, postcss: Helpers*/) {
      // Transform CSS AST here

      // Callback for each rule node.
      root.walkRules(selectorMerger(browsers, compatibilityCache));
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
  } as Plugin;
}

plugin.postcss = true
export default plugin;
