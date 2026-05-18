<script lang="ts">
import type { TBaseFormProps, TBaseFormState } from './BaseForm.vue'
import type { ModalProps } from '@nuxt/ui'

export type TBaseFormModalProps = TBaseFormProps & Pick<ModalProps, 'title' | 'description'>
</script>

<script setup lang="ts" generic="State extends TBaseFormState">
const props = defineProps<TBaseFormModalProps>()
const open = defineModel<boolean>('open', {
  default: false
})
const model = defineModel<State>({
  default: () => ({})
})
const onSuccess = (data: any) => {
  open.value = false
  props.onSuccess?.(data)
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
  >
    <template #body>
      <BaseForm
        v-model="model"
        :api="api"
        :method="method"
        :fields="fields"
        :grid-class="gridClass"
        :field-props="fieldProps"
        :on-success="onSuccess"
        :on-error="onError"
      />
    </template>
  </UModal>
</template>
