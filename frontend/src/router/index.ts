import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/student-id',
      name: 'student-id',
      component: () => import('../views/StudentIdView.vue'),
    },
    {
      path: '/conditions',
      name: 'conditions',
      component: () => import('../views/ConditionView.vue'),
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('../views/ScheduleView.vue'),
    },
    {
      path: '/results',
      name: 'results',
      component: () => import('../views/CourseListView.vue'),
    },
  ],
})

export default router
