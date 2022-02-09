import postcss from 'postcss'
import plugin from '../src/index'



async function run (input: string, output: string, opts = { }) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}



it('test 1', async () => {
  await run(
    `
    .a { position: absolute; display: block; color: red; background: pink; }
    .b { position: absolute; display: block; }
    .c { position: absolute; display: inline; color: red; background: pink; opacity: 0.5; }
    .d { position: absolute; display: block; opacity: 0.5; z-index: 2; text-align: center; }
    `,
    `
    .a, .b, .c, .d { position: absolute; }
    .a, .b, .d { display: block; }
    .a, .c { color: red; background: pink; }
    .c, .d { opacity: 0.5; }
    .c { display: inline; }
    .d { z-index: 2; text-align: center; }
    `,
  { });
});


