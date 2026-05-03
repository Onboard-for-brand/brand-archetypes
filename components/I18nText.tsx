import type { ReactNode } from "react";

interface I18nTextProps {
  zh: ReactNode;
  en: ReactNode;
  block?: boolean;
  className?: string;
}

export function I18nText({ zh, en, block = false, className = "" }: I18nTextProps) {
  const displayClass = block ? "i18n-block" : "i18n-inline";
  const classes = `${displayClass} ${className}`.trim();

  return (
    <>
      <span className={`i18n-zh ${classes}`} lang="zh-CN">
        {zh}
      </span>
      <span className={`i18n-en ${classes}`} lang="en">
        {en}
      </span>
    </>
  );
}
