export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '话题进度' })
  : { navigationBarTitleText: '话题进度' }
