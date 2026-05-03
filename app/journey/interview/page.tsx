import Link from "next/link";
import { I18nText } from "@/components/I18nText";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

interface InterviewPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function InterviewPage({ searchParams }: InterviewPageProps) {
  const { code } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container container--medium">
          <div className="page-eyebrow">
            <I18nText zh="引导之旅" en="Guided Journey" />
          </div>
          <h1 className="page-title">
            <I18nText block zh="访谈路由已建立" en="Interview route is ready" />
          </h1>
          <p className="page-lede">
            <I18nText zh="访问码" en="Code" />:{" "}
            <strong>{code ?? "missing"}</strong>
            <I18nText
              block
              zh="这里是后续迁移 5 个校准问题、42 个主问题、雷达图和报告生成的位置。"
              en="This is where the calibration questions, 42-question interview, radar chart, and report generation will be migrated next."
            />
          </p>
          <div className="page-actions">
            <Link href="/" className="btn">
              ← <I18nText zh="输入另一个访问码" en="Enter another code" />
            </Link>
            <Link href="/method" className="btn">
              <I18nText zh="查看方法" en="View method" />
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
