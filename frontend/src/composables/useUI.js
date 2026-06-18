import { ref } from 'vue';

export function useToast() {
  const toastVisible = ref(false);
  const toastMessage = ref('');
  const toastType = ref('info');

  function showToast(message, type = 'info') {
    toastMessage.value = message;
    toastType.value = type;
    toastVisible.value = true;
  }

  function closeToast() {
    toastVisible.value = false;
  }

  return {
    toastVisible,
    toastMessage,
    toastType,
    showToast,
    closeToast
  };
}

export function useConfirm() {
  const confirmVisible = ref(false);
  const confirmConfig = ref({
    title: '',
    message: '',
    type: 'info'
  });
  let resolvePromise = null;

  function showConfirm(config = {}) {
    confirmConfig.value = {
      title: config.title || '确认操作',
      message: config.message || '您确定要执行此操作吗？',
      type: config.type || 'info'
    };
    confirmVisible.value = true;

    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }

  function handleConfirm() {
    confirmVisible.value = false;
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
  }

  function handleCancel() {
    confirmVisible.value = false;
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
  }

  return {
    confirmVisible,
    confirmConfig,
    showConfirm,
    handleConfirm,
    handleCancel
  };
}
