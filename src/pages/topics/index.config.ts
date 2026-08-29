export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '话题管理' })
  : { navigationBarTitleText: '话题管理' }
