<script lang="ts">
import type { TFormAutocompleteProps } from '../form/FormAutocomplete.vue'
import type { TFormColorPickerProps } from '../form/FormColorPicker.vue'
import type { TFormUsersPivotProps } from '../form/FormUsersPivot.vue'
import type { FormSubmitEvent, InputProps, SelectProps, TextareaProps } from '@nuxt/ui'

export type TBaseFormState = Record<string, any>

export type TBaseFormField = { name: string; label: string; col?: string } & (
  | { type: 'input'; props?: InputProps }
  | { type: 'textarea'; props?: TextareaProps }
  | { type: 'autocomplete'; props: TFormAutocompleteProps }
  | { type: 'team-members'; props?: TFormUsersPivotProps }
  | { type: 'color'; props?: TFormColorPickerProps }
  | { type: 'select'; props?: SelectProps }
)

export type TBaseFormProps = {
  api: string
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  fields?: TBaseFormField[]
  fieldProps?: Record<string, any>
  gridClass?: string
}
</script>

<script setup lang="ts" generic="State extends TBaseFormState">
const props = withDefaults(defineProps<TBaseFormProps>(), {
  method: 'POST',
  fields: () => [],
  fieldProps: () => ({
    size: 'lg',
    class: 'w-full'
  })
})

const formRef = useTemplateRef('formRef')

const model = defineModel<State>({
  default: () => ({})
})

const { mutate, isPending } = useMutation({
  mutationFn: (data: any) => {
    return $fetch<any>(props.api, {
      method: props.method,
      body: data
    })
  }
})

const emit = defineEmits<{
  success: [data: any]
  error: [error: any]
  cancel: []
}>()

const onSubmit = async (event: FormSubmitEvent<any>) => {
  mutate(event.data, {
    onSuccess(data) {
      emit('success', data)
    },
    onError(error) {
      const { message, errors } = parseError(error)
      if (errors?.length) formRef.value?.setErrors(errors)
      else {
        formRef.value?.setErrors([
          {
            name: props.fields?.[0]?.name ?? 'name',
            message
          }
        ])
      }
      emit('error', error)
    }
  })
}

const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <UForm
    ref="formRef"
    :state="model"
    @submit="onSubmit"
  >
    <div
      :class="gridClass"
      class="grid grid-cols-1 gap-4"
    >
      <UFormField
        v-for="row in fields"
        :key="row.name"
        :name="row.name"
        :label="row.label"
        :class="row.col"
      >
        <UInput
          v-if="row.type === 'input'"
          v-model="model[row.name]"
          v-bind="{ ...fieldProps, ...row.props }"
        />
        <UTextarea
          v-else-if="row.type === 'textarea'"
          v-model="model[row.name]"
          v-bind="{ ...fieldProps, ...row.props }"
        />
        <FormAutocomplete
          v-else-if="row.type === 'autocomplete'"
          v-model="model[row.name]"
          v-bind="{ ...fieldProps, ...row.props }"
        />
        <FormUsersPivot
          v-else-if="row.type === 'team-members'"
          v-model="model[row.name]"
          v-bind="{ ...fieldProps, ...row.props }"
        />
        <FormColorPicker
          v-else-if="row.type === 'color'"
          v-model="model[row.name]"
          v-bind="{ ...fieldProps, ...row.props }"
        />
        <USelect
          v-else-if="row.type === 'select'"
          v-model="model[row.name]"
          v-bind="{ ...fieldProps, ...row.props }"
        />
      </UFormField>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <UButton
        icon="i-lucide-x"
        type="button"
        color="error"
        variant="subtle"
        @click="onCancel"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        icon="i-lucide-send"
        :loading="isPending"
      >
        Submit
      </UButton>
    </div>
  </UForm>
</template>
