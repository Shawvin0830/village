import{j as i,V as l,f as O,w as b,g as pe,E as me,x as fe,y as he,b as g,d as U,_ as x,z as ve,H as ge,A as L,l as be,S as xe,B as we,D as ye,e as Ee,F as _e,X as Ce,G as je,J as Te,K as Fe,M as f,N as c,O as Be,P as Q,Q as Z,r as A,U as Se,W as ke,Y as Pe,Z as Ne,$ as Ae,a0 as De,a1 as ee,a2 as v}from"./vendors.fdd8aad6.js";import{g as Oe,a as He,c as H,P as Re,B,C as Le,b as Ie,d as D,e as ze,f as Ve,t as $,T as Me}from"./common.d0673a21.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const t of s)if(t.type==="childList")for(const a of t.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function r(s){const t={};return s.integrity&&(t.integrity=s.integrity),s.referrerPolicy&&(t.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?t.credentials="include":s.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(s){if(s.ep)return;s.ep=!0;const t=r(s);fetch(s.href,t)}})();function We(){var o=Oe();if(!o)return null;var e=function(){b.switchTab({url:"/pages/profile/index"})};return i.jsxs(l,{onClick:e,className:"fixed top-12 right-4 z-50 flex items-center gap-1 bg-white rounded-full px-3 py-1 shadow-sm border border-gray-100",children:[i.jsx(l,{className:"w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center",children:i.jsx(O,{className:"text-white text-xs font-bold",children:o.displayName.charAt(0)})}),i.jsxs(O,{className:"text-xs text-gray-600",children:[o.displayName,"·",He(o.role)]})]})}var Ue=`
/* H5 端隐藏 TabBar 空图标（只隐藏没有 src 的图标） */
.weui-tabbar__icon:not([src]),
.weui-tabbar__icon[src=''] {
  display: none !important;
}

.weui-tabbar__item:has(.weui-tabbar__icon:not([src])) .weui-tabbar__label,
.weui-tabbar__item:has(.weui-tabbar__icon[src='']) .weui-tabbar__label {
  margin-top: 0 !important;
}

/* Vite 错误覆盖层无法选择文本的问题 */
vite-error-overlay {
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-user-select: text !important;
}

vite-error-overlay::part(window) {
  max-width: 90vw;
  padding: 10px;
}

.taro_page {
  overflow: auto;
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* H5 导航栏页面自动添加顶部间距 */
body.h5-navbar-visible .taro_page {
  padding-top: 44px;
}

body.h5-navbar-visible .toaster[data-position^="top"] {
  top: 44px !important;
}

/* Sheet 组件在 H5 导航栏下的位置修正 */
body.h5-navbar-visible .sheet-content:not([data-side="bottom"]) {
    top: 44px !important;
}

/*
 * H5 端 rem 适配：与小程序 rpx 缩放一致
 * 375px 屏幕：1rem = 16px，小程序 32rpx = 16px
 */
html {
    font-size: 4vw !important;
}

/* H5 端组件默认样式修复 */
taro-view-core {
    display: block;
}

taro-text-core {
    display: inline;
}

taro-input-core {
    display: block;
    width: 100%;
}

taro-input-core input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
}

taro-input-core.taro-otp-hidden-input input {
    color: transparent;
    caret-color: transparent;
    -webkit-text-fill-color: transparent;
}

/* 全局按钮样式重置 */
taro-button-core,
button {
    margin: 0 !important;
    padding: 0 !important;
    line-height: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
}

taro-button-core::after,
button::after {
    border: none;
}

taro-textarea-core > textarea,
.taro-textarea,
textarea.taro-textarea {
    resize: none !important;
}
`,$e=`
/* PC 宽屏适配 - 基础布局 */
@media (min-width: 769px) {
  html {
    font-size: 15px !important;
  }

  body {
    background-color: #f3f4f6 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    min-height: 100vh !important;
  }
}
`,Ye=`
/* PC 宽屏适配 - 手机框样式（有 TabBar 页面） */
@media (min-width: 769px) {
  .taro-tabbar__container {
    width: 375px !important;
    max-width: 375px !important;
    height: calc(100vh - 40px) !important;
    max-height: 900px !important;
    background-color: #fff !important;
    transform: translateX(0) !important;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
    border-radius: 20px !important;
    overflow: hidden !important;
    position: relative !important;
  }

  .taro-tabbar__panel {
    height: 100% !important;
    overflow: auto !important;
  }
}

/* PC 宽屏适配 - Toast 定位到手机框范围内 */
@media (min-width: 769px) {
  body .toaster {
    left: 50% !important;
    right: auto !important;
    width: 375px !important;
    max-width: 375px !important;
    transform: translateX(-50%) !important;
    box-sizing: border-box !important;
  }
}

/* PC 宽屏适配 - 手机框样式（无 TabBar 页面，通过 JS 添加 no-tabbar 类） */
@media (min-width: 769px) {
  body.no-tabbar #app {
    width: 375px !important;
    max-width: 375px !important;
    height: calc(100vh - 40px) !important;
    max-height: 900px !important;
    background-color: #fff !important;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
    border-radius: 20px !important;
    overflow: hidden !important;
    position: relative !important;
    transform: translateX(0) !important;
  }

  body.no-tabbar #app .taro_router {
    height: 100% !important;
    overflow: auto !important;
  }
}
`;function Xe(){var o=document.createElement("style");o.innerHTML=Ue+$e+Ye,document.head.appendChild(o)}function Ge(){var o=function(){var n=!!document.querySelector(".taro-tabbar__container");document.body.classList.toggle("no-tabbar",!n)};o();var e=new MutationObserver(o);e.observe(document.body,{childList:!0,subtree:!0})}function Je(){Xe(),Ge()}function qe(){var o=pe();if(o===me.WEAPP)try{var e=fe(),r=e.miniProgram.envVersion;console.log("[Debug] envVersion:",r),r!=="release"&&he({enableDebug:!0})}catch(n){console.error("[Debug] 开启调试模式失败:",n)}}var Ke={visible:!1,title:"",bgColor:"#ffffff",textStyle:"black",navStyle:"default",transparent:"none",leftIcon:"none"},Qe=function(){var e,r=L();return(r==null||(e=r.config)===null||e===void 0?void 0:e.window)||{}},Ze=function(){var e,r,n=(e=L())===null||e===void 0||(e=e.config)===null||e===void 0?void 0:e.tabBar;return new Set((n==null||(r=n.list)===null||r===void 0?void 0:r.map(function(s){return s.pagePath}))||[])},Y=function(){var e,r=L();return(r==null||(e=r.config)===null||e===void 0||(e=e.pages)===null||e===void 0?void 0:e[0])||"pages/index/index"},k=function(e){return e.replace(/^\//,"")},er=function(e,r,n,s){if(!e)return"none";var t=k(e),a=k(s),h=t===a,u=r.has(t)||r.has("/".concat(t)),p=n>1;return u||h?"none":p?"back":"home"},rr=function(){var e=g.useState(Ke),r=U(e,2),n=r[0],s=r[1],t=g.useState(0),a=U(t,2),h=a[0],u=a[1],p=g.useCallback(function(){var d=b.getCurrentPages();if(d.length===0){s(function(de){return x(x({},de),{},{visible:!1})});return}var m=d[d.length-1],V=(m==null?void 0:m.route)||"";if(V){var w=(m==null?void 0:m.config)||{},y=Qe(),T=Ze(),le=Y(),F=k(V),M=k(le),ue=F===M,ce=T.has(F)||T.has("/".concat(F)),W=T.size<=1&&d.length<=1&&(ue||ce);s({visible:!W,title:document.title||w.navigationBarTitleText||y.navigationBarTitleText||"",bgColor:w.navigationBarBackgroundColor||y.navigationBarBackgroundColor||"#ffffff",textStyle:w.navigationBarTextStyle||y.navigationBarTextStyle||"black",navStyle:w.navigationStyle||y.navigationStyle||"default",transparent:w.transparentTitle||y.transparentTitle||"none",leftIcon:W?"none":er(F,T,d.length,M)})}},[]);b.useDidShow(function(){p()}),b.usePageScroll(function(d){var m=d.scrollTop;n.transparent==="auto"&&u(Math.min(m/100,1))}),g.useEffect(function(){var d=null,m=new MutationObserver(function(){d&&clearTimeout(d),d=setTimeout(function(){p()},50)});return m.observe(document.head,{subtree:!0,childList:!0,characterData:!0}),p(),function(){m.disconnect(),d&&clearTimeout(d)}},[p]);var N=n.visible&&n.navStyle!=="custom";if(g.useEffect(function(){N?document.body.classList.add("h5-navbar-visible"):document.body.classList.remove("h5-navbar-visible")},[N]),!N)return i.jsx(i.Fragment,{});var z=n.textStyle==="white"?"#fff":"#333",ae=n.textStyle==="white"?"text-white":"text-gray-800",ie=function(){return n.transparent==="always"?{backgroundColor:"transparent"}:n.transparent==="auto"?{backgroundColor:n.bgColor,opacity:h}:{backgroundColor:n.bgColor}},oe=function(){return b.navigateBack()},se=function(){var m=Y();b.reLaunch({url:"/".concat(m)})};return i.jsxs(i.Fragment,{children:[i.jsxs(l,{className:"fixed top-0 left-0 right-0 h-11 flex items-center justify-center z-1000",style:ie(),children:[n.leftIcon==="back"&&i.jsx(l,{className:"absolute left-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center",onClick:oe,children:i.jsx(ve,{size:24,color:z})}),n.leftIcon==="home"&&i.jsx(l,{className:"absolute left-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center",onClick:se,children:i.jsx(ge,{size:22,color:z})}),i.jsx(O,{className:"text-base font-medium max-w-3/5 truncate ".concat(ae),children:n.title})]}),i.jsx(l,{className:"h-11 shrink-0"})]})},nr=function(e){var r=e.children;return i.jsxs(i.Fragment,{children:[i.jsx(rr,{}),r]})},tr=["className","children","orientation"],re=g.forwardRef(function(o,e){var r=o.className,n=o.children,s=o.orientation,t=s===void 0?"vertical":s,a=be(o,tr),h=t==="horizontal"||t==="both",u=t==="vertical"||t==="both";return i.jsx(xe,x(x({ref:e,className:H("relative",r),scrollY:u,scrollX:h,style:{overflowX:h?"auto":"hidden",overflowY:u?"auto":"hidden"}},a),{},{children:n}))});re.displayName="ScrollArea";var ar={error:null,report:"",source:"",visible:!1,open:!1,timestamp:""},X="hsl(360, 100%, 45%)",G=!1,P=ar,R=new Set,ir=function(){R.forEach(function(e){return e()})},or=function(e){return R.add(e),function(){return R.delete(e)}},J=function(){return P},ne=function(e){P=e,ir()},sr=(function(){var o=f(c().m(function e(r){var n,s,t,a,h;return c().w(function(u){for(;;)switch(u.p=u.n){case 0:if(typeof window!="undefined"){u.n=1;break}return u.a(2,!1);case 1:if(u.p=1,!((n=navigator.clipboard)!==null&&n!==void 0&&n.writeText)){u.n=3;break}return u.n=2,navigator.clipboard.writeText(r);case 2:return u.a(2,!0);case 3:u.n=5;break;case 4:u.p=4,a=u.v,console.warn("[H5ErrorBoundary] Clipboard API copy failed:",a);case 5:return u.p=5,s=document.createElement("textarea"),s.value=r,s.setAttribute("readonly","true"),s.style.position="fixed",s.style.opacity="0",document.body.appendChild(s),s.select(),t=document.execCommand("copy"),document.body.removeChild(s),u.a(2,t);case 6:return u.p=6,h=u.v,console.warn("[H5ErrorBoundary] Fallback copy failed:",h),u.a(2,!1)}},e,null,[[5,6],[1,4]])}));return function(r){return o.apply(this,arguments)}})(),lr=function(e){if(e instanceof Error)return e;if(typeof e=="string")return new Error(e);try{return new Error(JSON.stringify(e))}catch(r){return new Error(String(e))}},ur=function(e){var r=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},n=["[H5 Runtime Error]","Time: ".concat(new Date().toISOString()),r.source?"Source: ".concat(r.source):"","Name: ".concat(e.name),"Message: ".concat(e.message),e.stack?`Stack:
`.concat(e.stack):"",r.componentStack?`Component Stack:
`.concat(r.componentStack):"",typeof navigator!="undefined"?"User Agent: ".concat(navigator.userAgent):""].filter(Boolean);return n.join(`

`)},q=function(e){P.visible&&ne(x(x({},P),{},{open:e}))},I=function(e){var r=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};if(typeof window!="undefined"){var n=lr(e),s=ur(n,r),t=new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});ne({error:n,report:s,source:r.source||"runtime",timestamp:t,visible:!0,open:!1}),console.error("[H5ErrorOverlay] Showing error overlay:",n,r)}},cr=function(e){var r=e.error||new Error(e.message||"Unknown H5 runtime error");I(r,{source:"window.error"})},dr=function(e){I(e.reason,{source:"window.unhandledrejection"})},pr=function(){typeof window=="undefined"||G||(G=!0,window.addEventListener("error",cr),window.addEventListener("unhandledrejection",dr))},mr=function(){var e,r,n=g.useSyncExternalStore(or,J,J);if(!n.visible)return null;var s=((e=n.error)===null||e===void 0?void 0:e.name)||"Error";return i.jsx(Re,{children:i.jsxs(l,{className:"pointer-events-none fixed inset-0 z-[2147483646]",children:[i.jsx(l,{className:"pointer-events-auto fixed bottom-5 left-5",children:i.jsx(B,{variant:"outline",size:"icon",className:H("h-11 w-11 rounded-full shadow-md transition-transform"),style:{backgroundColor:"hsl(359, 100%, 97%)",borderColor:"hsl(359, 100%, 94%)",color:X},onClick:function(){return q(!n.open)},children:i.jsx(Ee,{size:22,color:X})})}),n.open&&i.jsx(l,{className:"pointer-events-none fixed inset-0 bg-white bg-opacity-15 supports-[backdrop-filter]:backdrop-blur-md",children:i.jsx(l,{className:"absolute inset-0 flex items-center justify-center px-4 py-4",children:i.jsx(l,{className:"w-full max-w-md",style:{width:"min(calc(100vw - 32px), var(--h5-phone-width, 390px))",height:"min(calc(100vh - 32px), 900px)"},children:i.jsx(Le,{className:H("pointer-events-auto h-full rounded-2xl border border-border bg-background text-foreground shadow-2xl"),children:i.jsxs(l,{className:"relative flex h-full flex-col",children:[i.jsxs(Ie,{className:"gap-2 p-4 pb-2",children:[i.jsxs(l,{className:"flex items-start justify-between gap-3",children:[i.jsxs(l,{className:"flex flex-wrap items-center gap-2",children:[i.jsx(D,{variant:"destructive",className:"border-none bg-red-500 px-3 py-1 text-xs font-medium text-white",children:"Runtime Error"}),i.jsx(D,{variant:"outline",className:"px-3 py-1 text-xs",children:n.source})]}),i.jsxs(l,{className:"flex shrink-0 items-center gap-1",children:[i.jsx(B,{variant:"ghost",size:"icon",className:"h-8 w-8 rounded-full",onClick:function(){return window.location.reload()},children:i.jsx(_e,{size:15,color:"inherit"})}),i.jsx(B,{variant:"ghost",size:"icon",className:"h-8 w-8 rounded-full",onClick:function(){return q(!1)},children:i.jsx(Ce,{size:17,color:"inherit"})})]})]}),i.jsxs(l,{className:"flex items-center justify-between gap-3",children:[i.jsx(ze,{className:"text-left text-lg",children:s}),i.jsxs(B,{variant:"outline",size:"sm",className:"shrink-0 rounded-lg",onClick:(function(){var t=f(c().m(function h(){var u;return c().w(function(p){for(;;)switch(p.n){case 0:return p.n=1,sr(n.report);case 1:if(u=p.v,!u){p.n=2;break}return $.success("已复制错误信息",{description:"可发送给 Agent 进行自动修复",position:"top-center"}),p.a(2);case 2:$.warning("复制失败",{description:"请直接选中文本后手动复制。",position:"top-center"});case 3:return p.a(2)}},h)}));function a(){return t.apply(this,arguments)}return a})(),children:[i.jsx(je,{size:15,color:"inherit"}),i.jsx(l,{children:"复制错误"})]})]})]}),i.jsx(Ve,{className:"min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-2",children:i.jsxs(l,{className:"flex h-full min-h-0 flex-col gap-2",children:[i.jsxs(l,{className:"flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border px-3 py-2 text-sm",children:[i.jsxs(l,{className:"flex items-center gap-2",children:[i.jsx(l,{className:"text-muted-foreground",children:"Error"}),i.jsx(l,{className:"font-medium text-foreground",children:((r=n.error)===null||r===void 0?void 0:r.name)||"Error"})]}),i.jsx(l,{className:"h-4 w-px bg-border"}),i.jsxs(l,{className:"flex items-center gap-2",children:[i.jsx(l,{className:"text-muted-foreground",children:"Source"}),i.jsx(l,{className:"font-medium text-foreground",children:n.source})]})]}),i.jsxs(l,{className:"min-h-0 flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-black text-white",children:[i.jsxs(l,{className:"flex items-center justify-between border-b border-white border-opacity-10 px-3 py-3",children:[i.jsx(l,{className:"text-xs font-medium uppercase tracking-wide text-zinc-400",children:"Full Report"}),i.jsx(D,{variant:"outline",className:"border-zinc-700 bg-transparent px-2 py-1 text-xs text-zinc-400",children:n.timestamp})]}),i.jsx(re,{className:"min-h-0 flex-1 w-full",orientation:"both",children:i.jsx(l,{className:"inline-block min-w-full whitespace-pre px-3 py-3 pb-8 font-mono text-xs leading-6 text-zinc-200",children:n.report})})]})]})})]})})})})})]})})},fr=(function(o){function e(){var r;Te(this,e);for(var n=arguments.length,s=new Array(n),t=0;t<n;t++)s[t]=arguments[t];return r=Fe(this,e,[].concat(s)),r.state={error:null},r}return we(e,o),ye(e,[{key:"componentDidUpdate",value:function(n){this.state.error&&n.children!==this.props.children&&this.setState({error:null})}},{key:"componentDidCatch",value:function(n,s){I(n,{source:"React Error Boundary",componentStack:s.componentStack||""})}},{key:"render",value:function(){return i.jsxs(i.Fragment,{children:[i.jsx(mr,{}),this.state.error?null:this.props.children]})}}],[{key:"getDerivedStateFromError",value:function(n){return{error:n}}}])})(g.Component),hr=function(e){var r=e.children;return i.jsx(fr,{children:r})},vr=function(e){var r=e.children;return pr(),b.useLaunch(function(){qe(),Je()}),i.jsx(hr,{children:i.jsx(nr,{children:r})})},gr=function(e){var r=e.children;return i.jsxs(Be,{defaultColor:"#000",defaultSize:24,children:[i.jsxs(vr,{children:[r,i.jsx(We,{})]}),i.jsx(Me,{})]})},_=Q.__taroAppConfig={router:{mode:"hash"},pages:["pages/index/index","pages/topics/index","pages/profile/index","pages/topic-detail/index","pages/subtopic-materials/index","pages/interview-plan/index","pages/interview-record/index","pages/authorization/index","pages/material-library/index","pages/interview-manage/index","pages/interview-script/index"],window:{backgroundTextStyle:"light",navigationBarBackgroundColor:"#FAFAF5",navigationBarTitleText:"村庄记忆",navigationBarTextStyle:"black",backgroundColor:"#FAFAF5"},tabBar:{color:"#78716C",selectedColor:"#B45309",backgroundColor:"#ffffff",borderStyle:"white",list:[{pagePath:"pages/index/index",text:"进度看板",iconPath:"./assets/tabbar/home.png",selectedIconPath:"./assets/tabbar/home-active.png"},{pagePath:"pages/topics/index",text:"话题",iconPath:"./assets/tabbar/folder-kanban.png",selectedIconPath:"./assets/tabbar/folder-kanban-active.png"},{pagePath:"pages/material-library/index",text:"资料库",iconPath:"./assets/tabbar/book-open.png",selectedIconPath:"./assets/tabbar/book-open-active.png"},{pagePath:"pages/profile/index",text:"我的",iconPath:"./assets/tabbar/user.png",selectedIconPath:"./assets/tabbar/user-active.png"}]}},C=[],j=[];C[0]="/static/images/home.png";j[0]="/static/images/home-active.png";C[1]="/static/images/folder-kanban.png";j[1]="/static/images/folder-kanban-active.png";C[2]="/static/images/book-open.png";j[2]="/static/images/book-open-active.png";C[3]="/static/images/user.png";j[3]="/static/images/user-active.png";var K=_.tabBar.list;for(var E=0;E<K.length;E++){var S=K[E];S.iconPath&&(S.iconPath=C[E]),S.selectedIconPath&&(S.selectedIconPath=j[E])}_.routes=[Object.assign({path:"pages/index/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.952ff100.js"),["./index.952ff100.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"进度看板"}),Object.assign({path:"pages/topics/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.fa90b628.js"),["./index.fa90b628.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"话题管理"}),Object.assign({path:"pages/profile/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.89356d56.js"),["./index.89356d56.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"我的"}),Object.assign({path:"pages/topic-detail/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.9b2e907b.js"),["./index.9b2e907b.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"话题详情"}),Object.assign({path:"pages/subtopic-materials/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.697f56f9.js"),["./index.697f56f9.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"子话题材料"}),Object.assign({path:"pages/interview-plan/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.443a5f73.js"),["./index.443a5f73.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"采访策划"}),Object.assign({path:"pages/interview-record/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.cf9507d2.js"),["./index.cf9507d2.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"录音转写"}),Object.assign({path:"pages/authorization/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.cc77f5af.js"),["./index.cc77f5af.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"授权管理"}),Object.assign({path:"pages/material-library/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.34622622.js"),["./index.34622622.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"资料库"}),Object.assign({path:"pages/interview-manage/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.df9a324a.js"),["./index.df9a324a.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"编辑采访记录"}),Object.assign({path:"pages/interview-script/index",load:(function(){var o=f(c().m(function r(n,s){var t;return c().w(function(a){for(;;)switch(a.n){case 0:return a.n=1,v(()=>import("./index.6f9fb350.js"),["./index.6f9fb350.js","./vendors.fdd8aad6.js","../css/vendors.8886af03.css","./common.d0673a21.js"],import.meta.url);case 1:return t=a.v,a.a(2,[t,n,s])}},r)}));function e(r,n){return o.apply(this,arguments)}return e})()},{navigationBarTitleText:"采访稿"})];Object.assign(Z,{findDOMNode:A.findDOMNode,render:A.render,unstable_batchedUpdates:A.unstable_batchedUpdates});Se();var br=ke(gr,ee,Z,_),te=Pe({window:Q});Ne(_,te);Ae(te,br,_,ee);De({designWidth:750,deviceRatio:{375:2,640:1.17,750:1,828:.905},baseFontSize:20,unitPrecision:void 0,targetUnit:void 0});
