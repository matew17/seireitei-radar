import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('AGENTS.md bounded-context conventions', () => {
  const instructions = readFileSync(
    resolve(__dirname, '../../AGENTS.md'),
    'utf8',
  );

  it('documents the responsibility folders and context-root module', () => {
    expect(instructions).toMatch(/src\/<context>\//);
    expect(instructions).toMatch(/controllers\//);
    expect(instructions).toMatch(/services\//);
    expect(instructions).toMatch(/repositories\//);
    expect(instructions).toMatch(/dto\//);
    expect(instructions).toMatch(/module\.ts.*context root/);
  });

  it('documents that tests are co-located with the code they verify', () => {
    expect(instructions).toMatch(/\*\*\/\*\.spec\.ts.*co-locate/);
  });

  it('documents src/common for shared code', () => {
    expect(instructions).toMatch(/src\/common\//);
    expect(instructions).toMatch(/shared code/);
  });
});
