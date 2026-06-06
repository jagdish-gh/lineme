type AuthErrorLike = {
  code?: string;
  message: string;
};

export function isProviderDisabledError(error: AuthErrorLike) {
  return (
    error.code === "validation_failed" &&
    error.message.toLowerCase().includes("unsupported provider")
  );
}
