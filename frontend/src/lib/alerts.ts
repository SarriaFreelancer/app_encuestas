import Swal from 'sweetalert2';

export const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#4f46e5',
    confirmButtonText: 'Aceptar',
    customClass: {
      popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl',
      title: 'text-lg font-black text-slate-900 dark:text-white',
      htmlContainer: 'text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300',
      confirmButton: 'px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30'
    }
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'Entendido',
    customClass: {
      popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl',
      title: 'text-lg font-black text-slate-900 dark:text-white',
      htmlContainer: 'text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300',
      confirmButton: 'px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-rose-600/30'
    }
  });
};

export const showWarningAlert = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonColor: '#f59e0b',
    confirmButtonText: 'De acuerdo',
    customClass: {
      popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl',
      title: 'text-lg font-black text-slate-900 dark:text-white',
      htmlContainer: 'text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300',
      confirmButton: 'px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-amber-600/30'
    }
  });
};

export const showConfirmAlert = async (title: string, text?: string, confirmText = 'Sí, continuar', cancelText = 'Cancelar') => {
  return Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl',
      title: 'text-lg font-black text-slate-900 dark:text-white',
      htmlContainer: 'text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300',
      confirmButton: 'px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 mr-2',
      cancelButton: 'px-6 py-3 rounded-2xl font-bold text-sm shadow-md'
    }
  });
};
