export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '资料库' })
  : { navigationBarTitleText: '资料库' }
