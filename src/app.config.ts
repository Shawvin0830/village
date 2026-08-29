export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/topics/index',
    'pages/profile/index',
    'pages/topic-detail/index',
    'pages/interview-plan/index',
    'pages/interview-record/index',
    'pages/authorization/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FAFAF5',
    navigationBarTitleText: '村庄记忆',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FAFAF5',
  },
  tabBar: {
    color: '#78716C',
    selectedColor: '#B45309',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/home.png',
        selectedIconPath: './assets/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/topics/index',
        text: '话题',
        iconPath: './assets/tabbar/folder-kanban.png',
        selectedIconPath: './assets/tabbar/folder-kanban-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
})
