import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'all-items', component: () => import('./views/AllItemsView.vue') },
  { path: '/balance', name: 'balance', component: () => import('./views/BalanceView.vue') },
  { path: '/scans', name: 'scans-list', component: () => import('./views/ScansListView.vue') },
  { path: '/scan/new', name: 'scan-new', component: () => import('./views/ScanNewView.vue') },
  { path: '/scan/new/camera', name: 'scan-new-camera', component: () => import('./views/ScanCameraView.vue') },
  { path: '/scan/new/upload', name: 'scan-new-upload', component: () => import('./views/ScanUploadView.vue') },
  { path: '/scan/new/url', name: 'scan-new-url', component: () => import('./views/ScanUrlView.vue') },
  { path: '/scan/new/manual', name: 'scan-new-manual', component: () => import('./views/ScanManualView.vue') },
  { path: '/scan/:id', name: 'scan-detail', component: () => import('./views/ScanDetailView.vue'), props: true },
  { path: '/scan/:id/split', name: 'scan-split', component: () => import('./views/SplitView.vue'), props: true },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
