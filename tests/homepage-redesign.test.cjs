const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const readHomepageSource = () =>
  fs.readFileSync(path.join(process.cwd(), 'app/page.tsx'), 'utf8')

const readFooterSource = () =>
  fs.readFileSync(path.join(process.cwd(), 'components/footer.tsx'), 'utf8')

test('homepage includes the new consulting-focused parent journey', () => {
  const source = readHomepageSource()

  assert.match(source, /先安心，再幫孩子找到適合的老師/)
  assert.match(source, /#process/)
  assert.match(source, /id="process"/)
  assert.match(source, /想開始接家教案件？查看流程與申請條件/)
  assert.match(source, /還沒準備找老師？先用 AI 解題看看/)
})

test('desktop hero cards use a matched-height layout', () => {
  const source = readHomepageSource()

  assert.match(source, /lg:items-stretch/)
  assert.match(source, /lg:h-full/)
  assert.match(source, /lg:grid-rows-\[auto_1fr\]/)
})

test('footer follows the new consulting-led homepage style', () => {
  const source = readFooterSource()

  assert.match(source, /專人把關‧優質師資‧安心配對/)
  assert.match(source, /bg-\[#f7f3e8\]/)
  assert.match(source, /家長需求登錄/)
  assert.match(source, /教師申請入口/)
  assert.doesNotMatch(source, /把首頁那套安心感，收在最後一屏。/)
  assert.doesNotMatch(source, /footer 不再只是導覽列/)
})
