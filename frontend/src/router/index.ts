import { createRouter, createWebHistory } from 'vue-router'
import StudentIdView from '../views/StudentIdView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import { currentUser } from '../auth'
import { store } from '../store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ScheduleView,
    },
    {
      path: '/student-id',
      name: 'student-id',
      component: StudentIdView,
    },
    {
      path: '/conditions',
      name: 'conditions',
      component: () => import('../views/ConditionView.vue'),
    },
    {
      path: '/schedule',
      redirect: '/',
    },
    {
      path: '/results',
      name: 'results',
      component: () => import('../views/CourseListView.vue'),
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('../views/FriendsView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'friends' && !currentUser.value) {
    return { name: 'home' }
  }

  if (!store.department && to.name !== 'student-id') {
    return { name: 'student-id' }
  }

  if (
    store.department &&
    !store.isHumanInfoStudent &&
    to.name !== 'student-id' &&
    to.name !== 'conditions'
  ) {
    return { name: 'conditions' }
  }
})

export default router
