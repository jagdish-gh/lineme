"use client";

import { useCreatorSession } from "@/components/auth/use-creator-session";
import {
  createLine,
  CreateLineRequestError
} from "@/components/create-line/create-line-api";
import {
  clearCreateLineDraft,
  saveCreateLineDraft
} from "@/components/create-line/create-line-draft";
import { CreateLineFields } from "@/components/create-line/create-line-fields";
import { CreateLineFaq } from "@/components/create-line/create-line-faq";
import { CreateLineHeader } from "@/components/create-line/create-line-header";
import { CreateLineSubmitButton } from "@/components/create-line/create-line-submit-button";
import { CreateLineSuccess } from "@/components/create-line/create-line-success";
import { JoinerQuestions } from "@/components/create-line/joiner-questions";
import { useCreateLineForm } from "@/components/create-line/use-create-line-form";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  type CreatedLine,
  type CreateLineErrorCode
} from "@/lib/lines/create-line";

export function CreateLineForm() {
  const t = useTranslations("createLine");
  const locale = useLocale();
  const router = useRouter();
  const { loading: authLoading, user } = useCreatorSession();
  const [createdLine, setCreatedLine] = useState<CreatedLine | null>(null);
  const [errorCode, setErrorCode] = useState<CreateLineErrorCode | null>(null);
  const [publishing, setPublishing] = useState(false);
  const {
    addQuestion,
    form,
    removeQuestion,
    updateForm,
    updateQuestion
  } = useCreateLineForm({
    lineName: t("defaults.lineName"),
    location: t("defaults.location"),
    joinQuestions: [
      {
        id: "question-1",
        label: t("questions.defaults.name"),
        options: [],
        required: true,
        type: "text"
      },
      {
        id: "question-2",
        label: t("questions.defaults.phone"),
        options: [],
        required: false,
        type: "phone"
      }
    ]
  });

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <CreateLineHeader
              backHref={`/${locale}`}
              backLabel={t("back")}
              eyebrow={t("eyebrow")}
              title={t("title")}
            />

            <form
              className="mt-8 grid gap-5"
              onSubmit={async (event) => {
                event.preventDefault();
                saveCreateLineDraft(form);
                setErrorCode(null);

                if (user) {
                  setPublishing(true);

                  try {
                    const result = await createLine(form);
                    clearCreateLineDraft();
                    setCreatedLine(result);
                  } catch (error) {
                    const code =
                      error instanceof CreateLineRequestError
                        ? error.code
                        : "create_failed";

                    if (code === "authentication_required") {
                      const nextPath = `/${locale}/create?resume=publish`;
                      router.push(
                        `/${locale}/auth?next=${encodeURIComponent(nextPath)}`
                      );
                      return;
                    }

                    setErrorCode(code);
                  } finally {
                    setPublishing(false);
                  }

                  return;
                }

                const nextPath = `/${locale}/create?resume=publish`;
                router.push(`/${locale}/auth?next=${encodeURIComponent(nextPath)}`);
              }}
            >
              <CreateLineFields form={form} onChange={updateForm} />
              <JoinerQuestions
                onAdd={() => addQuestion(t("questions.newQuestion"))}
                onChange={updateQuestion}
                onRemove={removeQuestion}
                questions={form.joinQuestions}
              />

              <div className="grid gap-3">
                {createdLine ? (
                  <CreateLineSuccess
                    code={createdLine.publicCode}
                    copiedLabel={t("success.copied")}
                    copyLabel={t("success.copy")}
                    description={t("success.description")}
                    lineCodeLabel={t("success.codeLabel")}
                    title={t("success.title")}
                  />
                ) : (
                  <CreateLineSubmitButton
                    authenticated={Boolean(user)}
                    createLabel={t("create")}
                    loading={authLoading || publishing}
                    loadingLabel={
                      publishing ? t("creating") : t("checkingSession")
                    }
                    signInLabel={t("submit")}
                  />
                )}
                {errorCode ? (
                  <p
                    className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300"
                    role="alert"
                  >
                    {t(`errors.${errorCode}`)}
                  </p>
                ) : null}
              </div>
              {!createdLine ? (
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {t("submitHint")}
                </p>
              ) : null}
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
            className="lg:sticky lg:top-28"
          >
            <CreateLineFaq />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
