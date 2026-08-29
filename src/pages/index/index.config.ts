export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '进度看板' })
  : { navigationBarTitleText: '进度看板' }
