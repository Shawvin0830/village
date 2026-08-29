export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '采访稿' })
  : { navigationBarTitleText: '采访稿' }
