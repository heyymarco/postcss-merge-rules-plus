# postcss-merge-rules-plus

[PostCSS] plugin for combining css rules (selectors) that have fully/partially identical declarations.

[PostCSS]: https://github.com/postcss/postcss

## Features
* Combines selectors with fully identical rules.
* Combines selectors with partially identical rules.
* Combines selectors with the same selector declaration.

## Example

### Input
```css
.a { position: absolute; display: block; color: red; background: pink; }
.b { position: absolute; display: block; }
.c { position: absolute; display: inline; color: red; background: pink; opacity: 0.5; }
.d { position: absolute; display: block; opacity: 0.5; z-index: 2; text-align: center; }
```

### Output
```css
.a, .b, .c, .d { position: absolute; }
.a, .b, .d { display: block; }
.a, .c { color: red; background: pink; }
.c, .d { opacity: 0.5; }
.c { display: inline; }
.d { z-index: 2; text-align: center; }
```

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-merge-rules-plus
```

**Step 2:** Check you project for existed PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according to [official docs]
and set this plugin in settings.

**Step 3:** Add the plugin to plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-merge-rules-plus'),
    require('autoprefixer')
  ]
}
```

[official docs]: https://github.com/postcss/postcss#usage

## Usage

```es6
import { src, dest } from 'gulp';
import gutil         from 'gulp-util';
import postcss       from 'gulp-postcss';
import mergeRulePlus from 'postcss-merge-rules-plus';



src('test3.css')
.pipe(
    postcss(/*plugins:*/[
        mergeRulePlus()
    ])
)
.on('error', gutil.log)
.pipe(dest('test/'))
;
```

## Please Support Us
A lot of coffee has been spent for making this plugins.
Please buy me a cup of coffee to support me continue to develop & improve this application.
Visit: [ko-fi.com](https://ko-fi.com/heymarco)

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
