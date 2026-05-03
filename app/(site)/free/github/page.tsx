import Link from "next/link";
import { I18nText } from "@/components/I18nText";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function GitHubExportPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container container--medium">
          <div className="page-eyebrow">
            <I18nText zh="自由入口" en="Free Entry" />
          </div>
          <h1 className="page-title">
            <I18nText block zh="导出到 GitHub" en="Export to GitHub" />
          </h1>
          <div className="notice-card">
            <div className="page-eyebrow">
              <I18nText zh="设置中" en="Setup pending" />
            </div>
            <h2>
              <I18nText
                zh="GitHub OAuth 尚未接入"
                en="GitHub OAuth not yet wired"
              />
            </h2>
            <p className="muted">
              <I18nText
                block
                zh="暂时请下载框架文件，并手动放入你的仓库。OAuth 流程留到后续迭代。"
                en="For now, download the framework file and place it manually in your repository. The OAuth flow belongs to a later iteration."
              />
            </p>
            <div className="page-actions">
              <a href="/brand-archetypes-v5.md" download className="btn">
                ↓ <I18nText zh="下载 .md" en="Download .md" />
              </a>
              <Link href="/" className="btn">
                ← <I18nText zh="返回首页" en="Back home" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
