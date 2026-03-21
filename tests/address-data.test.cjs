const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const datasetPath = path.join(process.cwd(), 'lib/data/taiwan-addresses.json')

test('taiwan address dataset exists and covers counties, districts, and roads', () => {
  assert.ok(fs.existsSync(datasetPath), 'expected local address dataset to exist')

  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))

  assert.ok(Array.isArray(dataset.cities), 'dataset.cities should be an array')
  assert.ok(dataset.cities.length >= 22, 'dataset should cover Taiwan counties and major municipalities')

  const taipei = dataset.cities.find((city) => city.name === '臺北市' || city.name === '台北市')
  assert.ok(taipei, 'dataset should include Taipei')
  assert.ok(Array.isArray(taipei.districts) && taipei.districts.length > 0, 'Taipei should include districts')

  const zhongzheng = taipei.districts.find((district) => district.name.includes('中正'))
  assert.ok(zhongzheng, 'Taipei should include Zhongzheng district')
  assert.ok(Array.isArray(zhongzheng.roads) && zhongzheng.roads.length > 0, 'district should include roads')
})
