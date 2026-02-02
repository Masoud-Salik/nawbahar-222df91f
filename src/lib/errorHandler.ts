// Utility to sanitize error messages for users
// Never expose raw database errors to users

export function sanitizeError(error: any): string {
  // Log original error for debugging
  console.error('Error:', error);
  
  // Map known error codes to user-friendly messages
  const errorCode = error?.code || '';
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // Supabase/PostgreSQL error codes
  const errorMappings: Record<string, string> = {
    '23505': 'این عملیات قبلاً انجام شده است',
    '23503': 'درخواست نامعتبر است',
    '23502': 'اطلاعات ناقص است',
    '42501': 'دسترسی رد شد',
    '22001': 'متن وارد شده بیش از حد طولانی است',
    'PGRST': 'خطای سرور. لطفاً دوباره تلاش کنید',
  };
  
  // Check for known error codes
  for (const [code, message] of Object.entries(errorMappings)) {
    if (errorCode.includes(code) || errorMessage.includes(code.toLowerCase())) {
      return message;
    }
  }
  
  // Auth-specific errors
  if (errorMessage.includes('invalid login credentials')) {
    return 'ایمیل یا رمز عبور اشتباه است';
  }
  if (errorMessage.includes('email not confirmed')) {
    return 'لطفاً ایمیل خود را تأیید کنید';
  }
  if (errorMessage.includes('user already registered')) {
    return 'این ایمیل قبلاً ثبت شده است';
  }
  if (errorMessage.includes('password')) {
    return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
  }
  if (errorMessage.includes('email')) {
    return 'ایمیل نامعتبر است';
  }
  if (errorMessage.includes('jwt') || errorMessage.includes('token')) {
    return 'نشست شما منقضی شده. لطفاً دوباره وارد شوید';
  }
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'مشکل در اتصال به اینترنت';
  }
  
  // Default message
  return 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید';
}

// Validation helpers
export const validation = {
  title: {
    minLength: 3,
    maxLength: 300,
    validate: (title: string): string | null => {
      const trimmed = title.trim();
      if (trimmed.length < validation.title.minLength) {
        return `عنوان باید حداقل ${validation.title.minLength} حرف باشد`;
      }
      if (trimmed.length > validation.title.maxLength) {
        return `عنوان نباید بیش از ${validation.title.maxLength} حرف باشد`;
      }
      return null;
    },
  },
  content: {
    minLength: 50,
    maxLength: 100000,
    validate: (content: string): string | null => {
      const trimmed = content.trim();
      if (trimmed.length < validation.content.minLength) {
        return `محتوا باید حداقل ${validation.content.minLength} حرف باشد`;
      }
      if (trimmed.length > validation.content.maxLength) {
        return `محتوا نباید بیش از ${validation.content.maxLength} حرف باشد`;
      }
      return null;
    },
  },
  comment: {
    minLength: 1,
    maxLength: 2000,
    validate: (comment: string): string | null => {
      const trimmed = comment.trim();
      if (trimmed.length < validation.comment.minLength) {
        return 'نظر نمی‌تواند خالی باشد';
      }
      if (trimmed.length > validation.comment.maxLength) {
        return `نظر نباید بیش از ${validation.comment.maxLength} حرف باشد`;
      }
      return null;
    },
  },
  displayName: {
    minLength: 2,
    maxLength: 50,
    validate: (name: string): string | null => {
      const trimmed = name.trim();
      if (trimmed.length < validation.displayName.minLength) {
        return `نام باید حداقل ${validation.displayName.minLength} حرف باشد`;
      }
      if (trimmed.length > validation.displayName.maxLength) {
        return `نام نباید بیش از ${validation.displayName.maxLength} حرف باشد`;
      }
      return null;
    },
  },
};
