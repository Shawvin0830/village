export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '话题详情' })
  : { navigationBarTitleText: '话题详情' }
