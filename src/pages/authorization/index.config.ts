export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '授权管理' })
  : { navigationBarTitleText: '授权管理' }
