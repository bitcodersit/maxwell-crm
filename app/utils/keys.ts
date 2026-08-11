export const keys = {
  task(id: MaybeRefOrGetter<number>) {
    return ['/api/tasks/{id}', id]
  },
  tasks(query?: MaybeRefOrGetter<Record<string, any>>) {
    return query ? ['/api/tasks', query] : ['/api/tasks']
  },
  tasksOverview() {
    return ['/api/tasks/overview']
  },
  target(id: MaybeRefOrGetter<number>) {
    return ['/api/targets/{id}', id]
  },
  targetHistory(id: MaybeRefOrGetter<number>) {
    return ['/api/targets/{id}/history', id]
  },
  targets(query?: MaybeRefOrGetter<Record<string, any>>) {
    return query ? ['/api/targets', query] : ['/api/targets']
  },
  targetsOverview() {
    return ['/api/targets/overview']
  },
  lead(id: MaybeRefOrGetter<string>) {
    return ['/api/leads/{id}', id]
  },
  leadDetail(id: MaybeRefOrGetter<string>) {
    return ['lead-detail', id]
  }
}
