import type { ChangePasswordTranslation } from "./types";

export const changePasswordTranslation: Record<
  "id" | "en",
  ChangePasswordTranslation & Record<string, string>
> = {
  id: {
    title: "Ganti Kata Sandi",
    oldPassword: "Kata Sandi Lama",
    newPassword: "Kata Sandi Baru",
    confirmPassword: "Konfirmasi Kata Sandi",
    cancel: "Batal",
    save: "Simpan",
    errOldIncorrect: "Kata sandi lama salah.",
    errMinLength: "Kata sandi minimal 8 karakter.",
    errUppercase: "Kata sandi harus mengandung minimal satu huruf besar.",
    errLowercase: "Kata sandi harus mengandung minimal satu huruf kecil.",
    errNumber: "Kata sandi harus mengandung minimal satu angka.",
    errSamePassword: "Kata sandi baru tidak boleh sama dengan yang lama.",
    errFormIncomplete: "Pastikan form terisi dengan benar dan konfirmasi kata sandi cocok.",
    errDefault: "Terjadi kesalahan saat mengubah kata sandi.",
    success: "Kata sandi berhasil diperbarui.",
  },

  en: {
    title: "Change Password",
    oldPassword: "Old Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    cancel: "Cancel",
    save: "Save",
    errOldIncorrect: "Old password is incorrect.",
    errMinLength: "Password must be at least 8 characters.",
    errUppercase: "Password must contain at least one uppercase letter.",
    errLowercase: "Password must contain at least one lowercase letter.",
    errNumber: "Password must contain at least one number.",
    errSamePassword: "New password must be different.",
    errFormIncomplete: "Please ensure the form is filled correctly and passwords match.",
    errDefault: "An error occurred while changing the password.",
    success: "Password updated successfully.",
  },
};
