# postcss-merge-rules-plus

PostCSS plugin to combine css rules (selectors) that have (fully or partially) identical declarations.

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

## Installation

```sh
npm i postcss-merge-rules-plus --save-dev
```

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